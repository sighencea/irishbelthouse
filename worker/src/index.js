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
 * Secrets & config (set OUTSIDE this file):
 *   SQUARE_ACCESS_TOKEN   ← secret  (wrangler secret put SQUARE_ACCESS_TOKEN)
 *   SQUARE_LOCATION_ID    ← var/secret
 *   SQUARE_ENVIRONMENT    ← var ("sandbox" | "production")
 *   SQUARE_VERSION        ← var (Square-Version header, e.g. "2026-06-06")
 *   ALLOWED_ORIGINS       ← var (comma-separated CORS allowlist)
 *   CHECKOUT_REDIRECT_URL ← var (post-payment redirect)
 * ============================================================================
 */

export default {
  async fetch(request, env) {
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
        return await handleProducts(url, env, cors);
      }
      if (url.pathname === "/create-checkout-link" && request.method === "POST") {
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
async function handleProducts(url, env, cors) {
  if (!env.SQUARE_ACCESS_TOKEN) {
    return json(500, { error: "Server is not configured yet." }, cors);
  }

  const wantSlug = (url.searchParams.get("slug") || "").trim().toLowerCase();

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
    .map((it) => mapItem(it, imageById, categoryById, optionById))
    .filter((p) => p.variations.length > 0);

  // Best-effort live stock (made-to-order items simply stay "available").
  await attachStock(products, env);

  if (wantSlug) products = products.filter((p) => p.slug === wantSlug);

  return json(200, { products }, cors);
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
    options,
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
