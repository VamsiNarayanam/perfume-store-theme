const HOUSE = [
  { id: "wonder", name: "Wonder Rose", price: 89, cat: "floral", note: "Rose absolute eau de parfum", img: "Images/wonder rose.webp", house: true },
  { id: "goldea", name: "Rose Goldea", price: 120, cat: "floral", note: "Floral elixir", img: "Images/rose goldea.webp", house: true },
  { id: "joyful", name: "Sense Joyful", price: 65, cat: "fresh", note: "Fresh citrus mist", img: "Images/Sense joyful.webp", house: true },
  { id: "ambre", name: "Ambre Doré", price: 75, cat: "amber", note: "Warm amber essence", img: "Images/Ambre dore.webp", house: true },
  { id: "luxe", name: "Floral Luxe", price: 95, cat: "floral", note: "Soft floral mist", img: "Images/perfume showcase.webp", house: true },
  { id: "daily", name: "Rose Perfume", price: 55, cat: "fresh", note: "Daily floral perfume", img: "Images/Hero image.webp", house: true }
];

const SIGNATURES = {
  nocturne: { id: "nocturne", name: "Ambre Nocturne", price: 98, cat: "woody", note: "Signature evening eau de parfum", img: "Images/Sense joyful.webp", house: true }
};

const IMAGES = [
  ["Images/wonder rose.webp", "Wonder Rose still"],
  ["Images/rose goldea.webp", "Rose Goldea bottle"],
  ["Images/Sense joyful.webp", "Sense Joyful bottle"],
  ["Images/Ambre dore.webp", "Ambre Doré still"],
  ["Images/perfume showcase.webp", "Petal still"],
  ["Images/Hero image.webp", "Peony still"]
];

