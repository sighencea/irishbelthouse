# Deploying irishbelthouse.com

Two independent pieces:

## 1. Public website — GitHub Pages (no Square, no build step)
Static files at the repo root: `index.html`, `styles.css`, `script.js`,
`thank-you.html`, `404.html`, `assets/`, `CNAME`, `robots.txt`, `sitemap.xml`.

1. Commit & push to `main`.
2. **GitHub → Settings → Pages** → deploy from `main` / root.
3. Custom domain is set by the `CNAME` file (`irishbelthouse.com`). DNS at your
   registrar / Cloudflare:
   - Apex `irishbelthouse.com` → GitHub Pages A/AAAA records
     (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153` + their IPv6).
   - `www` → CNAME `sighencea.github.io`.
4. Tick **Enforce HTTPS** once the certificate provisions.
5. (Later) add `handcraftbandit.com` as an additional domain that redirects here.

✅ Verify: https://irishbelthouse.com loads, hero paints, three "Companions"
cards show, mobile drawer works.

## 2. Secure API — Cloudflare Worker (`api.irishbelthouse.com`)
Lives in `worker/`. It is **not** part of the GitHub Pages site and is never
deployed there. Full instructions and checklists: **[`worker/README.md`](worker/README.md)**.

Short version:
```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put SQUARE_ACCESS_TOKEN   # paste sandbox token; never commit it
npm run dev                                   # test locally on :8787
npx wrangler deploy                           # then attach api.irishbelthouse.com
```

## Security rule (non-negotiable)
The Square access token lives **only** as a Cloudflare secret. It must never
appear in the website, `script.js`, the repo, or `wrangler.toml`. The browser
calls the Worker; the Worker calls Square.
