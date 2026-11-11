import * as auth from "../services/authStore.js";
import { anim, h } from "../utils/dom.js";

const mode = document.body.dataset.auth;
const form = document.getElementById(mode === "register" ? "register-form" : "login-form");
const alertBox = document.getElementById("auth-alert");
const sessionNote = document.getElementById("auth-session-note");

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/;
const tracked = [];
const track = (el) => { if (el) tracked.push(el); return el; };

function clearInvalid() {
  for (const el of tracked) el.removeAttribute("aria-invalid");
}

function setAlert(title, messages) {
  if (!alertBox) return;
  const list = (Array.isArray(messages) ? messages : [messages]).filter(Boolean);
  if (!list.length) {
    alertBox.hidden = true;
    alertBox.replaceChildren();
    return;
  }
  alertBox.hidden = false;
  alertBox.replaceChildren(
    h("p", { class: "auth-alert-title" }, title),
    h("ul", { class: "auth-alert-list" }, list.map((m) => h("li", {}, m))),
  );
}

function fail(items, title) {
  for (const i of items) if (i.el) i.el.setAttribute("aria-invalid", "true");
  setAlert(title, items.map((i) => i.msg));
  const first = items.find((i) => i.el);
  if (first && first.el.focus) first.el.focus();
  else if (alertBox && alertBox.focus) alertBox.focus();
}

function setBusy(btn, busy) {
  if (btn) btn.disabled = busy;
}

function showSessionNote() {
  if (!sessionNote) return;
  const s = auth.getSession();
  if (!s) {
    sessionNote.hidden = true;
    return;
  }
  const role = auth.ROLES[s.role] || s.role;
  sessionNote.hidden = false;
  sessionNote.replaceChildren(
    h("p", { class: "auth-alert-title" }, `You are already signed in as ${s.name} (${s.username}), ${role}.`),
    h("p", { class: "auth-alert-body" },
      h("a", { href: "dashboard.html" }, "Open your dashboard"),
      " or use Sign out in the top bar."),
  );
}

function initLogin() {
  const username = track(document.getElementById("login-username"));
  const password = track(document.getElementById("login-password"));
  const submit = document.getElementById("login-submit");
  if (!form || !username || !password) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInvalid();
    const items = [];
    if (!username.value.trim()) items.push({ el: username, msg: "Enter your username." });
    if (!password.value) items.push({ el: password, msg: "Enter your password." });
    if (items.length) return fail(items, "We could not sign you in.");

    setBusy(submit, true);
    let res;
    try {
      res = await auth.login(username.value.trim(), password.value);
    } catch {
      res = { ok: false, error: "Something went wrong while signing in. Please try again." };
    }
    setBusy(submit, false);
    if (res.ok) {
      location.href = "dashboard.html";
      return;
    }
    const msg = String(res.error || "Sign in failed.");
    let el = null;
    if (/no account/i.test(msg)) el = username;
    else if (/wrong password/i.test(msg)) el = password;
    if (el) el.setAttribute("aria-invalid", "true");
    setAlert("We could not sign you in.", [msg]);
    if (el) el.focus();
    else if (alertBox) alertBox.focus();
  });
}

function initRegister() {
  const name = track(document.getElementById("reg-name"));
  const username = track(document.getElementById("reg-username"));
  const password = track(document.getElementById("reg-password"));
  const confirm = track(document.getElementById("reg-confirm"));
  const roleInputs = form ? [...form.querySelectorAll('input[name="role"]')] : [];
  const roleFirst = roleInputs[0] || null;
  const submit = document.getElementById("register-submit");
  if (!form || !name || !username || !password || !confirm) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearInvalid();
    const chosen = roleInputs.find((r) => r.checked);
    const role = chosen ? chosen.value : "";
    const items = [];
    if (name.value.trim().length < 2) items.push({ el: name, msg: "Name must be at least 2 characters." });
    if (!USERNAME_RE.test(username.value.trim()))
      items.push({ el: username, msg: "Username must be 3 to 20 characters using letters, numbers, dot, dash or underscore." });
    if (password.value.length < 6) items.push({ el: password, msg: "Password must be at least 6 characters." });
    if (confirm.value !== password.value) items.push({ el: confirm, msg: "The two passwords do not match." });
    if (!chosen) items.push({ el: roleFirst, msg: "Choose an account type." });
    if (items.length) return fail(items, "We could not create your account.");

    setBusy(submit, true);
    let res;
    try {
      res = await auth.register({ name: name.value, username: username.value, password: password.value, role });
    } catch {
      res = { ok: false, error: "Something went wrong while creating the account. Please try again." };
    }
    if (!res.ok) {
      setBusy(submit, false);
      const msg = String(res.error || "Registration failed.");
      const el = /already taken/i.test(msg) ? username : null;
      if (el) el.setAttribute("aria-invalid", "true");
      setAlert("We could not create your account.", [msg]);
      if (el) el.focus();
      else if (alertBox) alertBox.focus();
      return;
    }

    let signed;
    try {
      signed = await auth.login(username.value.trim(), password.value);
    } catch {
      signed = { ok: false, error: "Automatic sign in failed." };
    }
    setBusy(submit, false);
    if (!signed.ok) {
      setAlert("Account created, but the automatic sign in failed.", [
        signed.error || "Sign in failed.",
        "Open the sign in page and use your new credentials.",
      ]);
      if (alertBox) alertBox.focus();
      return;
    }
    location.href = "dashboard.html";
  });
}

function entrance() {
  const items = [...document.querySelectorAll(".auth-card, .auth-demo, .auth-switch")];
  if (!items.length) return;
  if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.gsap.from(items, { y: 24, opacity: 0, duration: 0.28, ease: "power2.out", stagger: 0.08, clearProps: "all" });
    return;
  }
  items.forEach(anim);
}

async function start() {
  if (!form) return;
  await auth.ready();
  showSessionNote();
  if (mode === "register") initRegister();
  else initLogin();
  entrance();
}

start();
