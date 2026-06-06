/* ============================================================
   Handcraftbandit — product page renderer
   ?belt=everyday|heritage|founders  or  ?item=wallet|card-holder|a5-sleeve

   HYBRID model:
   - PRODUCTS below = editorial layer (story, specs, photos, gallery briefs).
   - The Cloudflare Worker (/products) = live commerce layer from Square:
     price, stock, images, and the real OPTION SETS (Colour, Size) + variations.
   The join key with Square is the PRODUCT NAME (slugified) — NOT a SKU, because
   in Square the SKU lives on the variant, not the product.
   ============================================================ */
(function () {
  "use strict";

  /* Editorial layer — keyed by the short URL slug. `name` must match the Square
     item name (we match on slugify(name)). Options come from Square at runtime. */
  var PRODUCTS = {
    everyday: {
      slug: "everyday", family: "belts",
      eyebrow: "I · Everyday",
      name: "Everyday Belt", crumb: "Everyday Belt",
      tagline: "The first belt you reach for, and the last you'll need to buy.",
      price: "€145", priceNote: "Made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "Everyday Belt — honest Italian vegetable-tanned leather, a hand-set brass buckle, made to order in Midleton, Ireland.",
      gallery: [
        { note: "everyday belt — full length on linen · soft daylight" },
        { note: "brass buckle — three-quarter detail" },
        { note: "keeper & edge detail" },
        { note: "rolled — showing the leather thickness" }
      ],
      storyImg: { note: "cut from a single length of hide · round knife", oak: false },
      storyHead: "Honest leather, made the slow way.",
      storyBody: [
        "The Everyday Belt is cut from a single length of premium Italian vegetable-tanned leather — no bonded scraps, no plastic core, nothing to crack or peel. Just one honest strip of hide that will soften and darken with the years.",
        "The edges are bevelled and burnished by hand, the brass buckle set so it can be unscrewed and re-used, and the whole thing finished to be worn hard and worn daily."
      ],
      storyQuote: "Buy it once. Wear it for years.",
      details: [
        ["Leather", "Italian vegetable-tanned"],
        ["Tannage", "Slow bark tannage"],
        ["Hardware", "Solid brass, hand-set"],
        ["Stitch", "Edge-stitched, hand-finished"],
        ["Width", "35 mm"],
        ["Thickness", "3.5–4 mm"],
        ["Made", "To order in Midleton, Ireland"],
        ["Lead time", "≈ 3 weeks"]
      ],
      assure: [
        "Hand-finished in Midleton, Ireland",
        "Lifetime repairs — restored, not replaced",
        "Made to order · ships in ≈ 3 weeks",
        "Complimentary shipping within Ireland"
      ]
    },

    heritage: {
      slug: "heritage", family: "belts",
      eyebrow: "II · Heritage",
      name: "Heritage Belt", crumb: "Heritage Belt",
      tagline: "Fully hand-stitched with the traditional saddle stitch — the belt we are known for.",
      price: "€245", priceNote: "Hand stitched · made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "Heritage Belt — fully hand saddle-stitched Italian vegetable-tanned leather, made to order in Midleton, Ireland.",
      gallery: [
        { note: "heritage belt — full length · raking light on the stitch" },
        { note: "saddle stitch — close detail" },
        { note: "hand-set buckle" },
        { note: "burnished edge — full length" }
      ],
      storyImg: { note: "two needles, one thread — saddle stitch by hand", oak: true },
      storyHead: "Stitched entirely by hand. Locked to last.",
      storyBody: [
        "Every hole is marked and pricked by hand, then stitched the traditional way — two needles and one waxed thread, crossing through each hole and locking as they go. It is slow, deliberate work measured in hours rather than minutes.",
        "Unlike a machine seam, a hand saddle-stitch does not unravel. Should a single stitch ever fail, the ones on either side hold fast. It is the belt our customers most often pass on."
      ],
      storyQuote: "We do not create seasonal fashion. We create future heirlooms.",
      details: [
        ["Leather", "Italian vegetable-tanned"],
        ["Tannage", "Slow bark tannage"],
        ["Hardware", "Solid brass, hand-set"],
        ["Stitch", "Hand saddle-stitch, ≈ 6 spi"],
        ["Width", "35 mm"],
        ["Thickness", "3.5–4 mm"],
        ["Made", "To order in Midleton, Ireland"],
        ["Lead time", "≈ 4 weeks"]
      ],
      assure: [
        "Hand saddle-stitched in Midleton, Ireland",
        "Lifetime repairs — restored, not replaced",
        "Made to order · ships in ≈ 4 weeks",
        "Complimentary shipping within Ireland"
      ]
    },

    founders: {
      slug: "founders", family: "belts",
      eyebrow: "III · Founder's · Numbered",
      name: "Founder's Belt", crumb: "Founder's Belt",
      tagline: "Our flagship. Individually numbered, signed, and made in a run of fifty each year.",
      price: "From €480", priceNote: "Numbered edition · 50 a year",
      mode: "enquire", cta: "Enquire to Commission",
      meta: "Founder's Belt — our numbered flagship, limited to 50 pieces a year, commissioned and hand-made in Midleton, Ireland.",
      gallery: [
        { note: "founder's belt — dramatic low light · numbered medallion", oak: true },
        { note: "numbered & signed by the maker", oak: true },
        { note: "hand-aged brass buckle", oak: true },
        { note: "full-grain leather — macro detail" }
      ],
      storyImg: { note: "the maker's bench · the finest hide of the year", oak: true },
      storyHead: "The finest hide of the year. Numbered by hand.",
      storyBody: [
        "The Founder's Belt begins with the best hide the maker can source that year, finished to the standard he holds his own work to. Each piece is individually numbered, signed, and recorded — and we make no more than fifty in a year.",
        "It is less a purchase than a commission. We will speak with you about leather, hardware and fit, then make a single belt intended to outlive its first owner and be passed on."
      ],
      storyQuote: "Fifty a year. Never repeated.",
      details: [
        ["Leather", "Premium full-grain Italian veg-tan"],
        ["Edition", "Numbered, limited to 50 a year"],
        ["Hardware", "Solid brass, hand-aged"],
        ["Stitch", "Hand saddle-stitch"],
        ["Width", "35 mm"],
        ["Finishing", "Hand-signed by the maker"],
        ["Made", "Commissioned in Midleton, Ireland"],
        ["Lead time", "6–8 weeks"]
      ],
      assure: [
        "Numbered & signed by the maker",
        "Hand saddle-stitched in Midleton, Ireland",
        "Lifetime repairs — restored, not replaced",
        "A personal commission consultation"
      ]
    },

    wallet: {
      slug: "wallet", family: "goods",
      eyebrow: "Everyday Carry",
      name: "Wallet", crumb: "Wallet",
      tagline: "A slim bifold that softens and moulds to your pocket over the years.",
      price: "€120", priceNote: "Made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "Wallet — a slim hand-stitched bifold in Italian vegetable-tanned leather, made to order in Midleton, Ireland.",
      gallery: [
        { note: "the wallet — open bifold · veg-tan · soft daylight" },
        { note: "card slots — hand-stitched detail" },
        { note: "folded — slim profile in the hand" },
        { note: "edge — burnished by hand" }
      ],
      storyImg: { note: "saddle-stitched card slots · two needles, one thread", oak: false },
      storyHead: "Cut from the same hide as the belts.",
      storyBody: [
        "The Wallet is made from a single piece of the same premium Italian vegetable-tanned leather as our belts — unlined, so it stays slim and ages honestly. No plastic, no bonded filler, nothing to peel.",
        "Every pocket is saddle-stitched by hand and the edges are bevelled and burnished, so it wears in rather than wears out."
      ],
      storyQuote: "Slim to begin with. Better with age.",
      details: [
        ["Leather", "Italian vegetable-tanned"],
        ["Construction", "Unlined bifold"],
        ["Hardware", "None — pure leather"],
        ["Stitch", "Hand saddle-stitch"],
        ["Pockets", "Four card slots · two sleeves"],
        ["Finishing", "Hand-burnished edges"],
        ["Made", "To order in Midleton, Ireland"],
        ["Lead time", "≈ 3 weeks"]
      ],
      assure: [
        "Hand-stitched in Midleton, Ireland",
        "Lifetime repairs — restored, not replaced",
        "Made to order · ships in ≈ 3 weeks",
        "Complimentary shipping within Ireland"
      ]
    },

    "card-holder": {
      slug: "card-holder", family: "goods",
      eyebrow: "Everyday Carry",
      name: "Card Holder", crumb: "Card Holder",
      tagline: "The most minimal piece we make — a few cards, a folded note, nothing more.",
      price: "€75", priceNote: "Made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "Card Holder — a minimal hand-finished card holder in Italian vegetable-tanned leather, made to order in Midleton, Ireland.",
      gallery: [
        { note: "card holder — single panel · burnished edges · soft daylight" },
        { note: "three pockets — hand-stitched" },
        { note: "in the hand — minimal profile" },
        { note: "edge detail — bevelled and burnished" }
      ],
      storyImg: { note: "a single panel of leather, folded and stitched", oak: false },
      storyHead: "The least we can make. Made well.",
      storyBody: [
        "A single panel of vegetable-tanned leather, folded and hand-stitched into three close pockets. There is nothing to it but good leather and good stitching — which is precisely the point.",
        "It starts firm and tailors itself to your cards over a few weeks, then holds that shape for years."
      ],
      storyQuote: "Everything you need. Nothing you don't.",
      details: [
        ["Leather", "Italian vegetable-tanned"],
        ["Construction", "Single-panel, folded"],
        ["Stitch", "Hand saddle-stitch"],
        ["Pockets", "Three card pockets"],
        ["Carry", "Cards · a folded note"],
        ["Finishing", "Hand-burnished edges"],
        ["Made", "To order in Midleton, Ireland"],
        ["Lead time", "≈ 2 weeks"]
      ],
      assure: [
        "Hand-stitched in Midleton, Ireland",
        "Lifetime repairs — restored, not replaced",
        "Made to order · ships in ≈ 2 weeks",
        "Complimentary shipping within Ireland"
      ]
    },

    "a5-sleeve": {
      slug: "a5-sleeve", family: "goods",
      eyebrow: "The Desk",
      name: "A5 Notepad Sleeve", crumb: "A5 Notepad Sleeve",
      tagline: "A refillable A5 sleeve, made to be reloaded for years.",
      price: "€165", priceNote: "Refillable · made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "A5 Notepad Sleeve — a refillable hand-stitched leather folio for an A5 notebook, made to order in Midleton, Ireland.",
      gallery: [
        { note: "a5 sleeve — closed folio · veg-tan · desk light", oak: true },
        { note: "open — notebook seated inside · hand stitching" },
        { note: "spine — burnished edge detail" },
        { note: "on the desk — with pen and notebook" }
      ],
      storyImg: { note: "the sleeve open · a fresh A5 notebook seated inside", oak: true },
      storyHead: "One sleeve. A lifetime of notebooks.",
      storyBody: [
        "Most notebooks are bought, filled and thrown away. The A5 Sleeve is made to outlast all of them — a single panel of the same hide as our belts, hand-stitched into a folio that holds a standard A5 notebook and lets you slip in the next one when it's full.",
        "It is the desk companion to the belt: slow leather, hand-burnished edges, and a patina that records every meeting and morning it has seen."
      ],
      storyQuote: "Refill it for years. Never replace it.",
      details: [
        ["Leather", "Italian vegetable-tanned"],
        ["Fits", "Standard A5 notebook"],
        ["Construction", "Refillable folio"],
        ["Stitch", "Hand saddle-stitch"],
        ["Finishing", "Hand-burnished edges"],
        ["Made", "To order in Midleton, Ireland"],
        ["Lead time", "≈ 4 weeks"]
      ],
      assure: [
        "Refillable — fits a standard A5 notebook",
        "Hand-stitched in Midleton, Ireland",
        "Lifetime repairs — restored, not replaced",
        "Made to order · ships in ≈ 4 weeks"
      ]
    }
  };

  var ORDER_BELTS = ["everyday", "heritage", "founders"];
  var ORDER_GOODS = ["wallet", "card-holder", "a5-sleeve"];
  var SECTION = {
    belts: { label: "Collection", href: "index.html#collection", head: "The rest of the collection." },
    goods: { label: "Leather Goods", href: "index.html#goods", head: "More leather goods." }
  };

  // Colour name → swatch hex (best-effort; unknown colours render as a labelled pill).
  var COLOUR_HEX = {
    "black": "#201c19", "brown": "#5a3a22", "medium brown": "#6b4327", "golden brown": "#b07a3c",
    "chestnut": "#6b4327", "hazel": "#8a6a44", "cognac": "#7a4a24", "tan": "#c8a26a",
    "oxblood": "#5a201c", "natural": "#c9ad84", "white": "#efe7d6", "aqua green": "#3f8f82",
    "green": "#3f7a4f", "purple": "#6a4c93", "red": "#9b2d2a", "royal blue": "#2c4a8a",
    "blue": "#2c4a8a", "yellow": "#caa53a"
  };
  function colourHex(name) { return COLOUR_HEX[String(name).toLowerCase().trim()] || null; }

  /* ---------- helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function slugify(s) {
    return String(s || "").toLowerCase().trim()
      .replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function setPh(fig, item) {
    var oak = item && item.oak;
    fig.className = "ph " + (oak ? "ph--oak" : "ph--warm") +
      (fig.classList.contains("pdp-hero") ? " pdp-hero" : "") +
      (fig.id === "storyImg" ? " reveal" : "");
    var cap = fig.querySelector(".ph__note");
    if (cap) { cap.style.display = ""; cap.textContent = item ? item.note : ""; }
    fig.style.backgroundImage = "";
  }
  function showImage(fig, url) {
    fig.style.backgroundImage = "url('" + url + "')";
    fig.style.backgroundSize = "cover";
    fig.style.backgroundPosition = "center";
    var cap = fig.querySelector(".ph__note");
    if (cap) cap.style.display = "none";
  }
  function hrefFor(R) {
    return "product.html?" + (R.family === "goods" ? "item=" : "belt=") + R.slug;
  }

  /* ---------- resolve product ---------- */
  var params = new URLSearchParams(location.search);
  var slug = (params.get("belt") || params.get("item") || "everyday").toLowerCase();
  if (!PRODUCTS[slug]) slug = "everyday";
  var P = PRODUCTS[slug];
  var sec = SECTION[P.family] || SECTION.belts;

  var state = { variationId: null, selected: {} };
  var LIVE = null;

  /* ---------- head + headline + breadcrumb ---------- */
  document.title = P.name + " — Handcraftbandit | Irish Belt House";
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", P.meta);

  var crumbSection = document.getElementById("crumbSection");
  crumbSection.textContent = sec.label;
  crumbSection.href = sec.href;
  document.getElementById("crumbName").textContent = P.crumb;
  document.getElementById("relatedHead").textContent = sec.head;

  document.getElementById("pEyebrow").textContent = P.eyebrow;
  document.getElementById("pName").textContent = P.name;
  document.getElementById("pTagline").textContent = P.tagline;
  setPrice(P.price);

  function setPrice(text) {
    document.getElementById("pPrice").innerHTML =
      text + ' <span class="pnote">' + P.priceNote + "</span>";
  }

  /* ---------- gallery (editorial placeholders) ---------- */
  var galMain = document.getElementById("galMain");
  setPh(galMain, P.gallery[0]);
  var thumbs = document.getElementById("galThumbs");
  thumbs.innerHTML = "";
  P.gallery.forEach(function (g, i) {
    var t = el("figure", "ph " + (g.oak ? "ph--oak" : "ph--warm") + (i === 0 ? " sel" : ""));
    t.appendChild(el("figcaption", "ph__note", g.note));
    t.addEventListener("click", function () {
      setPh(galMain, g);
      thumbs.querySelectorAll(".ph").forEach(function (x) { x.classList.remove("sel"); });
      t.classList.add("sel");
    });
    thumbs.appendChild(t);
  });

  /* ---------- CTA ---------- */
  var opts = document.getElementById("pOptions");
  var cta = document.getElementById("pCta");
  var btn = el("button", "btn btn--primary btn--arrow", P.cta);
  var confirm = el("p", "pconfirm");
  cta.appendChild(btn);

  function setBuyEnabled(on) {
    if (P.mode !== "buy") return;
    if (on) {
      btn.removeAttribute("disabled");
      if (btn.textContent !== "Added ✓") btn.textContent = P.cta;
      btn.classList.add("btn--arrow");
      btn.style.opacity = ""; btn.style.cursor = "";
    } else {
      btn.setAttribute("disabled", "");
      btn.textContent = "Currently unavailable";
      btn.classList.remove("btn--arrow");
      btn.style.opacity = "0.55"; btn.style.cursor = "not-allowed";
    }
  }

  function variantSummary() {
    var parts = Object.keys(state.selected).map(function (k) { return state.selected[k]; });
    return parts.length ? parts.join(" · ") : "made to order";
  }

  if (P.mode === "buy") {
    cta.appendChild(confirm);
    btn.addEventListener("click", function () {
      if (btn.hasAttribute("disabled")) return;
      confirm.innerHTML = "Added to your bag —<br><span style='color:var(--ink-55);font-size:14px;'>" +
        P.name + " · " + variantSummary() + " · made to order</span>";
      confirm.classList.add("show");
      btn.textContent = "Added ✓";
      btn.classList.remove("btn--arrow");
      setTimeout(function () { btn.textContent = P.cta; btn.classList.add("btn--arrow"); }, 2200);
    });
  } else {
    // Founder's — enquire to commission (no purchasable variants shown).
    var form = el("form", "eqform");
    form.innerHTML =
      '<div class="eqfield"><input type="text" placeholder="Your name" aria-label="Your name" required></div>' +
      '<div class="eqfield"><input type="email" id="eqEmail" placeholder="Your email" aria-label="Your email" required></div>' +
      '<div class="eqfield"><textarea rows="2" placeholder="Anything you\'d like us to know (optional)"></textarea></div>' +
      '<button type="submit" class="btn btn--primary">Send Enquiry</button>';
    cta.appendChild(form);
    cta.appendChild(confirm);
    btn.addEventListener("click", function () {
      var showing = form.classList.toggle("show");
      btn.textContent = showing ? "Close" : P.cta;
      btn.classList.toggle("btn--arrow", !showing);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.querySelector("#eqEmail");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.focus(); return; }
      form.classList.remove("show");
      btn.style.display = "none";
      confirm.innerHTML = "Thank you — we'll be in touch personally about your " + P.name + " commission.";
      confirm.classList.add("show");
    });
  }

  /* ---------- assurances ---------- */
  var au = document.getElementById("pAssure");
  P.assure.forEach(function (a) { au.appendChild(el("li", null, a)); });

  /* ---------- story ---------- */
  setPh(document.getElementById("storyImg"), P.storyImg);
  document.getElementById("storyHead").textContent = P.storyHead;
  var sb = document.getElementById("storyBody");
  P.storyBody.forEach(function (p) { sb.appendChild(el("p", null, p)); });
  document.getElementById("storyQuote").textContent = "“" + P.storyQuote + "”";

  /* ---------- details ---------- */
  var dl = document.getElementById("detailList");
  P.details.forEach(function (row) {
    var d = el("div");
    d.appendChild(el("dt", null, row[0]));
    d.appendChild(el("dd", null, row[1]));
    dl.appendChild(d);
  });

  /* ---------- related (same family) ---------- */
  var rg = document.getElementById("relatedGrid");
  var order = P.family === "goods" ? ORDER_GOODS : ORDER_BELTS;
  order.filter(function (s) { return s !== slug; }).forEach(function (s) {
    var R = PRODUCTS[s];
    var a = el("a", "card" + (s === "founders" ? " card--flagship" : ""));
    a.href = hrefFor(R);
    var media = el("div", "card__media");
    var fig = el("figure", "ph " + (R.gallery[0].oak ? "ph--oak" : "ph--warm"));
    fig.appendChild(el("figcaption", "ph__note", R.gallery[0].note));
    media.appendChild(fig);
    a.appendChild(media);
    a.appendChild(el("p", "card__no", R.eyebrow));
    a.appendChild(el("h3", "display", R.name));
    a.appendChild(el("div", "body-copy", "<p>" + R.tagline + "</p>"));
    var foot = el("div", "card__foot");
    foot.innerHTML = '<span class="price">' + R.price +
      '<span>' + R.priceNote + '</span></span>' +
      '<span class="tlink">' + (R.mode === "enquire" ? "Enquire" : "View") +
      ' <span class="ar">→</span></span>';
    a.appendChild(foot);
    rg.appendChild(a);
  });

  /* ---------- structured data ---------- */
  (function () {
    var n = (P.price.match(/[\d.]+/) || [""])[0];
    var ld = {
      "@context": "https://schema.org", "@type": "Product",
      "name": P.name, "description": P.meta,
      "brand": { "@type": "Brand", "name": "Handcraftbandit" },
      "offers": {
        "@type": "Offer", "priceCurrency": "EUR", "price": n,
        "availability": P.mode === "enquire"
          ? "https://schema.org/LimitedAvailability" : "https://schema.org/MadeToOrder",
        "url": location.href
      }
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  })();

  /* ==========================================================================
     LIVE OVERLAY — Square is the source of truth. Renders the real OPTION SETS
     (Colour swatches + Size dropdown) and tracks price/stock to the exact
     variation the customer selects. Fails silently → editorial values remain.
     ========================================================================== */
  function renderLiveOptions(live) {
    opts.innerHTML = "";
    state.selected = {};
    if (P.mode !== "buy") return;             // Founder's: enquire only, no selectors
    if (!live.options || !live.options.length) return;

    live.options.forEach(function (opt) {
      state.selected[opt.name] = opt.values[0];
      var grp = el("div", "pgroup");
      var label = el("p", "glabel", opt.name + ' — <b>' + opt.values[0] + "</b>");
      grp.appendChild(label);

      if (/size/i.test(opt.name)) {
        var sel = el("select", "psize");
        opt.values.forEach(function (v) { var o = el("option", null, v); o.value = v; sel.appendChild(o); });
        sel.addEventListener("change", function () {
          state.selected[opt.name] = sel.value;
          label.innerHTML = opt.name + " — <b>" + sel.value + "</b>";
          resolveVariation();
        });
        grp.appendChild(sel);
      } else {
        var row = el("div", "swatches");
        opt.values.forEach(function (v, i) {
          var hex = colourHex(v);
          var b = hex
            ? el("button", "swatch" + (i === 0 ? " sel" : ""))
            : el("button", "pill" + (i === 0 ? " sel" : ""), v);
          if (hex) { b.style.background = hex; b.setAttribute("aria-label", v); }
          b.addEventListener("click", function () {
            state.selected[opt.name] = v;
            row.querySelectorAll(".swatch, .pill").forEach(function (x) { x.classList.remove("sel"); });
            b.classList.add("sel");
            label.innerHTML = opt.name + " — <b>" + v + "</b>";
            resolveVariation();
          });
          row.appendChild(b);
        });
        grp.appendChild(row);
      }
      opts.appendChild(grp);
    });
  }

  function resolveVariation() {
    if (!LIVE) return;
    var vs = LIVE.variations || [];
    var match;
    if (LIVE.options && LIVE.options.length) {
      match = vs.filter(function (v) {
        var sels = v.selections || {};
        return Object.keys(state.selected).every(function (k) { return sels[k] === state.selected[k]; });
      })[0];
    } else {
      match = vs[0];
    }
    if (!match) { setBuyEnabled(false); return; }
    state.variationId = match.id;
    if (match.price && match.price.formatted) setPrice(match.price.formatted);
    setBuyEnabled(match.stockStatus !== "out_of_stock");
  }

  if (window.HCB && window.HCB.api) {
    window.HCB.api.fetchProducts(slugify(P.name)).then(function (list) {
      var live = list && list[0];
      if (!live) return;
      LIVE = live;

      renderLiveOptions(live);
      resolveVariation();

      // from-price for enquire / no-option products
      if ((!live.options || !live.options.length) && live.price && live.price.formatted) {
        setPrice((P.mode === "enquire" ? "From " : "") + live.price.formatted);
      }

      // real product photos replace the placeholders, when present in Square
      if (live.images && live.images.length) {
        showImage(galMain, live.images[0]);
        thumbs.innerHTML = "";
        live.images.slice(0, 8).forEach(function (url, i) {
          var t = el("figure", "ph ph--warm" + (i === 0 ? " sel" : ""));
          t.appendChild(el("figcaption", "ph__note", ""));
          showImage(t, url);
          t.addEventListener("click", function () {
            showImage(galMain, url);
            thumbs.querySelectorAll(".ph").forEach(function (x) { x.classList.remove("sel"); });
            t.classList.add("sel");
          });
          thumbs.appendChild(t);
        });
      }
    }).catch(function () { /* keep the editorial values */ });
  }
})();
