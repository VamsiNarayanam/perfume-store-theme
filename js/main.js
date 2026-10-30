const quotes = [
  {
    name: "John Adams",
    img: "Images/clients/client-john.webp",
    text: "It's Opens bright and then turns soft and warm. By evening, people kept asking what I was wearing. I have not found anything that lasts like this on my skin."
  },
  {
    name: "Leo Chen",
    img: "Images/clients/client-top.webp",
    text: "I put it on before dinner and it was still there when I got home. Soft, warm, and close enough that only the person beside me noticed."
  },
  {
    name: "Marcus Hale",
    img: "Images/clients/client-side.webp",
    text: "It opens bright and then turns soft. Three people asked the name before the evening was over."
  },
  {
    name: "Amir Shah",
    img: "Images/clients/client-glasses.webp",
    text: "I have not found anything else that stays this close. It feels like me, only a little more finished."
  },
  {
    name: "David Okonkwo",
    img: "Images/clients/client-black.webp",
    text: "By evening it had settled into something warm. It never announced itself. It just stayed."
  },
  {
    name: "Sam Rivera",
    img: "Images/clients/client-dog.webp",
    text: "A little citrus at first, then a quiet warmth. I keep reaching for the same bottle."
  }
];

const infoCopy = {
  shipping: {
    title: "Shipping",
    body: "<p>Orders placed before 2pm leave the atelier the same weekday. Delivery is complimentary over $120.</p><p>Bottles travel upright, wrapped, and signed for on arrival.</p>"
  },
  returns: {
    title: "Returns",
    body: "<p>Unopened bottles can come back within 30 days. If a scent is not yours, write to us before you send it and we will arrange the label.</p>"
  },
  track: {
    title: "Track an order",
    body: "<p>This preview boutique keeps your bag on this device only. A shipped order would include a tracking note from hello@rosely.com.</p>"
  },
  consult: {
    title: "Skin consultation",
    body: "<p>Write to info@stackly.com with the scents you already wear and how your skin holds fragrance. We will suggest a bottle that stays close.</p>"
  },
  gifts: {
    title: "Gift cards",
    body: "<p>Gift cards are issued from the atelier in amounts of $50, $100, and $150. Ask for one when you write to info@stackly.com.</p>"
  }
};

