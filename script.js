/* ============================================================
   Handcraftbandit — shared site interactions
   Used by BOTH the homepage (index.html) and the product pages
   (product.html). Vanilla JS, no dependencies, no build step.

   nav state · mobile drawer · scroll reveals · hero parallax ·
   email form · public API helper · homepage live-price overlay
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- year ---- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- nav: transparent over hero -> solid otherwise ----
     On pages with no dark hero (e.g. product pages) the nav is solid
     immediately; on the homepage it turns solid after scrolling past the hero. */
  var nav = document.getElementById("nav");
  var hasHero = !!document.getElementById("hero");
  function onScrollNav() {
    if (!nav) return;
    if (!hasHero || window.scrollY > window.innerHeight * 0.62) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---- mobile drawer ---- */
  var drawer = document.getElementById("drawer");
  var open = document.getElementById("menuToggle");
  var close = document.getElementById("drawerClose");
  function setDrawer(state) {
    if (!drawer) return;
    drawer.classList.toggle("open", state);
    drawer.setAttribute("aria-hidden", state ? "false" : "true");
    document.body.style.overflow = state ? "hidden" : "";
  }
  if (open) open.addEventListener("click", function () { setDrawer(true); });
  if (close) close.addEventListener("click", function () { setDrawer(false); });
  if (drawer) {
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setDrawer(false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setDrawer(false);
  });

  /* ---- scroll reveals ---- */
  var revealEls = document.querySelectorAll(".reveal, .stagger");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- hero parallax (homepage only — guarded by #heroBg) ---- */
  var heroBg = document.getElementById("heroBg");
  if (heroBg && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroBg.style.transform = "translate3d(0," + (y * 0.18) + "px,0) scale(1.06)";
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---- email form (visual-only placeholder) ----
     Client-side confirmation only — no data leaves the browser yet. Wire to your
     ESP (Mailchimp/Klaviyo) later. Never touches Square; carries no secrets. */
  var form = document.getElementById("eform");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("email");
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (!ok) {
        input.focus();
        form.style.borderColor = "var(--oxblood)";
        return;
      }
      form.classList.add("sent");
      form.innerHTML =
        '<p style="font-family:var(--serif);font-size:22px;color:var(--ink);' +
        'padding:14px 0;margin:0;">Welcome. Your first letter from the workshop is on its way.</p>';
    });
  }

  /* ==========================================================================
     ───────────────── FRONTEND ENDS HERE ─────────────────
     Everything above is presentational and safe to ship publicly.

     ───────────────── SECURE BACKEND LIVES IN THE CLOUDFLARE WORKER ──────────
     The site never calls Square directly. It calls OUR Worker, which holds the
     Square access token as an encrypted Cloudflare secret and talks to Square
     server-side. Browser JS is public, so a Square token here would be stolen
     instantly — it must only ever live in the Worker.

     The object below contains NO secrets — only the PUBLIC url of our Worker.
     ========================================================================== */

  // Public base URL of OUR Worker (not Square). Auto-switches to the local dev
  // server when you're running the site locally.
  var API_BASE_URL = (function () {
    var h = location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || location.protocol === "file:") {
      return "http://localhost:8787";
    }
    return "https://handcraftbandit-square-worker.hcb-luxury.workers.dev";
  })();

  window.HCB = window.HCB || {};
  window.HCB.api = {
    base: API_BASE_URL,

    // GET /products  (optional slug → single product). Returns an array.
    fetchProducts: function (slug) {
      var url = API_BASE_URL + "/products" + (slug ? "?slug=" + encodeURIComponent(slug) : "");
      // No `cache: "no-store"` — the Worker sends Cache-Control: max-age, and
      // bypassing it turned every pageview into a live Square API call.
      // Prices/stock are at most CATALOG_TTL_SECONDS stale, which is fine.
      return fetch(url, { headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("Products unavailable");
          return r.json();
        })
        .then(function (d) { return (d && d.products) || []; });
    },

    // POST /create-checkout-link — Worker asks Square for a hosted checkout URL.
    // We send only the variation id + quantity; Square decides the price.
    createCheckout: function (variationId, quantity) {
      return fetch(API_BASE_URL + "/create-checkout-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationId: variationId, quantity: quantity || 1 })
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data && data.error ? data.error : "Checkout failed");
          return data; // { checkoutUrl }
        });
      });
    }
  };

  // POST the whole basket → Worker → Square hosted checkout URL.
  window.HCB.api.checkout = function (items) {
    return fetch(API_BASE_URL + "/create-checkout-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data && data.error ? data.error : "Checkout failed");
        return data; // { checkoutUrl }
      });
    });
  };

  /* ---- Shopping bag (cart) ----
     Stored in the browser (localStorage). Holds only product selections — no
     secrets. At checkout the basket goes to the Worker, which asks Square for a
     hosted payment page; Square charges the catalog price, not anything here. */
  window.HCB.cart = {
    KEY: "hcb_cart",
    read: function () { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; } },
    write: function (items) { try { localStorage.setItem(this.KEY, JSON.stringify(items)); } catch (e) {} updateBag(); },
    add: function (line) {
      var items = this.read();
      var ex = items.filter(function (i) { return i.variationId === line.variationId; })[0];
      if (ex) { ex.qty = Math.min(25, ex.qty + (line.qty || 1)); } else { items.push(line); }
      this.write(items);
    },
    setQty: function (variationId, qty) {
      var items = this.read();
      var i = items.filter(function (x) { return x.variationId === variationId; })[0];
      if (i) i.qty = Math.max(1, Math.min(25, qty | 0));
      this.write(items);
    },
    remove: function (variationId) {
      this.write(this.read().filter(function (i) { return i.variationId !== variationId; }));
    },
    clear: function () { this.write([]); },
    count: function () { return this.read().reduce(function (n, i) { return n + (i.qty || 1); }, 0); },
    total: function () { return this.read().reduce(function (s, i) { return s + (i.amount || 0) * (i.qty || 1); }, 0); }
  };

  // Reflect the bag count in any [data-cart-count] element (the nav badge).
  function updateBag() {
    var n = window.HCB.cart.count();
    document.querySelectorAll("[data-cart-count]").forEach(function (b) {
      b.textContent = n;
      var link = b.closest("[data-cart-link]");
      if (link) link.setAttribute("aria-label", "Bag, " + n + " item" + (n === 1 ? "" : "s"));
    });
  }
  updateBag();

  /* ---- Homepage live-price overlay (decision B) ----
     Keeps the editorial cards exactly as designed, but quietly refreshes each
     card's price (and marks sold-out) from live Square data. Runs only on the
     homepage (skips product pages) and fails silently → static prices remain. */
  if (document.body.getAttribute("data-page") !== "product") {
    var priceCards = document.querySelectorAll("[data-slug]");
    if (priceCards.length && window.HCB.api) {
      window.HCB.api.fetchProducts().then(function (products) {
        var bySlug = {};
        products.forEach(function (p) { bySlug[p.slug] = p; });
        priceCards.forEach(function (card) {
          var p = bySlug[card.getAttribute("data-slug")];
          if (!p || !p.price) return;
          var priceEl = card.querySelector(".price");
          if (!priceEl) return;
          var sub = priceEl.querySelector("span");        // small uppercase note
          priceEl.textContent = "From " + p.price.formatted;
          if (sub) priceEl.appendChild(sub);              // re-attach the note
          if (p.stockStatus === "out_of_stock") {
            var link = card.querySelector(".tlink");
            if (link) link.textContent = "Sold out";
          }
        });
      }).catch(function () { /* keep the static prices */ });
    }
  }
})();
