(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.AOS || typeof window.AOS.init !== "function") return;

  const blocked = ".hero-flower-frame, .best-seller, .drawer, .preloader, .site-header, .mobile-nav, .dash-sidebar, .overlay";

  const mark = (selector, type) => {
    const els = [...document.querySelectorAll(selector)].filter((el) => {
      if (el.dataset.aos || el.hidden || el.closest("[hidden]")) return false;
      if (el.closest(blocked)) return false;
      return true;
    });
    const groups = new Map();
    els.forEach((el) => {
      const key = el.parentElement;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    });
    els.forEach((el) => {
      el.setAttribute("data-aos", type);
      const siblings = groups.get(el.parentElement);
      if (siblings.length > 1) {
        const index = siblings.indexOf(el);
        el.setAttribute("data-aos-delay", String(Math.min(index, 4) * 70));
      }
    });
  };

  mark([
    ".impression-visual",
    ".nocturne-visual",
    ".venn",
    ".missing"
  ].join(","), "fade");

  mark([
    ".scents-head",
    ".scent-card",
    ".impression-copy",
    ".loved-head",
    ".product",
    ".nocturne-copy",
    ".women .clients-kicker",
    ".women h2",
    ".quote-card",
    ".ritual-head",
    ".ritual-steps > li",
    ".letter-inner",
    ".shop-head",
    ".begin-head",
    ".arrive-head",
    ".arrive-card",
    ".best-head",
    ".shop-card",
    ".story-memory-top",
    ".story-cols",
    ".story-photo",
    ".story-step",
    ".love-card",
    ".col-row",
    ".contact-intro",
    ".contact-card",
    ".visit-card",
    ".hours-grid > *",
    ".visit-order",
    ".ask-list",
    ".refuse-grid",
    ".house-count-grid > *",
    ".footer-grid > *",
    ".cart-layout > *",
    ".auth-visual-copy",
    ".auth-panel"
  ].join(","), "fade-up");

  const start = () => {
    window.AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 28,
      mirror: false,
      anchorPlacement: "top-bottom"
    });
  };

  if (document.body.classList.contains("is-loading")) {
    const wait = new MutationObserver(() => {
      if (document.body.classList.contains("is-loading")) return;
      wait.disconnect();
      start();
    });
    wait.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  } else {
    start();
  }

  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      requestAnimationFrame(() => window.AOS.refresh());
    });
  });
})();
