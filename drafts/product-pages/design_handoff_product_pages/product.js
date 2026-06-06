/* Handcraftbandit — product page renderer
   Reads ?belt=everyday|heritage|founders and builds the page. */
(function () {
  "use strict";

  var SIZES = ['28"', '30"', '32"', '34"', '36"', '38"', '40"', '42"', '44"'];

  var PRODUCTS = {
    everyday: {
      slug: "everyday",
      eyebrow: "I · The Everyday",
      name: "The Everyday Belt",
      crumb: "The Everyday Belt",
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
      slug: "heritage",
      eyebrow: "II · The Heritage",
      name: "The Heritage Belt",
      crumb: "The Heritage Belt",
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
      slug: "founders",
      eyebrow: "III · The Founder's · Numbered",
      name: "The Founder's Belt",
      crumb: "The Founder's Belt",
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
    }
  };

  var ORDER = ["everyday", "heritage", "founders"];

  /* ---------- helpers ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function setPh(fig, item, fallbackWarm) {
    var oak = item && item.oak;
    fig.className = "ph " + (oak ? "ph--oak" : "ph--warm") +
      (fig.classList.contains("pdp-hero") ? " pdp-hero" : "") +
      (fig.id === "storyImg" ? " reveal" : "");
    var cap = fig.querySelector(".ph__note");
    if (cap) cap.textContent = item ? item.note : "";
  }

  /* ---------- resolve product ---------- */
  var slug = (new URLSearchParams(location.search).get("belt") || "everyday").toLowerCase();
  if (!PRODUCTS[slug]) slug = "everyday";
  var P = PRODUCTS[slug];

  var state = { leather: 0, buckle: 0, size: "34\"" };

  /* ---------- head + headline ---------- */
  document.title = P.name + " — Handcraftbandit | Irish Belt House";
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", P.meta);
  document.getElementById("crumbName").textContent = P.crumb;
  document.getElementById("pEyebrow").textContent = P.eyebrow;
  document.getElementById("pName").textContent = P.name;
  document.getElementById("pTagline").textContent = P.tagline;
  document.getElementById("pPrice").innerHTML =
    P.price + ' <span class="pnote">' + P.priceNote + "</span>";

  /* ---------- gallery ---------- */
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

  // leather
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

  // buckle
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

  // size
  var sg = el("div", "pgroup");
  if (P.sizeNote) {
    sg.appendChild(el("p", "glabel", "Size — <b>" + P.sizeNote + "</b>"));
  } else {
    sg.appendChild(el("p", "glabel", "Size <b>(waist, inches)</b>"));
    var sel = el("select", "psize");
    P.sizes.forEach(function (sz) {
      var o = el("option", null, sz); o.value = sz;
      if (sz === state.size) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { state.size = sel.value; });
    sg.appendChild(sel);
    sel.value = state.size;
  }
  opts.appendChild(sg);

  /* ---------- CTA ---------- */
  var cta = document.getElementById("pCta");
  var btn = el("button", "btn btn--primary btn--arrow", P.cta);
  var confirm = el("p", "pconfirm");
  cta.appendChild(btn);

  if (P.mode === "buy") {
    cta.appendChild(confirm);
    btn.addEventListener("click", function () {
      var line = P.name + " · " + P.leathers[state.leather].name + " · " +
        P.buckles[state.buckle] + " · " + state.size;
      confirm.innerHTML = "Added to your bag —<br><span style='color:var(--ink-55);font-size:14px;'>" +
        line + " · made to order</span>";
      confirm.classList.add("show");
      btn.textContent = "Added ✓";
      btn.classList.remove("btn--arrow");
      setTimeout(function () { btn.textContent = P.cta; btn.classList.add("btn--arrow"); }, 2200);
    });
  } else {
    // enquiry flow
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
      confirm.innerHTML = "Thank you — we'll be in touch personally about your Founder's Belt commission.";
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
  document.getElementById("storyQuote").textContent = "\u201C" + P.storyQuote + "\u201D";

  /* ---------- details ---------- */
  var dl = document.getElementById("detailList");
  P.details.forEach(function (row) {
    var d = el("div");
    d.appendChild(el("dt", null, row[0]));
    d.appendChild(el("dd", null, row[1]));
    dl.appendChild(d);
  });

  /* ---------- related (other two belts) ---------- */
  var rg = document.getElementById("relatedGrid");
  ORDER.filter(function (s) { return s !== slug; }).forEach(function (s) {
    var R = PRODUCTS[s];
    var a = el("a", "card" + (s === "founders" ? " card--flagship" : ""));
    a.href = "Product.html?belt=" + s;
    var media = el("div", "card__media");
    var fig = el("figure", "ph " + (s === "founders" ? "ph--oak" : "ph--warm"));
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
})();
