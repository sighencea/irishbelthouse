/* ============================================================
   Handcraftbandit — product page renderer
   Reads ?belt=everyday|heritage|founders  or  ?item=wallet|card-holder|a5-sleeve
   and builds the page from an EDITORIAL map, then overlays LIVE price/stock/
   images from the Cloudflare Worker (Square = source of truth for commerce).

   HYBRID model:
   - This PRODUCTS map = the editorial layer (story, options, specs, photos).
   - window.HCB.api.fetchProducts(slug) = the live commerce layer (Square).
   The slug here matches the Square item's SKU (everyday, heritage, …).
   ============================================================ */
(function () {
  "use strict";

  var SIZES = ['28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"', '44"'];

  var PRODUCTS = {
    /* ---------------------------- BELTS ---------------------------- */
    everyday: {
      slug: "everyday", family: "belts",
      eyebrow: "I · The Everyday",
      name: "The Everyday Belt", crumb: "The Everyday Belt",
      tagline: "The first belt you reach for, and the last you'll need to buy.",
      price: "€145", priceNote: "Made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "The Everyday Belt — honest Italian vegetable-tanned leather, a hand-set brass buckle, made to order in Midleton, Ireland.",
      leathers: [
        { name: "Black", hex: "#201c19" },
        { name: "Chestnut", hex: "#6b4327" },
        { name: "Hazel", hex: "#8a6a44" }
      ],
      buckles: ["Brass", "Gunmetal"],
      sizes: SIZES,
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
      eyebrow: "II · The Heritage",
      name: "The Heritage Belt", crumb: "The Heritage Belt",
      tagline: "Fully hand-stitched with the traditional saddle stitch — the belt we are known for.",
      price: "€245", priceNote: "Hand stitched · made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "The Heritage Belt — fully hand saddle-stitched Italian vegetable-tanned leather, made to order in Midleton, Ireland.",
      leathers: [
        { name: "Black", hex: "#201c19" },
        { name: "Chestnut", hex: "#6b4327" },
        { name: "Oxblood", hex: "#5a201c" },
        { name: "Hazel", hex: "#8a6a44" }
      ],
      buckles: ["Brass", "Antique Brass", "Gunmetal"],
      sizes: SIZES,
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
      eyebrow: "III · The Founder's · Numbered",
      name: "The Founder's Belt", crumb: "The Founder's Belt",
      tagline: "Our flagship. Individually numbered, signed, and made in a run of fifty each year.",
      price: "From €480", priceNote: "Numbered edition · 50 a year",
      mode: "enquire", cta: "Enquire to Commission",
      meta: "The Founder's Belt — our numbered flagship, limited to 50 pieces a year, commissioned and hand-made in Midleton, Ireland.",
      leathers: [
        { name: "Black", hex: "#201c19" },
        { name: "Cognac", hex: "#7a4a24" },
        { name: "Oxblood", hex: "#5a201c" }
      ],
      buckles: ["Solid Brass", "Hand-aged Brass"],
      sizeNote: "Measured to you at commission",
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

    /* ------------------------- LEATHER GOODS ------------------------- */
    wallet: {
      slug: "wallet", family: "goods",
      eyebrow: "Everyday Carry",
      name: "The Wallet", crumb: "The Wallet",
      tagline: "A slim bifold that softens and moulds to your pocket over the years.",
      price: "€120", priceNote: "Made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "The Wallet — a slim hand-stitched bifold in Italian vegetable-tanned leather, made to order in Midleton, Ireland.",
      leathers: [
        { name: "Black", hex: "#201c19" },
        { name: "Chestnut", hex: "#6b4327" },
        { name: "Hazel", hex: "#8a6a44" }
      ],
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
        "Every pocket is saddle-stitched by hand and the edges are bevelled and burnished, so it wears in rather than wears out. It will darken with the oils of your hands and the days it spends in your pocket."
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
      name: "The Card Holder", crumb: "The Card Holder",
      tagline: "The most minimal piece we make — a few cards, a folded note, nothing more.",
      price: "€75", priceNote: "Made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "The Card Holder — a minimal hand-finished card holder in Italian vegetable-tanned leather, made to order in Midleton, Ireland.",
      leathers: [
        { name: "Black", hex: "#201c19" },
        { name: "Chestnut", hex: "#6b4327" },
        { name: "Oxblood", hex: "#5a201c" }
      ],
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
        "It starts firm and tailors itself to your cards over a few weeks, then holds that shape for years. The edges are burnished by hand so they never fray."
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
      name: "The A5 Notepad Sleeve", crumb: "The A5 Notepad Sleeve",
      tagline: "A refillable A5 sleeve, made to be reloaded for years.",
      price: "€165", priceNote: "Refillable · made to order",
      mode: "buy", cta: "Add to Bag",
      meta: "The A5 Notepad Sleeve — a refillable hand-stitched leather folio for an A5 notebook, made to order in Midleton, Ireland.",
      leathers: [
        { name: "Black", hex: "#201c19" },
        { name: "Chestnut", hex: "#6b4327" },
        { name: "Cognac", hex: "#7a4a24" }
      ],
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

  /* ---------- helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
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

  var state = { leather: 0, buckle: 0, size: '34"', variationId: null };

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
  document.getElementById("pPrice").innerHTML =
    P.price + ' <span class="pnote">' + P.priceNote + "</span>";

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

  /* ---------- options ---------- */
  var opts = document.getElementById("pOptions");

  // leather (always)
  var lg = el("div", "pgroup");
  var llabel = el("p", "glabel", 'Leather — <b>' + P.leathers[state.leather].name + "</b>");
  var sw = el("div", "swatches");
  P.leathers.forEach(function (le, i) {
    var s = el("button", "swatch" + (i === 0 ? " sel" : ""));
    s.style.background = le.hex;
    s.setAttribute("aria-label", le.name);
    s.addEventListener("click", function () {
      state.leather = i;
      sw.querySelectorAll(".swatch").forEach(function (x) { x.classList.remove("sel"); });
      s.classList.add("sel");
      llabel.innerHTML = "Leather — <b>" + le.name + "</b>";
    });
    sw.appendChild(s);
  });
  lg.appendChild(llabel); lg.appendChild(sw); opts.appendChild(lg);

  // buckle (belts only — present when the record has buckles)
  if (P.buckles && P.buckles.length) {
    var bg = el("div", "pgroup");
    bg.appendChild(el("p", "glabel", 'Buckle — <b>' + P.buckles[state.buckle] + "</b>"));
    var blabel = bg.querySelector(".glabel");
    var pills = el("div", "pills");
    P.buckles.forEach(function (b, i) {
      var pill = el("button", "pill" + (i === 0 ? " sel" : ""), b);
      pill.addEventListener("click", function () {
        state.buckle = i;
        pills.querySelectorAll(".pill").forEach(function (x) { x.classList.remove("sel"); });
        pill.classList.add("sel");
        blabel.innerHTML = "Buckle — <b>" + b + "</b>";
      });
      pills.appendChild(pill);
    });
    bg.appendChild(pills); opts.appendChild(bg);
  }

  // size (belts: select or static note; goods: omitted)
  if (P.sizeNote) {
    var sgN = el("div", "pgroup");
    sgN.appendChild(el("p", "glabel", "Size — <b>" + P.sizeNote + "</b>"));
    opts.appendChild(sgN);
  } else if (P.sizes && P.sizes.length) {
    var sg = el("div", "pgroup");
    sg.appendChild(el("p", "glabel", "Size <b>(waist, inches)</b>"));
    var sel = el("select", "psize");
    P.sizes.forEach(function (sz) {
      var o = el("option", null, sz); o.value = sz;
      if (sz === state.size) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { state.size = sel.value; });
    sg.appendChild(sel); opts.appendChild(sg);
    sel.value = state.size;
  }

  function variantSummary() {
    var parts = [P.leathers[state.leather].name];
    if (P.buckles && P.buckles.length) parts.push(P.buckles[state.buckle]);
    if (P.sizes && !P.sizeNote) parts.push(state.size);
    return parts.join(" · ");
  }

  /* ---------- CTA ---------- */
  var cta = document.getElementById("pCta");
  var btn = el("button", "btn btn--primary btn--arrow", P.cta);
  var confirm = el("p", "pconfirm");
  cta.appendChild(btn);

  if (P.mode === "buy") {
    // Made-to-order "Add to Bag" — inline confirmation (no Square checkout; by design).
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
    // Enquire-to-commission (Founder's) — inline form, no cart.
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

  /* ---------- related (other items in the same family) ---------- */
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
      "@context": "https://schema.org",
      "@type": "Product",
      "name": P.name,
      "description": P.meta,
      "brand": { "@type": "Brand", "name": "Handcraftbandit" },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": n,
        "availability": P.mode === "enquire"
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/MadeToOrder",
        "url": location.href
      }
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  })();

  /* ==========================================================================
     LIVE OVERLAY — Square is the source of truth for price/stock/images.
     We render the editorial shell above first (so the page is never blank),
     then quietly overlay live data from our Worker. Fails silently → editorial
     values remain. The site never calls Square directly; only our Worker does.
     ========================================================================== */
  if (window.HCB && window.HCB.api) {
    window.HCB.api.fetchProducts(slug).then(function (list) {
      var live = list && list[0];
      if (!live) return;

      // keep the live variation id (for future optional checkout)
      if (live.variations && live.variations[0]) state.variationId = live.variations[0].id;

      // live price (keep the editorial note)
      if (live.price && live.price.formatted) {
        document.getElementById("pPrice").innerHTML =
          live.price.formatted + ' <span class="pnote">' + P.priceNote + "</span>";
      }

      // out of stock → disable the buy button
      if (live.stockStatus === "out_of_stock" && P.mode === "buy") {
        btn.setAttribute("disabled", "");
        btn.textContent = "Currently unavailable";
        btn.classList.remove("btn--arrow");
        btn.style.opacity = "0.55";
        btn.style.cursor = "not-allowed";
      }

      // real product photos (once you add images in Square) replace placeholders
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