const cart = new Map();
let openDrawer = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function money(n) {
  return `$${n}`;
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function productFrom(node) {
  return {
    id: node.dataset.id,
    name: node.dataset.name,
    price: Number(node.dataset.price),
    img: node.dataset.img,
    note: node.dataset.note || $(".product-note", node)?.textContent.trim() || ""
  };
}

function saveCart() {
  const data = [...cart.entries()];
  localStorage.setItem("rosely-cart", JSON.stringify(data));
  const saved = JSON.parse(localStorage.getItem("rosely-wishes") || "[]");
  localStorage.setItem("rosely-wishes", JSON.stringify(saved));
}

function bagCount() {
  let n = 0;
  cart.forEach((item) => { n += item.qty; });
  const badge = $("#bag-count");
  badge.hidden = n === 0;
  badge.textContent = n;
  const openBtn = $("#open-cart");
  openBtn.setAttribute("aria-label", n ? `Open bag, ${n} items` : "Open bag");
}

function renderCart() {
  const body = $("#cart-body");
  const foot = $("#cart-foot");
  body.innerHTML = "";
  if (cart.size === 0) {
    body.innerHTML = `<p class="empty-cart">Your bag is empty. The edit is waiting in the shop.</p>`;
    foot.hidden = true;
    bagCount();
    saveCart();
    return;
  }
  let sub = 0;
  cart.forEach((item) => {
    sub += item.price * item.qty;
    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${esc(item.img)}" alt="">
      <div>
        <h3>${esc(item.name)}</h3>
        <p>${money(item.price)}</p>
        <div class="qty">
          <button type="button" data-qty="-1" data-id="${esc(item.id)}" aria-label="Decrease ${esc(item.name)}">−</button>
          <span>${item.qty}</span>
          <button type="button" data-qty="1" data-id="${esc(item.id)}" aria-label="Increase ${esc(item.name)}">+</button>
          <button type="button" class="remove" data-remove="${esc(item.id)}">Remove</button>
        </div>
      </div>`;
    body.appendChild(row);
  });
  $("#cart-subtotal").textContent = money(sub);
  foot.hidden = false;
  bagCount();
  saveCart();
}

function addProduct(data) {
  const existing = cart.get(data.id);
  if (existing) existing.qty += 1;
  else cart.set(data.id, { ...data, qty: 1 });
  renderCart();
  window.location.href = "cart.html";
}

function showDrawer(id) {
  closeDrawers(false);
  const drawer = document.getElementById(id);
  drawer.hidden = false;
  $("#overlay").hidden = false;
  openDrawer = drawer;
  document.body.style.overflow = "hidden";
  const focusable = drawer.querySelector("input, button");
  if (focusable) focusable.focus();
}

function closeDrawers(restoreFocus = true) {
  $$(".drawer").forEach((d) => { d.hidden = true; });
  $("#overlay").hidden = true;
  document.body.style.overflow = "";
  if (restoreFocus && openDrawer) {
    const trigger = {
      "cart-drawer": "#open-cart",
      "search-drawer": "#open-search",
      "account-drawer": "#open-account"
    }[openDrawer.id];
    if (trigger) $(trigger)?.focus();
  }
  openDrawer = null;
}

let quoteIndex = 0;
let quoteTimer = null;

function setQuote(index) {
  if (!$("#quote-text")) return;
  quoteIndex = (index + quotes.length) % quotes.length;
  const q = quotes[quoteIndex];
  $("#quote-text").textContent = q.text;
  $("#quote-name").textContent = q.name;
  const avatar = $("#quote-avatar");
  avatar.src = q.img;
  avatar.alt = "";
  $$(".portrait").forEach((p) => {
    const on = Number(p.dataset.quote) === quoteIndex;
    p.classList.toggle("is-active", on);
    p.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function queueQuotes() {
  clearInterval(quoteTimer);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  quoteTimer = setInterval(() => setQuote(quoteIndex + 1), 4500);
}

function applyFilter(name) {
  let shown = 0;
  $$(".product").forEach((card) => {
    const match = name === "all" || card.dataset.cat === name;
    card.classList.toggle("is-hidden", !match);
    if (match) shown += 1;
  });
  const empty = $("#empty-filter");
  if (empty) empty.hidden = shown !== 0;
  $$(".filter").forEach((btn) => {
    const on = btn.dataset.filter === name;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
}

function renderSearch(query) {
  const list = $("#search-results");
  const q = query.trim().toLowerCase();
  const cards = $$(".product").filter((card) => {
    const note = card.dataset.note || $(".product-note", card)?.textContent || "";
    const blob = `${card.dataset.name} ${card.dataset.cat || ""} ${note}`.toLowerCase();
    return !q || blob.includes(q);
  });
  list.innerHTML = "";
  if (!cards.length) {
    list.innerHTML = `<li><p class="empty-cart">No fragrance matches that note.</p></li>`;
    return;
  }
  cards.forEach((card) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<img alt="" src="${card.dataset.img}"><span><strong>${card.dataset.name}</strong>${money(Number(card.dataset.price))} · ${card.dataset.cat}</span>`;
    btn.addEventListener("click", () => {
      closeDrawers();
      applyFilter("all");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("is-flash");
      setTimeout(() => card.classList.remove("is-flash"), 1600);
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("rosely-cart") || "[]");
    saved.forEach(([id, item]) => {
      if (item?.img) item.img = item.img.replace(/\.(png|jpe?g)$/i, ".webp");
      cart.set(id, item);
    });
  } catch (_) { /* ignore broken storage */ }
  const wishes = JSON.parse(localStorage.getItem("rosely-wishes") || "[]");
  $$(".wish").forEach((btn) => {
    const id = btn.closest(".product").dataset.id;
    if (wishes.includes(id)) btn.setAttribute("aria-pressed", "true");
  });
  const name = localStorage.getItem("rosely-name");
  if (name) {
    $("#account-name").value = name;
    $("#account-hello").textContent = `Welcome back, ${name}.`;
  }
  renderCart();
  setQuote(0);
  queueQuotes();
  renderSearch("");
}

$("#open-search").addEventListener("click", () => {
  showDrawer("search-drawer");
  $("#search-input").focus();
});
$("#overlay").addEventListener("click", () => closeDrawers());
$$("[data-close]").forEach((btn) => btn.addEventListener("click", () => closeDrawers()));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawers();
    closeMobileNav();
  }
});

function closeMobileNav() {
  const nav = $("#mobile-nav");
  const toggle = $("#menu-toggle");
  if (!nav || !toggle) return;
  nav.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open menu");
  document.body.classList.remove("nav-open");
}

