/**
 * ============================================================================
 * Handcraftbandit / Irish Belt House — Square API proxy
 * Cloudflare Worker · api.irishbelthouse.com
 * ============================================================================
 *
 * WHY THIS EXISTS (the security boundary):
 * The public website (irishbelthouse.com) is static and served from GitHub
 * Pages. Anything in that frontend — HTML, JS, config — is 100% public and can
 * be read by anyone. A Square access token is a CREDENTIAL: with it, someone
 * could read and modify your catalog, orders and payments. So the token must
 * NEVER appear in browser code.
 *
 * This Worker is the secure server-side middle layer. The browser talks ONLY to
 * this Worker; the Worker holds the Square token (as an encrypted Cloudflare
 * secret), talks to Square, and returns only safe, public-friendly JSON. The
 * token never leaves the server.
 *
 *   Browser (public)  ──fetch──▶  this Worker (secret token)  ──▶  Square API
 *
 * Endpoints:
 *   GET  /health                → liveness check (no Square call)
 *   GET  /products[?slug=…]      → sanitised catalog (price/stock/images)
 *   POST /create-checkout-link   → Square-hosted checkout URL (optional/future)
 *
 * IMPORTANT — CORS IS NOT ACCESS CONTROL. ALLOWED_ORIGINS only instructs
 * *browsers* to block cross-origin reads; curl/scripts ignore it entirely.
 * Both endpoints must be treated as fully public to the internet. That is why
 * this Worker also enforces, server-side:
 *   · a per-IP rate limit on both endpoints (abuse / API-quota protection)
 *   · an explicit publish allowlist on /products (never trust "it's not linked")
 * See PUBLIC_SLUGS below.
 *
 * Secrets & config (set OUTSIDE this file):
 *   SQUARE_ACCESS_TOKEN   ← secret  (wrangler secret put SQUARE_ACCESS_TOKEN)
 *   SQUARE_LOCATION_ID    ← var/secret
 *   SQUARE_ENVIRONMENT    ← var ("sandbox" | "production")
 *   SQUARE_VERSION        ← var (Square-Version header, e.g. "2026-06-06")
 *   ALLOWED_ORIGINS       ← var (comma-separated CORS allowlist)
 *   CHECKOUT_REDIRECT_URL ← var (post-payment redirect)
 *   PUBLIC_SLUGS          ← var (comma-separated publish allowlist)
 *   CATALOG_TTL_SECONDS   ← var (edge cache lifetime for /products)
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
 * RateLimiter — Durable Object, one instance per (endpoint, client IP).
 *
 * WHY A DURABLE OBJECT AND NOT THE `[[ratelimits]]` BINDING:
 * The native binding was tried first and measured as ineffective here — with the
 * limit set to 1 per 10s, eight sequential requests all passed, and 40 concurrent
 * requests all passed. Its counter is per-isolate and best-effort, so it never
 * sees a second request that lands on a fresh isolate. A Durable Object is
 * single-threaded and strongly consistent: every request for a given IP is
 * routed to the SAME instance, so the count is authoritative.
 *
 * Sliding window: we keep the timestamps inside the period and count them, which
 * avoids the burst-across-the-boundary flaw of fixed windows (2× the limit in an
 * instant at a window edge).
 * -------------------------------------------------------------------------- */
