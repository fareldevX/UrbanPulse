const USERS_KEY = "urbanpulse.users.v1";
const SESSION_KEY = "urbanpulse.session.v1";
const EVT = "urbanpulse:session-changed";

export const ROLES = { user: "Resident", admin: "Officer (admin)" };
export const STATUS_LABEL = { active: "Active", pending: "Waiting for approval", rejected: "Rejected" };

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const uid = () => `U-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(8)));

async function digest(text) {
  if (globalThis.crypto?.subtle) {
    return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `weak-${h.toString(16)}`;
}
const hashOf = (password, salt) => digest(`${salt}:${password}`);

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const SEED = [
  { name: "Demo Admin", username: "admin", password: "admin123", role: "admin", status: "active" },
  { name: "Demo Resident", username: "warga", password: "warga123", role: "user", status: "active" },
];

let users = null;

async function seedIfEmpty() {
  const stored = read(USERS_KEY, null);
  if (Array.isArray(stored)) return stored;
  const seeded = [];
  for (const s of SEED) {
    const salt = newSalt();
    seeded.push({
      id: uid(), name: s.name, username: s.username, role: s.role, status: s.status,
      salt, hash: await hashOf(s.password, salt),
      createdAt: new Date().toISOString(), approvedBy: null, approvedAt: null,
      note: "Akun demo bawaan, ganti kalau dipakai di luar demo.",
    });
  }
  write(USERS_KEY, seeded);
  return seeded;
}

export async function ready() {
  if (!users) users = await seedIfEmpty();
  return users;
}

async function load() {
  if (!users) users = await seedIfEmpty();
  return users;
}

const publicUser = (u) => (u ? {
  id: u.id, name: u.name, username: u.username, role: u.role, status: u.status,
  createdAt: u.createdAt, approvedBy: u.approvedBy ?? null, approvedAt: u.approvedAt ?? null,
} : null);

const emit = () => window.dispatchEvent(new CustomEvent(EVT, { detail: { session: getSession() } }));

export async function listUsers() {
  return (await load()).map(publicUser);
}

export async function pendingAdmins() {
  return (await load()).filter((u) => u.role === "admin" && u.status === "pending").map(publicUser);
}

export function getSession() {
  const s = read(SESSION_KEY, null);
  if (!s || typeof s !== "object" || !s.userId) return null;
  const u = (users || []).find((x) => x.id === s.userId) || read(USERS_KEY, []).find((x) => x.id === s.userId);
  if (!u) return null;
  return { userId: u.id, username: u.username, name: u.name, role: u.role, status: u.status, loginAt: s.loginAt };
}

export function isSignedIn() {
  return !!getSession();
}

export function isActiveAdmin() {
  const s = getSession();
  return !!s && s.role === "admin" && s.status === "active";
}

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/;

export async function register({ name, username, password, role }) {
  const list = await load();
  const cleanName = String(name ?? "").trim();
  const cleanUser = String(username ?? "").trim().toLowerCase();
  const pass = String(password ?? "");
  if (cleanName.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  if (!USERNAME_RE.test(cleanUser)) return { ok: false, error: "Username must be 3-20 characters, letters, numbers, dot, dash or underscore." };
  if (pass.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if (list.some((u) => u.username.toLowerCase() === cleanUser)) return { ok: false, error: "That username is already taken." };
  if (role !== "user" && role !== "admin") return { ok: false, error: "Choose a role first." };

  const salt = newSalt();
  const user = {
    id: uid(), name: cleanName, username: cleanUser, role, status: role === "admin" ? "pending" : "active",
    salt, hash: await hashOf(pass, salt), createdAt: new Date().toISOString(),
    approvedBy: null, approvedAt: null, note: "",
  };
  if (!write(USERS_KEY, [...list, user])) return { ok: false, error: "Local storage is not available in this browser." };
  users = [...list, user];
  emit();
  return { ok: true, user: publicUser(user) };
}

export async function login(username, password) {
  const list = await load();
  const cleanUser = String(username ?? "").trim().toLowerCase();
  const u = list.find((x) => x.username.toLowerCase() === cleanUser);
  if (!u) return { ok: false, error: "No account with that username." };
  if ((await hashOf(String(password ?? ""), u.salt)) !== u.hash) return { ok: false, error: "Wrong password." };
  if (u.status === "rejected") return { ok: false, error: "This admin request was rejected. Ask an admin to review it again." };
  if (!write(SESSION_KEY, { userId: u.id, loginAt: new Date().toISOString() })) {
    return { ok: false, error: "Local storage is not available in this browser." };
  }
  emit();
  return { ok: true, user: publicUser(u) };
}

export function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
  emit();
}

export async function approveAdmin(userId) {
  const actor = getSession();
  if (!isActiveAdmin()) return { ok: false, error: "Only an active admin can approve admin accounts." };
  const list = await load();
  const target = list.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "Account not found." };
  if (target.role !== "admin" || target.status !== "pending") return { ok: false, error: "That account is not waiting for approval." };
  const next = { ...target, status: "active", approvedBy: actor.username, approvedAt: new Date().toISOString() };
  users = list.map((u) => (u.id === userId ? next : u));
  if (!write(USERS_KEY, users)) return { ok: false, error: "Local storage is not available in this browser." };
  emit();
  return { ok: true, user: publicUser(next) };
}

export async function rejectAdmin(userId) {
  const actor = getSession();
  if (!isActiveAdmin()) return { ok: false, error: "Only an active admin can review admin accounts." };
  const list = await load();
  const target = list.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "Account not found." };
  if (target.role !== "admin" || target.status !== "pending") return { ok: false, error: "That account is not waiting for approval." };
  const next = { ...target, status: "rejected", approvedBy: actor.username, approvedAt: new Date().toISOString() };
  users = list.map((u) => (u.id === userId ? next : u));
  if (!write(USERS_KEY, users)) return { ok: false, error: "Local storage is not available in this browser." };
  emit();
  return { ok: true, user: publicUser(next) };
}

export function subscribe(fn) {
  const h = (e) => fn(e.detail);
  window.addEventListener(EVT, h);
  const s = (e) => { if (e.key === USERS_KEY || e.key === SESSION_KEY || e.key === null) { users = null; load().then(() => fn({ session: getSession() })); } };
  window.addEventListener("storage", s);
  return () => { window.removeEventListener(EVT, h); window.removeEventListener("storage", s); };
}

export function accountAge(iso) {
  const d = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  if (!Number.isFinite(d)) return "unknown";
  if (d < 60) return `${d} min ago`;
  if (d < 1440) return `${Math.round(d / 60)} h ago`;
  return `${Math.round(d / 1440)} d ago`;
}