const $ = (sel, root = document) => root.querySelector(sel);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function money(n) {
  return `$${n}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function webpPath(value) {
  return String(value || "").replace(/\.(png|jpe?g)$/i, ".webp");
}

function personalNames() {
  const names = new Set();
  const add = (value) => {
    const name = String(value || "").trim().toLowerCase();
    if (name) names.add(name);
  };
  add(localStorage.getItem("rosely-name"));
  const accounts = readJson("rosely-accounts", []);
  if (Array.isArray(accounts)) accounts.forEach((account) => add(account && account.name));
  add(readJson("rosely-delivery", {})?.name);
  return names;
}

function extras() {
  const list = readJson("rosely-extras", []);
  if (!Array.isArray(list)) return [];
  const people = personalNames();
  const kept = list.filter((item) => item && item.id && item.name && !people.has(String(item.name).trim().toLowerCase()));
  if (kept.length !== list.length) localStorage.setItem("rosely-extras", JSON.stringify(kept));
  return kept.map((item) => ({ ...item, img: webpPath(item.img) }));
}

function catalog() {
  return [...HOUSE, ...extras()];
}

function findProduct(id) {
  return catalog().find((item) => item.id === id) || SIGNATURES[id] || null;
}

function getCart() {
  const saved = readJson("rosely-cart", []);
  if (!Array.isArray(saved)) return [];
  return saved.map((entry) => (Array.isArray(entry) ? entry[1] : entry)).filter((item) => item && item.id).map((item) => {
    if (item.img) item.img = webpPath(item.img);
    return item;
  });
}

function setCart(items) {
  localStorage.setItem("rosely-cart", JSON.stringify(items.map((item) => [item.id, item])));
  paintBag();
}

function orders() {
  const list = readJson("rosely-orders", []);
  if (!Array.isArray(list)) return [];
  return list.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({ ...item, img: webpPath(item.img) }))
  }));
}

function setOrders(list) {
  localStorage.setItem("rosely-orders", JSON.stringify(list));
}

function wishes() {
  const list = readJson("rosely-wishes", []);
  return Array.isArray(list) ? list : [];
}

function totals(items) {
  const sub = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const shipping = sub === 0 || sub >= 120 ? 0 : 8;
  return { sub, shipping, total: sub + shipping };
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function paintBag() {
  const badge = $("#bag-count");
  if (!badge) return;
  const count = getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  badge.hidden = count === 0;
  badge.textContent = String(count);
  const link = $("#open-cart");
  if (link) link.setAttribute("aria-label", count ? `Open bag, ${count} ${count === 1 ? "item" : "items"}` : "Open bag");
}

function statusClass(status) {
  if (status === "Shipped") return "pill pill-shipped";
  if (status === "Packed") return "pill pill-packed";
  return "pill";
}

function nextStatus(status) {
  if (status === "Reserved") return "Packed";
  if (status === "Packed") return "Shipped";
  return "Reserved";
}

function renderCart() {
  const filled = $("#cart-filled");
  const empty = $("#cart-empty");
  const done = $("#order-done");
  if (!filled) return;
  done.hidden = true;
  const items = getCart();
  if (!items.length) {
    filled.hidden = true;
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  filled.hidden = false;
  const lines = $("#cart-lines");
  lines.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "cart-line";
    row.innerHTML = `
      <img src="${esc(item.img)}" alt="">
      <div>
        <h2>${esc(item.name)}</h2>
        <p class="note">${esc(item.note || "")}</p>
        <div class="qty">
          <button type="button" data-qty="-1" data-id="${esc(item.id)}" aria-label="Decrease ${esc(item.name)}">−</button>
          <span>${Number(item.qty)}</span>
          <button type="button" data-qty="1" data-id="${esc(item.id)}" aria-label="Increase ${esc(item.name)}">+</button>
          <button type="button" class="remove" data-remove="${esc(item.id)}">Remove</button>
        </div>
      </div>
      <p class="line-price">${money(Number(item.price) * Number(item.qty))}</p>`;
    lines.appendChild(row);
  });
  const sum = totals(items);
  $("#sum-sub").textContent = money(sum.sub);
  $("#sum-ship").textContent = sum.shipping === 0 ? "Complimentary" : money(sum.shipping);
  $("#sum-total").textContent = money(sum.total);
}

function showConfirmation(order) {
  $("#cart-filled").hidden = true;
  $("#cart-empty").hidden = true;
  const done = $("#order-done");
  done.hidden = false;
  $("#done-id").textContent = order.id;
  $("#done-copy").textContent = `${order.items.reduce((sum, item) => sum + Number(item.qty), 0)} bottle${order.items.length === 1 && order.items[0].qty === 1 ? "" : "s"} reserved for ${money(order.total)}. The note is saved on this device.`;
  const thumbs = $("#done-thumbs");
  thumbs.innerHTML = order.items.map((item) => `<img src="${esc(item.img)}" alt="${esc(item.name)}">`).join("");
}

function initCart() {
  renderCart();
  $("#cart-lines").addEventListener("click", (event) => {
    const qtyBtn = event.target.closest("[data-qty]");
    const remove = event.target.closest("[data-remove]");
    const items = getCart();
    if (qtyBtn) {
      const item = items.find((entry) => entry.id === qtyBtn.dataset.id);
      if (!item) return;
      item.qty += Number(qtyBtn.dataset.qty);
      setCart(item.qty <= 0 ? items.filter((entry) => entry.id !== item.id) : items);
      renderCart();
    }
    if (remove) {
      setCart(items.filter((entry) => entry.id !== remove.dataset.remove));
      renderCart();
    }
  });
  $("#place-order").addEventListener("click", () => {
    window.location.href = "404.html";
  });
}

function renderSaved() {
  const list = $("#saved-list");
  const ids = wishes();
  if (!ids.length) {
    list.innerHTML = `<p class="fine">No saved scents yet. Tap the heart on a bottle in the shop.</p>`;
    return;
  }
  list.innerHTML = "";
  ids.forEach((id) => {
    const product = findProduct(id);
    const row = document.createElement("div");
    row.className = "mini";
    if (!product) {
      row.innerHTML = `<div><h3>${esc(id)}</h3><button class="text-btn" type="button" data-unwish="${esc(id)}">Remove</button></div>`;
    } else {
      row.innerHTML = `
        <img src="${esc(product.img)}" alt="">
        <div>
          <h3>${esc(product.name)}</h3>
          <p>${esc(product.note)} · ${money(product.price)}</p>
          <button class="text-btn" type="button" data-bag="${esc(product.id)}">Add to bag</button>
          <button class="text-btn" type="button" data-unwish="${esc(product.id)}">Remove</button>
        </div>`;
    }
    list.appendChild(row);
  });
}

function renderClientOrders() {
  const list = $("#client-orders");
  const all = orders();
  if (!all.length) {
    list.innerHTML = `<p class="fine">No reservations yet. Add a bottle and reserve it from your bag.</p>`;
    return;
  }
  list.innerHTML = "";
  all.forEach((order) => {
    const row = document.createElement("article");
    row.className = "mini";
    const names = order.items.map((item) => `${item.qty} × ${item.name}`).join(", ");
    row.innerHTML = `
      <img src="${esc(order.items[0]?.img || "")}" alt="">
      <div>
        <h3>${esc(order.id)}</h3>
        <p>${esc(formatDate(order.placed))} · ${esc(names)}</p>
        <p><span class="${statusClass(order.status)}">${esc(order.status)}</span> · ${money(order.total)}</p>
      </div>`;
    list.appendChild(row);
  });
}

function renderClient() {
  const name = localStorage.getItem("rosely-name") || "";
  $("#client-hello").textContent = name
    ? `Welcome back, ${name}. Saved scents, your bag, and reservations stay on this device.`
    : "Welcome back. Saved scents, your bag, and reservations stay on this device.";
  $("#account-name").value = name;
  const emailField = $("#account-email");
  if (emailField) emailField.value = localStorage.getItem("rosely-email") || "";
  const bag = getCart().reduce((sum, item) => sum + Number(item.qty), 0);
  const all = orders();
  const spent = all.reduce((sum, order) => sum + Number(order.total || 0), 0);
  $("#stat-saved").textContent = String(wishes().length);
  $("#stat-bag").textContent = String(bag);
  $("#stat-orders").textContent = String(all.length);
  $("#stat-spent").textContent = money(spent);
  const skin = $("#skin-note");
  if (skin) skin.value = localStorage.getItem("rosely-skin") || "";
  const delivery = readJson("rosely-delivery", {});
  if ($("#deliver-name")) {
    $("#deliver-name").value = delivery.name || "";
    $("#deliver-street").value = delivery.street || "";
    $("#deliver-city").value = delivery.city || "";
  }
  renderSaved();
  renderClientOrders();
}

function initClient() {
  renderClient();
  $("#account-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#account-name").value.trim();
    const email = $("#account-email").value.trim().toLowerCase();
    const msg = $("#account-msg");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = "Add a name and a real email.";
      return;
    }
    localStorage.setItem("rosely-name", name);
    localStorage.setItem("rosely-email", email);
    window.location.href = "404.html";
  });
  $("#notes-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const note = $("#skin-note").value.trim();
    const msg = $("#notes-msg");
    if (!note) {
      msg.textContent = "Write a short note before saving.";
      return;
    }
    localStorage.setItem("rosely-skin", note);
    window.location.href = "404.html";
  });
  $("#delivery-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#deliver-name").value.trim();
    const street = $("#deliver-street").value.trim();
    const city = $("#deliver-city").value.trim();
    const msg = $("#delivery-msg");
    if (!name || !street || !city) {
      msg.textContent = "Add a name, street, and city.";
      return;
    }
    localStorage.setItem("rosely-delivery", JSON.stringify({ name, street, city }));
    window.location.href = "404.html";
  });
  $("#saved-list").addEventListener("click", (event) => {
    const unwish = event.target.closest("[data-unwish]");
    const bag = event.target.closest("[data-bag]");
    if (unwish) {
      const next = wishes().filter((id) => id !== unwish.dataset.unwish);
      localStorage.setItem("rosely-wishes", JSON.stringify(next));
      renderClient();
    }
    if (bag) {
      const product = findProduct(bag.dataset.bag);
      if (!product) return;
      const items = getCart();
      const existing = items.find((item) => item.id === product.id);
      if (existing) existing.qty += 1;
      else items.push({ id: product.id, name: product.name, price: product.price, img: product.img, note: product.note, qty: 1 });
      setCart(items);
      window.location.href = "cart.html";
    }
  });
}

function renderAdmin() {
  const all = orders();
  const subs = readJson("rosely-list", []);
  const open = all.filter((order) => order.status !== "Shipped").length;
  const revenue = all.reduce((sum, order) => sum + Number(order.total || 0), 0);
  $("#stat-products").textContent = String(catalog().length);
  $("#stat-open").textContent = String(open);
  $("#stat-revenue").textContent = money(revenue);
  $("#stat-list").textContent = String(Array.isArray(subs) ? subs.length : 0);
  const adminName = $("#admin-name");
  if (adminName) {
    adminName.value = localStorage.getItem("rosely-name") || "";
    $("#admin-email").value = localStorage.getItem("rosely-email") || "";
  }

  const orderBody = $("#admin-orders");
  if (!all.length) {
    orderBody.innerHTML = `<tr><td colspan="5">No reservations yet. They appear here after a bag is reserved.</td></tr>`;
  } else {
    orderBody.innerHTML = all.map((order) => `
      <tr>
        <td><strong>${esc(order.id)}</strong><br><span class="fine">${esc(formatDate(order.placed))}</span></td>
        <td>${esc(order.items.map((item) => `${item.qty} × ${item.name}`).join(", "))}</td>
        <td>${money(order.total)}</td>
        <td><span class="${statusClass(order.status)}">${esc(order.status)}</span></td>
        <td><button class="text-btn" type="button" data-status="${esc(order.id)}">Mark ${esc(nextStatus(order.status))}</button></td>
      </tr>`).join("");
  }

  const catalogBody = $("#admin-catalog");
  catalogBody.innerHTML = catalog().map((product) => `
    <tr>
      <td><strong>${esc(product.name)}</strong><br><span class="fine">${esc(product.note || "")}</span></td>
      <td>${esc(product.cat)}</td>
      <td>${money(product.price)}</td>
      <td>${product.house ? "House" : `<button class="text-btn" type="button" data-drop="${esc(product.id)}">Remove</button>`}</td>
    </tr>`).join("");

  const people = $("#admin-list");
  if (!Array.isArray(subs) || !subs.length) {
    people.innerHTML = `<p class="fine">No one has joined the letter yet.</p>`;
  } else {
    people.innerHTML = `<ul>${subs.map((email) => `<li>${esc(email)}</li>`).join("")}</ul>`;
  }

  const consults = readJson("rosely-consults", []);
  const consultList = $("#consult-list");
  if (consultList) {
    if (!Array.isArray(consults) || !consults.length) {
      consultList.innerHTML = `<p class="fine">No consultations yet.</p>`;
    } else {
      consultList.innerHTML = `<ul class="desk-list">${consults.map((item) => `
        <li>
          <span><strong>${esc(item.name)}</strong><br><span class="fine">${esc(item.note)}</span></span>
          <button class="text-btn" type="button" data-drop-consult="${esc(item.id)}">Remove</button>
        </li>`).join("")}</ul>`;
    }
  }

  const gifts = readJson("rosely-gifts", []);
  const giftList = $("#gift-list");
  if (giftList) {
    if (!Array.isArray(gifts) || !gifts.length) {
      giftList.innerHTML = `<p class="fine">No gift cards issued yet.</p>`;
    } else {
      giftList.innerHTML = `<ul class="desk-list">${gifts.map((item) => `
        <li>
          <span><strong>${esc(item.name)}</strong><br><span class="fine">${money(Number(item.amount))}</span></span>
          <button class="text-btn" type="button" data-drop-gift="${esc(item.id)}">Remove</button>
        </li>`).join("")}</ul>`;
    }
  }
}

function initAdmin() {
  const imageSelect = $("#product-img");
  imageSelect.innerHTML = IMAGES.map(([src, label]) => `<option value="${esc(src)}">${esc(label)}</option>`).join("");
  renderAdmin();
  $("#admin-orders").addEventListener("click", (event) => {
    const button = event.target.closest("[data-status]");
    if (!button) return;
    const next = orders().map((order) => (
      order.id === button.dataset.status ? { ...order, status: nextStatus(order.status) } : order
    ));
    setOrders(next);
    renderAdmin();
  });
  $("#admin-catalog").addEventListener("click", (event) => {
    const button = event.target.closest("[data-drop]");
    if (!button) return;
    const next = extras().filter((item) => item.id !== button.dataset.drop);
    localStorage.setItem("rosely-extras", JSON.stringify(next));
    renderAdmin();
  });
  $("#add-product").addEventListener("submit", (event) => {
    event.preventDefault();
    const msg = $("#add-msg");
    const name = $("#product-name").value.trim();
    const price = Number($("#product-price").value);
    if (personalNames().has(name.toLowerCase())) {
      msg.textContent = "That is your account name. Give the fragrance its own name.";
      return;
    }
    const cat = $("#product-cat").value;
    const note = $("#product-note").value.trim();
    const img = $("#product-img").value;
    if (!name) {
      msg.textContent = "Name the fragrance before it joins the shop.";
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      msg.textContent = "Set a price greater than zero.";
      return;
    }
    if (!IMAGES.some(([src]) => src === img)) {
      msg.textContent = "Choose one of the house stills.";
      return;
    }
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scent";
    const taken = new Set(catalog().map((item) => item.id));
    let id = base;
    let n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;
    const next = [...extras(), { id, name, price, cat, note: note || "House composition", img, house: false }];
    localStorage.setItem("rosely-extras", JSON.stringify(next));
    event.target.reset();
    window.location.href = "404.html";
  });
  $("#consult-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const msg = $("#consult-msg");
    const name = $("#consult-name").value.trim();
    const note = $("#consult-note").value.trim();
    if (!name || !note) {
      msg.textContent = "Add a name and what they already wear.";
      return;
    }
    const next = [...readJson("rosely-consults", []), { id: String(Date.now()), name, note }];
    localStorage.setItem("rosely-consults", JSON.stringify(next));
    event.target.reset();
    window.location.href = "404.html";
  });
  $("#consult-list")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-drop-consult]");
    if (!button) return;
    const next = readJson("rosely-consults", []).filter((item) => item.id !== button.dataset.dropConsult);
    localStorage.setItem("rosely-consults", JSON.stringify(next));
    renderAdmin();
  });
  $("#gift-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const msg = $("#gift-msg");
    const name = $("#gift-name").value.trim();
    const amount = Number($("#gift-amount").value);
    if (!name || ![50, 100, 150].includes(amount)) {
      msg.textContent = "Name the recipient and choose an amount.";
      return;
    }
    const next = [...readJson("rosely-gifts", []), { id: String(Date.now()), name, amount }];
    localStorage.setItem("rosely-gifts", JSON.stringify(next));
    event.target.reset();
    window.location.href = "404.html";
  });
  $("#admin-account")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#admin-name").value.trim();
    const email = $("#admin-email").value.trim().toLowerCase();
    const msg = $("#admin-account-msg");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = "Add a name and a real email.";
      return;
    }
    localStorage.setItem("rosely-name", name);
    localStorage.setItem("rosely-email", email);
    localStorage.setItem("rosely-role", "admin");
    window.location.href = "404.html";
  });
  $("#gift-list")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-drop-gift]");
    if (!button) return;
    const next = readJson("rosely-gifts", []).filter((item) => item.id !== button.dataset.dropGift);
    localStorage.setItem("rosely-gifts", JSON.stringify(next));
    renderAdmin();
  });
}

function showSidebarUser() {
  const user = $("#dash-user");
  const nameEl = $("#dash-user-name");
  const emailEl = $("#dash-user-email");
  if (!user || !nameEl || !emailEl) return;
  const name = localStorage.getItem("rosely-name") || "";
  const email = localStorage.getItem("rosely-email") || "";
  nameEl.textContent = name;
  emailEl.textContent = email;
  user.hidden = !name && !email;
}

function initSidebar() {
  const sidebar = $("#dash-sidebar");
  const toggle = $("#dash-menu-btn");
  const backdrop = $("#dash-backdrop");
  showSidebarUser();
  if (!sidebar || !toggle) return;

  const setOpen = (open) => {
    sidebar.classList.toggle("is-open", open);
    if (backdrop) backdrop.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => setOpen(!sidebar.classList.contains("is-open")));
  backdrop?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  const links = [...document.querySelectorAll(".dash-nav a")];
  const barTitle = $("#dash-bar-title");
  const mark = (hash) => {
    links.forEach((link) => {
      const on = hash && link.getAttribute("href") === hash;
      link.classList.toggle("is-active", on);
      if (on && barTitle) barTitle.textContent = link.textContent.trim();
    });
  };
  links.forEach((link) => {
    link.addEventListener("click", () => {
      setOpen(false);
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) mark(href);
    });
  });
  if (location.hash) mark(location.hash);
}

paintBag();
const page = document.body.dataset.page;
if (page === "cart") initCart();
if (page === "client") {
  initSidebar();
  initClient();
}
if (page === "admin") {
  initSidebar();
  initAdmin();
}

const pageInfo = {
  shipping: {
    title: "Shipping",
    body: "<p>Orders placed before 2pm leave the atelier the same weekday. Delivery is complimentary over $120.</p><p>Bottles travel upright, wrapped, and signed for on arrival.</p>"
  },
  returns: {
    title: "Returns",
    body: "<p>Unopened bottles can come back within 30 days. If a scent is not yours, write to us before you send it and we will arrange the label.</p>"
  },
  privacy: {
    title: "Privacy",
    body: "<p>Your name, saved scents, and bag stay in this browser. Nothing is sent to a server.</p>"
  },
  terms: {
    title: "Terms",
    body: "<p>Rosely is a design preview of a perfume house. Prices and bottles shown here are for the storefront demonstration.</p>"
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

function closePageInfo() {
  const drawer = document.getElementById("info-drawer");
  const overlay = document.getElementById("overlay");
  if (drawer) drawer.hidden = true;
  if (overlay) overlay.hidden = true;
}

document.querySelectorAll("[data-info]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const info = pageInfo[btn.dataset.info];
    const drawer = document.getElementById("info-drawer");
    const overlay = document.getElementById("overlay");
    if (!info || !drawer || !overlay) return;
    document.getElementById("info-title").textContent = info.title;
    document.getElementById("info-body").innerHTML = info.body;
    drawer.hidden = false;
    overlay.hidden = false;
  });
});
document.querySelectorAll("[data-close='info']").forEach((btn) => {
  btn.addEventListener("click", closePageInfo);
});
document.getElementById("overlay")?.addEventListener("click", closePageInfo);
