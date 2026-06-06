/* Handcraftbandit — interactions
   nav state · mobile drawer · scroll reveals · hero parallax · email form */
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

  /* ---- email form ---- */
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
})();
