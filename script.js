/* ============================================================
   Handcraftbandit — public site interactions
   nav state · mobile drawer · scroll reveals · hero parallax · email form
   Vanilla JS, no dependencies, no build step.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- year ---- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- nav: transparent -> solid on scroll ---- */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    if (window.scrollY > window.innerHeight * 0.62) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---- mobile drawer ---- */
  var drawer = document.getElementById("drawer");
  var open = document.getElementById("menuToggle");
  var close = document.getElementById("drawerClose");
  function setDrawer(state) {
    drawer.classList.toggle("open", state);
    drawer.setAttribute("aria-hidden", state ? "false" : "true");
    document.body.style.overflow = state ? "hidden" : "";
  }
  if (open) open.addEventListener("click", function () { setDrawer(true); });
  if (close) close.addEventListener("click", function () { setDrawer(false); });
  drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setDrawer(false); });
  });
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

  /* ---- hero parallax ---- */
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
     NOTE: this is a client-side-only confirmation. No data is sent anywhere yet.
     When you choose an email provider (Mailchimp / Klaviyo / etc.), wire the submit
     handler to POST the address to that provider's endpoint or to a Worker route.
     This form never touches Square and carries no secrets. */
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
     Everything above is safe to ship publicly on GitHub Pages: it is purely
     presentational and contains NO credentials.

     ───────────────── SECURE BACKEND BEGINS IN THE CLOUDFLARE WORKER ─────────
     The homepage above is fully static and editorial — it does NOT call Square.

     When we add individual product pages (Sprint 4), they will talk ONLY to our
     own Cloudflare Worker at api.handcraftbandit.com — never to Square directly.

     WHY WE NEVER CALL SQUARE FROM THE BROWSER:
     Browser JavaScript served from GitHub Pages is 100% public — anyone can read
     it via "View Source" or DevTools. A Square access token placed here would be
     instantly stolen and could be used to read/modify the catalog, orders and
     payments. Square access tokens are credentials and must live ONLY inside
     Cloudflare Worker secrets (encrypted, server-side). The Worker holds the
     token, talks to Square, and returns only safe, public-friendly JSON.

     The module below is DORMANT on the homepage (no calls are made here). It is
     the contract the product pages will use. It contains NO secrets — only the
     public URL of our own Worker.
     ========================================================================== */

  // Public base URL of OUR Worker (not Square). Safe to expose — it holds no secret.
  var API_BASE_URL = "https://api.handcraftbandit.com";

  // Exposed for the future product pages to import/use. Intentionally unused here.
  window.HCB = window.HCB || {};
  window.HCB.api = {
    base: API_BASE_URL,

    // GET /products — live catalog from Square, proxied + sanitised by the Worker.
    fetchProducts: function () {
      return fetch(API_BASE_URL + "/products", { headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("Products unavailable");
          return r.json();
        });
    },

    // POST /create-checkout-link — Worker asks Square for a hosted checkout URL.
    // We send ONLY the variation id + quantity. Price is decided server-side by
    // Square from the catalog — the frontend price is never trusted.
    createCheckout: function (variationId, quantity) {
      return fetch(API_BASE_URL + "/create-checkout-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationId: variationId, quantity: quantity || 1 })
      })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error(data && data.error ? data.error : "Checkout failed");
            return data; // { checkoutUrl: "https://..." }
          });
        });
    }

    // Usage on a product page (Sprint 4):
    //   window.HCB.api.createCheckout(variationId, 1)
    //     .then(function (data) { window.location.href = data.checkoutUrl; })
    //     .catch(function (err) { /* show friendly "Checkout failed" message */ });
  };
})();
