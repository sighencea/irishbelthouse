# Handcraftbandit — Square Worker (`api.irishbelthouse.com`)

A small, focused Cloudflare Worker that sits between the public website
(`irishbelthouse.com`, static on GitHub Pages) and **Square**. The browser talks
only to this Worker; the Worker holds the Square access token as an encrypted
secret and talks to Square server-side.

```
Browser (public, no secrets)  ──▶  this Worker (secret token)  ──▶  Square API
```

**Why:** browser JavaScript is public. A Square access token is a credential —
it must never live in frontend code. It lives only in a Cloudflare secret.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Liveness check. Returns `{ "ok": true, "service": "handcraftbandit-square-worker" }`. No Square call. |
| GET  | `/products` | Sanitised catalog from Square. Add `?slug=heritage` to fetch one product. |
| POST | `/create-checkout-link` | Body `{ "variationId", "quantity" }` → `{ "checkoutUrl" }`. Square prices it (frontend price is never trusted). *Built/ready; the belt pages currently use Add-to-Bag and don't call it yet.* |

---

## What you need (one-time)

1. **Node.js 18+** installed (`node -v`).
2. A **Cloudflare account** (free) — https://dash.cloudflare.com/sign-up
3. A **Square account** with API access — https://developer.squareup.com/apps
4. (For `api.irishbelthouse.com`) your domain **on Cloudflare DNS** — optional; see *Deploy*.

> ⚠️ **Never paste your Square access token into chat, the repo, `wrangler.toml`,
> or any frontend file.** It only ever goes into a Cloudflare secret via the
> `wrangler secret put` command you run on your own machine.

---

## Step 1 — Get your Square credentials

### Access token (start with **sandbox**)
1. Go to the **Square Developer Dashboard** → https://developer.squareup.com/apps
2. Open your application (or create one).
3. In the left nav choose **Sandbox** (top) to stay safe while testing.
4. Open **Credentials** → copy the **Sandbox Access Token**.
   - For go-live later, switch to **Production** and copy the **Production Access Token** instead.

### Location ID
- In the Developer Dashboard, open **Locations** (under your app) — copy the
  **Location ID** for the environment you're using (sandbox vs production each
  have their own).
- Or via API once your token is set:
  ```bash
  curl https://connect.squareupsandbox.com/v2/locations \
    -H "Authorization: Bearer YOUR_SANDBOX_TOKEN" \
    -H "Square-Version: 2026-06-06"
  ```
  Use the `id` of your location.

### API version
- The current **Square-Version** is shown in the Developer Dashboard / API
  changelog. Put it in `wrangler.toml` (`SQUARE_VERSION`). If `/products`
  returns a version error, replace it with the exact value Square shows you.

---

## Step 2 — Install & configure

```bash
cd worker
npm install
```

Edit **`wrangler.toml`** and set the non-secret values:
- `SQUARE_ENVIRONMENT` = `"sandbox"` (keep for testing)
- `SQUARE_VERSION` = the version from your dashboard
- `SQUARE_LOCATION_ID` = your sandbox location id
- `ALLOWED_ORIGINS` / `CHECKOUT_REDIRECT_URL` — already set for irishbelthouse.com

Set the **secret** (this prompts you to paste the token; it is encrypted and
never written to disk in the repo):
```bash
npx wrangler login                       # opens browser to authorise Cloudflare
npx wrangler secret put SQUARE_ACCESS_TOKEN
# (paste your SANDBOX access token when prompted)
```

For **local dev**, wrangler reads secrets from a git-ignored `.dev.vars` file
instead. Create `worker/.dev.vars` (already git-ignored):
```
SQUARE_ACCESS_TOKEN=your_sandbox_access_token_here
```

---

## Step 3 — Run & test locally

```bash
npm run dev        # wrangler dev → http://localhost:8787
```

```bash
# health
curl http://localhost:8787/health
# → {"ok":true,"service":"handcraftbandit-square-worker"}

# products (sanitised; no token anywhere in the response)
curl http://localhost:8787/products
curl "http://localhost:8787/products?slug=heritage"

# checkout link (optional/future) — returns only { checkoutUrl }
curl -X POST http://localhost:8787/create-checkout-link \
  -H "Content-Type: application/json" \
  -d '{"variationId":"YOUR_SQUARE_VARIATION_ID","quantity":1}'
```