export class RateLimiter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const limit = Math.max(1, parseInt(url.searchParams.get("limit"), 10) || 10);
    const period = Math.max(1, parseInt(url.searchParams.get("period"), 10) || 60);

    const now = Date.now();
    const windowStart = now - period * 1000;

    let hits = (await this.state.storage.get("hits")) || [];
    hits = hits.filter((t) => t > windowStart);

    const allowed = hits.length < limit;
    if (allowed) {
      hits.push(now);
      // Bound the array so a sustained flood can't grow storage without limit.
      if (hits.length > limit * 4) hits = hits.slice(-limit * 4);
      await this.state.storage.put("hits", hits);
      // Self-clean: drop this instance's storage once the window has fully aged
      // out, so we don't retain a row per IP forever.
      await this.state.storage.setAlarm(now + period * 2000);
    }

    return new Response(
      JSON.stringify({ allowed, retryAfter: period }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  async alarm() {
    await this.state.storage.deleteAll();
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    // CORS preflight — answer before doing anything else.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/health") {
        return json(200, { ok: true, service: "handcraftbandit-square-worker" }, cors);
      }
      if (url.pathname === "/products" && request.method === "GET") {
        // Deliberately NOT rate limited: it is edge-cached, so a flood is served
        // from cache and Square sees at most ~1 call per minute per location.
        // A Durable Object hop here would add latency to every page load for no
        // real gain.
        return await handleProducts(url, env, cors, ctx);
      }
      if (url.pathname === "/create-checkout-link" && request.method === "POST") {
        if (await rateLimited(env, request, "checkout")) return tooMany(cors);
        return await handleCheckout(request, env, cors);
      }
      return json(404, { error: "Not found." }, cors);
    } catch (err) {
      // Log minimally server-side; never return token/internal detail to the client.
      console.log("worker error:", err && err.message);
      return json(500, { error: "Something went wrong. Please try again." }, cors);
    }
  }
};

/* ----------------------------------------------------------------------------
 * CORS — strict allowlist, no wildcard in production.
 * Only origins listed in ALLOWED_ORIGINS get an Access-Control-Allow-Origin
 * header reflected back; everyone else is blocked by the browser.
 * -------------------------------------------------------------------------- */
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400"
  };
  if (origin && allowedOrigins(env).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(status, body, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
  });
}

/* ----------------------------------------------------------------------------
 * Rate limiting — the real (non-CORS) abuse control.
 *
 * /create-checkout-link is unauthenticated by necessity: shoppers are not logged
 * in. Without a limit, anyone can script it and mint unlimited Square payment
 * links — no money moves, but it floods the Square dashboard with junk orders
 * and can burn the API quota real customers need to check out.
 *
 * Routes to a Durable Object keyed on endpoint + client IP (see RateLimiter).
 *
 * FAILS OPEN BY DESIGN. If the binding is missing or the DO errors, we allow the
 * request rather than close the shop. For a checkout path that is the right
 * trade — a broken limiter must never cost a sale. (For something like a login
 * endpoint you would want the opposite: fail closed.)
 * -------------------------------------------------------------------------- */
async function rateLimited(env, request, kind) {
  if (!env.RATE_LIMITER) return false; // fail open

  const limit = Math.max(1, parseInt(env.CHECKOUT_LIMIT, 10) || 10);
  const period = 60;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  try {
    const id = env.RATE_LIMITER.idFromName(kind + ":" + ip);
    const stub = env.RATE_LIMITER.get(id);
    const res = await stub.fetch(
      "https://rate-limiter.internal/check?limit=" + limit + "&period=" + period
    );
    const data = await res.json();
    return data.allowed === false;
  } catch (e) {
    console.log("rate limiter unavailable:", e && e.message);
    return false; // fail open
  }
}

function tooMany(cors) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again shortly." }),
    {
      status: 429,
      headers: { "Content-Type": "application/json; charset=utf-8", "Retry-After": "60", ...cors }
    }
  );
}

/* ----------------------------------------------------------------------------
 * Square helpers
 * -------------------------------------------------------------------------- */