$("#menu-toggle").addEventListener("click", () => {
  const nav = $("#mobile-nav");
  const open = nav.hidden;
  nav.hidden = !open;
  document.body.classList.toggle("nav-open", open);
  $("#menu-toggle").setAttribute("aria-expanded", open ? "true" : "false");
  $("#menu-toggle").setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
$$(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", closeMobileNav);
});
const desktopQuery = window.matchMedia("(min-width: 981px)");
const closeMobileNavOnDesktop = () => {
  if (desktopQuery.matches) closeMobileNav();
};
desktopQuery.addEventListener("change", closeMobileNavOnDesktop);
window.addEventListener("resize", closeMobileNavOnDesktop);

$$(".filter").forEach((btn) => {
  btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
});

$$("[data-filter-link]").forEach((link) => {
  link.addEventListener("click", () => applyFilter(link.dataset.filterLink));
});

document.addEventListener("click", (event) => {
  const add = event.target.closest(".add");
  const wish = event.target.closest(".wish");
  const product = (add || wish)?.closest(".product");
  if (!product) return;
  if (add) addProduct(productFrom(product));
  if (wish) {
    const pressed = wish.getAttribute("aria-pressed") === "true";
    wish.setAttribute("aria-pressed", pressed ? "false" : "true");
    const wishes = $$(".wish")
      .filter((btn) => btn.getAttribute("aria-pressed") === "true")
      .map((btn) => btn.closest(".product")?.dataset.id)
      .filter(Boolean);
    localStorage.setItem("rosely-wishes", JSON.stringify([...new Set(wishes)]));
    toast(pressed ? `${product.dataset.name} removed from saved` : "Saved to your list");
  }
});

$("#cart-body").addEventListener("click", (event) => {
  const qtyBtn = event.target.closest("[data-qty]");
  const remove = event.target.closest("[data-remove]");
  if (qtyBtn) {
    const item = cart.get(qtyBtn.dataset.id);
    item.qty += Number(qtyBtn.dataset.qty);
    if (item.qty <= 0) cart.delete(item.id);
    renderCart();
  }
  if (remove) {
    cart.delete(remove.dataset.remove);
    renderCart();
  }
});

function placeOrder(items) {
  const orders = JSON.parse(localStorage.getItem("rosely-orders") || "[]");
  const sub = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = sub >= 120 ? 0 : 8;
  const order = {
    id: `RS-${Date.now().toString().slice(-6)}`,
    placed: new Date().toISOString(),
    items: items.map(({ id, name, price, img, qty, note }) => ({ id, name, price, img, qty, note: note || "" })),
    sub,
    shipping,
    total: sub + shipping,
    status: "Reserved"
  };
  orders.unshift(order);
  localStorage.setItem("rosely-orders", JSON.stringify(orders));
  return order;
}

const checkout = $("#checkout");
if (checkout) checkout.addEventListener("click", () => {
  const items = [...cart.values()];
  if (!items.length) return;
  placeOrder(items);
  cart.clear();
  renderCart();
  window.location.href = "client.html";
});

const reserveNocturne = $("#reserve-nocturne");
if (reserveNocturne) {
  reserveNocturne.addEventListener("click", () => {
    addProduct({
      id: "nocturne",
      name: "Ambre Nocturne",
      price: 98,
      img: "Images/Sense joyful.webp",
      note: "Signature evening eau de parfum"
    });
  });
}

$$("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyFilter("all");
    const card = $(`#product-${btn.dataset.jump}`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("is-flash");
    setTimeout(() => card.classList.remove("is-flash"), 1600);
  });
});

$$(".portrait").forEach((btn) => {
  btn.addEventListener("click", () => {
    setQuote(Number(btn.dataset.quote));
    queueQuotes();
  });
});
const quotePrev = $("#quote-prev");
const quoteNext = $("#quote-next");
if (quotePrev && quoteNext) {
  quotePrev.addEventListener("click", () => {
    setQuote(quoteIndex - 1);
    queueQuotes();
  });
  quoteNext.addEventListener("click", () => {
    setQuote(quoteIndex + 1);
    queueQuotes();
  });
}
const womenSection = $(".women");
if (womenSection) {
  womenSection.addEventListener("mouseenter", () => clearInterval(quoteTimer));
  womenSection.addEventListener("mouseleave", queueQuotes);
  womenSection.addEventListener("focusin", () => clearInterval(quoteTimer));
  womenSection.addEventListener("focusout", (event) => {
    if (!womenSection.contains(event.relatedTarget)) queueQuotes();
  });
}

$("#search-input").addEventListener("input", (event) => renderSearch(event.target.value));

const contactForm = $("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const msg = $("#contact-msg");
    const email = $("#contact-email");
    const name = $("#contact-name");
    const note = $("#contact-message");
    const privacy = $("#contact-privacy");
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!name.value.trim() || !note.value.trim() || !validEmail) {
      msg.textContent = "Add your name, a real email, and a short note.";
      (name.value.trim() ? email : name).focus();
      return;
    }
    if (!privacy.checked) {
      msg.textContent = "Please agree to the privacy policy before sending.";
      privacy.focus();
      return;
    }
    const list = JSON.parse(localStorage.getItem("rosely-notes") || "[]");
    list.unshift({
      name: name.value.trim(),
      email: email.value.trim(),
      phone: $("#contact-phone").value.trim(),
      business: $("#contact-business").value.trim(),
      company: $("#contact-company").value.trim(),
      location: $("#contact-location").value.trim(),
      message: note.value.trim(),
      sent: new Date().toISOString()
    });
    localStorage.setItem("rosely-notes", JSON.stringify(list));
    contactForm.reset();
    window.location.href = "404.html";
  });
}