---

## Step 4 — Deploy

```bash
npx wrangler deploy
```
This gives you a URL like
`https://handcraftbandit-square-worker.<your-subdomain>.workers.dev`.

### Attach `api.irishbelthouse.com` (recommended)
Requires `irishbelthouse.com` to be **on Cloudflare DNS** (free plan is fine).
1. Cloudflare dashboard → **Workers & Pages** → open this worker.
2. **Settings → Domains & Routes → Add → Custom domain** → `api.irishbelthouse.com`.
3. Cloudflare creates the DNS record and TLS automatically.

> **Don't want to move DNS to Cloudflare yet?** Skip the custom domain and use
> the `*.workers.dev` URL above. Then set `API_BASE_URL` in the site's
> `script.js` to that URL. You can switch to `api.irishbelthouse.com` later.

### Go to production (after sandbox testing passes)
1. In `wrangler.toml` set `SQUARE_ENVIRONMENT = "production"` and the
   **production** `SQUARE_LOCATION_ID`.
2. Re-set the secret with your **production** token:
   `npx wrangler secret put SQUARE_ACCESS_TOKEN`
3. `npx wrangler deploy`.

---

## Square catalog prerequisite (for the product pages)

The product pages read `/products` and match each Square item to its editorial
record by **`slug`**. In Square, give each of the 6 items a stable slug — easiest
is to set the variation **SKU** to the slug:

| Product | slug (SKU) |
|---|---|
| The Everyday Belt | `everyday` |
| The Heritage Belt | `heritage` |
| The Founder's Belt | `founders` |
| The Wallet | `wallet` |
| The Card Holder | `card-holder` |
| The A5 Notepad Sleeve | `a5-sleeve` |

(Each item also needs a price and, optionally, an image and inventory tracking.)

---

## ✅ Deployment checklist
- [ ] `npm install` in `worker/`
- [ ] `wrangler.toml`: `SQUARE_ENVIRONMENT`, `SQUARE_VERSION`, `SQUARE_LOCATION_ID`, origins
- [ ] `wrangler login` done
- [ ] `wrangler secret put SQUARE_ACCESS_TOKEN` (correct environment's token)
- [ ] `wrangler deploy` succeeds
- [ ] Custom domain `api.irishbelthouse.com` attached (or workers.dev URL noted)
- [ ] `script.js` `API_BASE_URL` matches the deployed URL

## ✅ Local testing checklist
- [ ] `.dev.vars` has `SQUARE_ACCESS_TOKEN` (sandbox)
- [ ] `/health` returns ok
- [ ] `/products` returns items with price/stock/images and a `slug`
- [ ] `/products?slug=heritage` returns just that product
- [ ] `/create-checkout-link` returns a `checkoutUrl` (sandbox)
- [ ] Response bodies contain **no** token or raw Square error detail

## ✅ Production security checklist
- [ ] Token exists **only** as a Cloudflare secret — never in repo/frontend/`wrangler.toml`
- [ ] `git grep -i "sq0\|EAAA\|access_token"` finds nothing in the repo
- [ ] `ALLOWED_ORIGINS` has no `*` wildcard; only your real origins
- [ ] Errors return `{ "error": "..." }` with no internal/Square detail
- [ ] Browser DevTools → Network shows the site calling the Worker, never Square
- [ ] Sandbox flow fully verified before switching to production token
- [ ] `SQUARE_ENVIRONMENT` and the token are the **same** environment

---

## Troubleshooting
- **Version error on `/products`** → set `SQUARE_VERSION` to the exact value in
  your Square dashboard.
- **CORS error in the browser** → the calling origin must be in `ALLOWED_ORIGINS`
  (re-deploy after editing). `curl` ignores CORS, so test origins in a browser.
- **Empty `products`** → items need a price/variation and shouldn't be deleted;
  confirm you're pointed at the environment (sandbox/production) that has them.
- **401/403 from Square** → token/environment mismatch (sandbox token with
  production base URL or vice-versa).