function squareBase(env) {
  return env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

async function squareFetch(env, path, init = {}) {
  return fetch(squareBase(env) + path, {
    ...init,
    headers: {
      "Authorization": "Bearer " + env.SQUARE_ACCESS_TOKEN,
      "Square-Version": env.SQUARE_VERSION || "",
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(init.headers || {})
    }
  });
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatMoney(m) {
  if (!m || typeof m.amount !== "number") return null;
  const currency = m.currency || "EUR";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  const major = m.amount / 100;
  const formatted = symbol + major.toFixed(2).replace(/\.00$/, "");
  return { amount: m.amount, currency, formatted };
}

/* ----------------------------------------------------------------------------
 * GET /products  (+ optional ?slug=heritage to fetch a single product)
 *
 * Returns a SIMPLIFIED, public-safe shape — Square is the source of truth for
 * price/stock/images. The website's editorial copy (story, swatches, specs)
 * lives in the frontend and is matched to these records by `slug`.
 * -------------------------------------------------------------------------- */
async function handleProducts(url, env, cors, ctx) {
  if (!env.SQUARE_ACCESS_TOKEN) {
    return json(500, { error: "Server is not configured yet." }, cors);
  }

  const wantSlug = (url.searchParams.get("slug") || "").trim().toLowerCase();

  /* --- Edge cache -----------------------------------------------------------
   * Without this, every page load fanned out to Square live, so a traffic spike
   * became a 1:1 Square API spike (slow pages, and a real risk of hitting
   * Square's rate limits mid-checkout).
   *
   * We cache the PAYLOAD ONLY, under a synthetic key, and re-attach CORS headers
   * per request. Caching the finished Response would be a security bug: its
   * Access-Control-Allow-Origin is specific to whoever missed the cache first,
   * and would then be replayed to every other origin. */
  const cache = caches.default;
  const cacheKey = new Request(
    "https://catalog-cache.internal/products?slug=" + encodeURIComponent(wantSlug)
  );

  const hit = await cache.match(cacheKey);
  if (hit) {
    return new Response(await hit.text(), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "X-Cache": "HIT", ...cors }
    });
  }

  // Pull items + related images/categories. Loop on cursor in case the catalog
  // grows beyond one page (capped so a misconfig can't loop forever).
  const items = [];
  const imageById = {};
  const categoryById = {};
  const optionById = {}; // Square "item options" (e.g. Colour, Size) → name + ordered values
  let cursor = undefined;

  for (let page = 0; page < 10; page++) {
    const res = await squareFetch(env, "/v2/catalog/search", {
      method: "POST",
      body: JSON.stringify({
        object_types: ["ITEM"],
        include_related_objects: true,
        include_deleted_objects: false,
        ...(cursor ? { cursor } : {})
      })
    });

    if (!res.ok) {
      console.log("square /products non-200:", res.status);
      return json(502, { error: "Could not load products right now." }, cors);
    }

    const data = await res.json();
    for (const o of data.objects || []) items.push(o);
    for (const o of data.related_objects || []) {
      if (o.type === "IMAGE" && o.image_data && o.image_data.url) imageById[o.id] = o.image_data.url;
      if (o.type === "CATEGORY" && o.category_data) categoryById[o.id] = o.category_data.name;
      if (o.type === "ITEM_OPTION" && o.item_option_data) {
        const vmap = {}; const order = [];
        for (const v of o.item_option_data.values || []) {
          if (v.item_option_value_data) { vmap[v.id] = v.item_option_value_data.name; order.push(v.id); }
        }
        optionById[o.id] = { name: o.item_option_data.name, values: vmap, order: order };
      }
    }

    cursor = data.cursor;
    if (!cursor) break;
  }

  let products = items
    .filter((it) => !it.is_deleted && it.item_data)
    .filter((it) => isVisibleInSquare(it, env))
    .map((it) => mapItem(it, imageById, categoryById, optionById))
    .filter((p) => p.variations.length > 0);

  // Publish allowlist — the important one. See applyPublishAllowlist().
  products = applyPublishAllowlist(products, env);

  // Slug is the join key with the website, so it must be unique. Duplicate
  // names in Square (e.g. four "Handbag (Coming soon)" items) collapse to the
  // same slug; keeping them all would make ?slug=… ambiguous and let the
  // frontend's bySlug map silently pick whichever happened to be last.
  const bySlug = new Set();
  products = products.filter((p) => {
    if (bySlug.has(p.slug)) {
      console.log("duplicate slug skipped:", p.slug);
      return false;
    }
    bySlug.add(p.slug);
    return true;
  });

  // Best-effort live stock (made-to-order items simply stay "available").
  await attachStock(products, env);

  if (wantSlug) products = products.filter((p) => p.slug === wantSlug);

  const payload = JSON.stringify({ products });
  const ttl = Math.max(0, parseInt(env.CATALOG_TTL_SECONDS, 10) || 60);

  if (ttl > 0) {
    // Store the bare payload (no CORS headers — see the note above).
    const toCache = new Response(payload, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=" + ttl
      }
    });
    const put = cache.put(cacheKey, toCache);
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(put);
    else await put;
  }

  return new Response(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=" + ttl,
      "X-Cache": "MISS",
      ...cors
    }
  });
}

