const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const accounts = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("rosely-accounts") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (_) {
    return [];
  }
};

const saveAccounts = (list) => localStorage.setItem("rosely-accounts", JSON.stringify(list));

const roleValue = () => document.querySelector('input[name="role"]:checked')?.value || "client";

const enterDesk = (account) => {
  localStorage.setItem("rosely-name", account.name);
  localStorage.setItem("rosely-email", account.email);
  localStorage.setItem("rosely-role", account.role);
  window.location.href = account.role === "admin" ? "admin.html" : "client.html";
};

document.querySelectorAll("[data-social]").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = "404.html";
  });
});

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  const params = new URLSearchParams(window.location.search);
  const note = sessionStorage.getItem("rosely-login-note");
  if (note) {
    document.querySelector("#login-msg").textContent = note;
    sessionStorage.removeItem("rosely-login-note");
  }
  const savedEmail = params.get("email") || localStorage.getItem("rosely-email");
  if (savedEmail) loginForm.email.value = savedEmail;
  const savedName = params.get("name") || localStorage.getItem("rosely-name");
  if (savedName) loginForm.name.value = savedName;
  const savedRole = params.get("role");
  if (savedRole) {
    const roleInput = loginForm.querySelector(`input[name="role"][value="${savedRole}"]`);
    if (roleInput) roleInput.checked = true;
  }

  document.querySelector("#forgot")?.addEventListener("click", () => {
    window.location.href = "404.html";
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const msg = document.querySelector("#login-msg");
    const name = loginForm.name.value.trim();
    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;
    const role = roleValue();
    if (!name || !EMAIL.test(email) || password.length < 6) {
      msg.textContent = "Add your name, a real email, and a password of at least 6 characters.";
      return;
    }
    if (!loginForm.remember.checked) sessionStorage.setItem("rosely-session", "once");
    enterDesk({ name, email, role });
  });
}

const signupForm = document.querySelector("#signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const msg = document.querySelector("#signup-msg");
    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim().toLowerCase();
    const password = signupForm.password.value;
    const confirm = signupForm.confirm.value;
    const role = roleValue();
    if (!name || !EMAIL.test(email)) {
      msg.textContent = "Add your name and a real email.";
      return;
    }
    if (password.length < 6) {
      msg.textContent = "Use a password of at least 6 characters.";
      return;
    }
    if (password !== confirm) {
      msg.textContent = "The two passwords do not match.";
      return;
    }
    if (!signupForm.querySelector("#signup-terms").checked) {
      msg.textContent = "Agree to the terms before creating the account.";
      return;
    }
    const list = accounts().filter((item) => !(item.email === email && item.role === role));
    list.push({ name, email, password, role });
    saveAccounts(list);
    sessionStorage.setItem("rosely-login-note", "Account created. Log in to open your dashboard.");
    const next = new URLSearchParams({ name, email, role });
    window.location.href = `login.html?${next}`;
  });
}