const letterForm = $("#letter-form");
if (letterForm) letterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#email");
  const msg = $("#form-msg");
  const value = input.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!valid) {
    msg.textContent = "Enter a real email so we know where to send the note.";
    input.focus();
    return;
  }
  const list = JSON.parse(localStorage.getItem("rosely-list") || "[]");
  if (!list.includes(value)) list.push(value);
  localStorage.setItem("rosely-list", JSON.stringify(list));
  letterForm.reset();
  window.location.href = "404.html";
});

const accountForm = $("#account-form");
if (accountForm) accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#account-name").value.trim();
  if (!name) {
    $("#account-msg").textContent = "Add a name to save on this browser.";
    return;
  }
  localStorage.setItem("rosely-name", name);
  $("#account-hello").textContent = `Welcome back, ${name}.`;
  $("#account-msg").textContent = "Saved on this device.";
});

$$("[data-info]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const info = infoCopy[btn.dataset.info];
    $("#info-title").textContent = info.title;
    $("#info-body").innerHTML = info.body;
    showDrawer("info-drawer");
  });
});

$$(".desktop-nav a, .mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    $$(".desktop-nav a").forEach((a) => a.removeAttribute("aria-current"));
    const match = $(`.desktop-nav a[href="${link.getAttribute("href")}"]`);
    if (match) match.setAttribute("aria-current", "page");
  });
});

function mountExtraProducts() {
  const grid = $("#product-grid");
  if (!grid) return;
  let extras = [];
  try { extras = JSON.parse(localStorage.getItem("rosely-extras") || "[]"); } catch (_) { extras = []; }
  extras.forEach((product) => {
    if (!product?.id || $(`#product-${CSS.escape(product.id)}`)) return;
    const card = document.createElement("article");
    card.className = "product";
    card.id = `product-${product.id}`;
    card.dataset.cat = product.cat || "floral";
    card.dataset.id = product.id;
    card.dataset.name = product.name;
    card.dataset.price = String(product.price);
    const picture = String(product.img || "").replace(/\.(png|jpe?g)$/i, ".webp");
    card.dataset.img = picture;
    const name = esc(product.name);
    const note = esc(product.note || "House composition");
    const img = esc(picture);
    card.innerHTML = `
      <div class="product-media">
        <img src="${img}" alt="${name}">
        <button class="wish" type="button" aria-pressed="false" aria-label="Save ${name}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"/></svg>
        </button>
      </div>
      <p class="stock is-in">In stock</p>
      <h3>${name}</h3>
      <p class="product-note">${note}</p>
      <div class="product-row">
        <p class="price">$${Number(product.price)}</p>
        <button class="add" type="button">Add to bag</button>
      </div>`;
    grid.appendChild(card);
  });
}

function initBestSlider() {
  const track = $("#best-track");
  const prev = $("#best-prev");
  const next = $("#best-next");
  if (!track || !prev || !next) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let busy = false;

  function gap() {
    const style = getComputedStyle(track);
    return parseFloat(style.columnGap || style.gap) || 0;
  }

  function step() {
    const card = track.querySelector(".shop-card");
    return card ? card.getBoundingClientRect().width + gap() : 0;
  }

  function slide(dir) {
    if (busy || track.children.length < 2) return;
    const distance = step();
    if (!distance) return;
    if (reduce) {
      if (dir > 0) track.appendChild(track.firstElementChild);
      else track.insertBefore(track.lastElementChild, track.firstElementChild);
      return;
    }
    busy = true;
    if (dir < 0) {
      track.insertBefore(track.lastElementChild, track.firstElementChild);
      track.style.transition = "none";
      track.style.transform = `translateX(${-distance}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          track.style.transition = "transform .4s ease";
          track.style.transform = "translateX(0)";
        });
      });
    } else {
      track.style.transition = "transform .4s ease";
      track.style.transform = `translateX(${-distance}px)`;
    }
    const done = (event) => {
      if (event.propertyName && event.propertyName !== "transform") return;
      track.removeEventListener("transitionend", done);
      if (dir > 0) {
        track.style.transition = "none";
        track.appendChild(track.firstElementChild);
        track.style.transform = "translateX(0)";
      }
      busy = false;
    };
    track.addEventListener("transitionend", done);
  }

  next.addEventListener("click", () => slide(1));
  prev.addEventListener("click", () => slide(-1));
}

mountExtraProducts();
loadState();
initBestSlider();