/* ----------------------------------------------------------------------------
 * Publish allowlist — decides which catalog items the public may see.
 *
 * A Square catalog is an INTERNAL business record, not a shop window. This one
 * contains wholesale price lines, unreleased products and internal add-ons that
 * must not be readable by competitors or customers. "It isn't linked from the
 * site" is not protection: /products is a public URL and anyone can fetch it.
 *
 * PUBLIC_SLUGS is an explicit, opt-in list of slugs to publish. Default-deny:
 * a new item added in Square is private until it is named here, so nobody can
 * leak a draft by creating it in the Square dashboard.
 *
 * If PUBLIC_SLUGS is empty we fall back to publishing everything that passed
 * the Square visibility checks — this keeps a fresh/unconfigured deploy working
 * rather than serving an empty shop, but it is NOT the intended production
 * state. Keep PUBLIC_SLUGS populated.
 * -------------------------------------------------------------------------- */
function applyPublishAllowlist(products, env) {
  const allow = String(env.PUBLIC_SLUGS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!allow.length) {
    console.log("PUBLIC_SLUGS is empty — publishing entire visible catalog");
    return products;
  }

  const allowed = new Set(allow);
  return products.filter((p) => allowed.has(p.slug));
}

/* Square-side visibility. Conservative on purpose: an item is only excluded
 * when Square explicitly marks it hidden/archived, or when it is scoped to a
 * different location. Items with no visibility set stay published. */
function isVisibleInSquare(it, env) {
  const d = it.item_data;

  if (d.is_archived === true) return false;

  // ecom_visibility: UNINDEXED | UNAVAILABLE | HIDDEN | VISIBLE
  const vis = d.ecom_visibility;
  if (vis === "HIDDEN" || vis === "UNAVAILABLE") return false;

  // Item scoped to specific locations that don't include ours (e.g. a
  // wholesale-only or in-person-only line).
  if (env.SQUARE_LOCATION_ID && it.present_at_all_locations === false) {
    const ids = it.present_at_location_ids || [];
    if (!ids.includes(env.SQUARE_LOCATION_ID)) return false;
  }

  return true;
}

// Size tokens used to label a derived option column as "Size" (vs "Colour").
const SIZE_TOKENS = new Set([
  "xxxs", "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "one size", "os"
]);
function looksLikeSize(v) { return SIZE_TOKENS.has(String(v).toLowerCase().trim()); }

/* Fallback option sets for a catalogue built on FLAT variations.
 *
 * Most of this Square catalogue stores choices as flat variations whose names
 * encode the selection, joined by ", " the way Square does it — e.g.
 *   "Black, XXXS"  →  Colour: Black · Size: XXXS
 *   "Tan"          →  Colour: Tan
 * There are no structured `item_options`, so the PDP would otherwise show no
 * selectors. We reconstruct Colour/Size option sets from the names and write a
 * matching `selections` map onto each variation, so the page can render swatches
 * + a size dropdown and resolve the chosen variation exactly as it would for
 * real Square item options.
 *
 * Conservative on purpose: only fires when EVERY variation name splits into the
 * same number of columns (1 or 2). Anything irregular is left as-is. Mutates the
 * passed variations' `selections`; returns the option sets (or null). */
