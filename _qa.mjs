export default async function run(page) {
  const report = {};

  async function settle() {
    await page.waitForFunction(() => !document.body.classList.contains("is-loading"), null, { timeout: 8000 });
    await page.waitForTimeout(400);
  }

  async function check(url, extra) {
    const errors = [];
    page.removeAllListeners("pageerror");
    page.on("pageerror", (err) => errors.push(String(err)));
    await page.goto(url, { waitUntil: "networkidle" });
    await settle();
    const data = await page.evaluate(async () => {
      const lenis = window.__lenis;
      const before = window.scrollY;
      if (lenis) lenis.scrollTo(900, { immediate: false, duration: 0.6, force: true });
      await new Promise((resolve) => setTimeout(resolve, 800));
      const sample = document.querySelector(".product, .scent-card, .btn, .auth-submit");
      let hover = null;
      if (sample) {
        sample.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        const card = sample.closest(".product, .scent-card") || sample;
        card.classList.add("is-hover-probe");
      }
      return {
        lenis: Boolean(lenis),
        lenisClass: document.documentElement.className,
        scrolled: window.scrollY > before + 40,
        scrollY: window.scrollY,
        rise: document.querySelectorAll(".rise").length,
        risen: document.querySelectorAll(".rise.is-in").length,
        hidden: [...document.querySelectorAll(".rise:not(.is-in)")].slice(0, 6).map((el) => el.className),
        title: document.title
      };
    });
    if (extra) Object.assign(data, await extra(page));
    data.errors = errors;
    report[url] = data;
  }

  await check("http://127.0.0.1:8765/index.html", async (page) => {
    const hover = await page.evaluate(() => {
      const card = document.querySelector(".product");
      if (!card) return null;
      const img = card.querySelector("img");
      card.style.setProperty("pointer-events", "auto");
      const before = getComputedStyle(card).transform;
      card.classList.add("force-hover");
      return { before, cls: card.className };
    });
    await page.hover(".product");
    const after = await page.evaluate(() => {
      const card = document.querySelector(".product");
      const img = card.querySelector(".product-media img");
      return {
        card: getComputedStyle(card).transform,
        img: getComputedStyle(img).transform,
        delay: getComputedStyle(card).transitionDelay
      };
    });
    await page.screenshot({ path: "C:/Users/HP/Documents/Downloads-1/stackly-site/assets/images/Downloads/Perfume-store-theme/_qa-home.png", fullPage: false });
    return { hover, after };
  });

  await check("http://127.0.0.1:8765/shop.html");
  await check("http://127.0.0.1:8765/story.html");
  await check("http://127.0.0.1:8765/contact.html");
  await check("http://127.0.0.1:8765/collections.html");
  await check("http://127.0.0.1:8765/cart.html");
  await check("http://127.0.0.1:8765/login.html");

  return report;
}