function deriveOptionsFromNames(variations) {
  if (variations.length < 2) return null;
  const split = variations.map((v) =>
    String(v.name || "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const cols = split[0].length;
  if (cols < 1 || cols > 2) return null;
  if (!split.every((p) => p.length === cols)) return null;

  // Ordered, de-duplicated values per column.
  const colVals = [];
  for (let c = 0; c < cols; c++) {
    const seen = new Set(); const vals = [];
    for (const p of split) { const val = p[c]; if (!seen.has(val)) { seen.add(val); vals.push(val); } }
    colVals.push(vals);
  }

  // Name each column: all-size → "Size"; first column → "Colour"; else "Style".
  const names = colVals.map((vals, c) => {
    if (vals.every(looksLikeSize)) return "Size";
    return c === 0 ? "Colour" : "Style";
  });
  if (names.length === 2 && names[0] === names[1]) return null; // ambiguous, bail

  // Write selections back onto each variation so resolveVariation() can match.
  variations.forEach((v, i) => {
    const sel = {};
    split[i].forEach((val, c) => { sel[names[c]] = val; });
    v.selections = sel;
  });

  return names.map((n, c) => ({ name: n, values: colVals[c] }));
}

function mapItem(it, imageById, categoryById, optionById) {
  const d = it.item_data;

  const images = (d.image_ids || []).map((id) => imageById[id]).filter(Boolean);

  // Category — handle legacy `category_id`, newer `categories[]`, reporting category.
  let category = null;
  if (d.category_id && categoryById[d.category_id]) {
    category = categoryById[d.category_id];
  } else if (Array.isArray(d.categories) && d.categories.length && categoryById[d.categories[0].id]) {
    category = categoryById[d.categories[0].id];
  } else if (d.reporting_category && categoryById[d.reporting_category.id]) {
    category = categoryById[d.reporting_category.id];
  }

  // Structured option sets (Colour, Size, …) in their defined order.
  const options = [];
  for (const ref of d.item_options || []) {
    const od = optionById[ref.item_option_id];
    if (od) options.push({ name: od.name, values: od.order.map((id) => od.values[id]) });
  }

  const variations = (d.variations || []).map((v) => {
    const vd = v.item_variation_data || {};
    // Map this variation's chosen option values → { "Colour": "Black", "Size": "L" }
    const selections = {};
    for (const ov of vd.item_option_values || []) {
      const od = optionById[ov.item_option_id];
      if (od) selections[od.name] = od.values[ov.item_option_value_id];
    }
    return {
      id: v.id,
      name: vd.name || "",
      sku: vd.sku || null,
      price: formatMoney(vd.price_money),
      selections,
      stockStatus: "available"
    };
  });

  // No structured Square item options? Derive Colour/Size selectors from the
  // flat variation names (this catalogue's convention) so the PDP still works.
  let optionSets = options;
  if (options.length === 0 && variations.length > 1) {
    try {
      const derived = deriveOptionsFromNames(variations);
      if (derived) optionSets = derived;
    } catch (e) { /* leave selectors off; page falls back to the first variation */ }
  }

  // From-price = cheapest priced variation.
  const priced = variations.filter((v) => v.price);
  const fromPrice = priced.length
    ? priced.reduce((min, v) => (v.price.amount < min.price.amount ? v : min), priced[0]).price
    : null;

  // slug = the join key with the website. Match is by PRODUCT (not variant SKU):
  // a "slug" custom attribute if present, otherwise the slugified product name.
  let slug = null;
  const ca = it.custom_attribute_values || {};
  for (const k in ca) {
    const val = ca[k];
    if (val && val.string_value && (/slug/i.test(val.name || "") || /slug/i.test(k))) {
      slug = val.string_value.toLowerCase().trim();
      break;
    }
  }
  if (!slug) slug = slugify(d.name);

  return {
    id: it.id,
    slug,
    name: d.name || "",
    description: d.description_plaintext || d.description || "",
    category,
    price: fromPrice,
    currency: fromPrice ? fromPrice.currency : null,
    imageUrl: images[0] || null,
    images,
    options: optionSets,
    variations,
    stockStatus: "available"
  };
}

/* Best-effort inventory. If an item doesn't track stock, it stays "available"
 * (correct for made-to-order belts). Never fails the whole request. */
async function attachStock(products, env) {
  if (!env.SQUARE_LOCATION_ID) return;

  const variationIds = [];
  for (const p of products) for (const v of p.variations) variationIds.push(v.id);
  if (!variationIds.length) return;

  try {
    const res = await squareFetch(env, "/v2/inventory/counts/batch-retrieve", {
      method: "POST",
      body: JSON.stringify({
        catalog_object_ids: variationIds,
        location_ids: [env.SQUARE_LOCATION_ID]
      })
    });
    if (!res.ok) return;

    const data = await res.json();
    const qtyById = {};
    for (const c of data.counts || []) {
      if (c.state === "IN_STOCK") {
        qtyById[c.catalog_object_id] = (qtyById[c.catalog_object_id] || 0) + Number(c.quantity || 0);
      }
    }

    for (const p of products) {
      let tracked = false;
      let total = 0;
      for (const v of p.variations) {
        if (v.id in qtyById) {
          tracked = true;
          const q = qtyById[v.id];
          total += q;
          v.stockStatus = q > 0 ? "in_stock" : "out_of_stock";
        }
      }
      if (tracked) p.stockStatus = total > 0 ? "in_stock" : "out_of_stock";
    }
  } catch (e) {
    // Stock is a nice-to-have; ignore failures and leave "available".
    console.log("inventory lookup skipped:", e && e.message);
  }
}

/* ----------------------------------------------------------------------------
 * POST /create-checkout-link
 *   Body: { items: [{ variationId, quantity }, ...] }   (a whole cart)
 *   Back-compat: { variationId, quantity }              (a single item)
 *
 * Creates a Square-hosted payment link for the basket. SECURITY: we accept only
 * variation ids + quantities. The PRICE of every line is decided server-side by
 * Square from the catalog — the frontend price is never trusted. Returns only
 * { checkoutUrl }.
 * -------------------------------------------------------------------------- */
async function handleCheckout(request, env, cors) {
  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID) {
    return json(500, { error: "Server is not configured yet." }, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid request." }, cors);
  }

  // Accept a cart (items[]) or a single { variationId, quantity }.
  const rawItems = Array.isArray(body && body.items)
    ? body.items
    : (body && body.variationId ? [{ variationId: body.variationId, quantity: body.quantity }] : []);

  const line_items = [];
  for (const it of rawItems) {
    const vid = it && typeof it.variationId === "string" ? it.variationId.trim() : "";
    if (!vid) continue;
    let q = it && it.quantity != null ? parseInt(it.quantity, 10) : 1;
    if (!Number.isFinite(q) || q < 1) q = 1;
    if (q > 25) q = 25;
    line_items.push({ catalog_object_id: vid, quantity: String(q) });
  }

  if (!line_items.length) return json(400, { error: "Your bag is empty." }, cors);
  if (line_items.length > 50) return json(400, { error: "Too many items in one order." }, cors);

  const redirectUrl = env.CHECKOUT_REDIRECT_URL || "https://irishbelthouse.com/thank-you.html";

  const res = await squareFetch(env, "/v2/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      // Every line references a catalog variation by id → Square prices it.
      // No amount is sent; the frontend cannot influence what is charged.
      order: {
        location_id: env.SQUARE_LOCATION_ID,
        line_items
      },
      checkout_options: { redirect_url: redirectUrl, ask_for_shipping_address: true }
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.payment_link || !data.payment_link.url) {
    console.log("square checkout non-200:", res.status);
    return json(502, { error: "Could not start checkout. Please try again." }, cors);
  }

  return json(200, { checkoutUrl: data.payment_link.url }, cors);
}
