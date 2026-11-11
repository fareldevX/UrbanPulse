import { initialReports } from "../data/initialReports.js";
import { getSession } from "./authStore.js";

const KEY = "urbanpulse.reports.v1";
const EVT = "urbanpulse:reports-changed";
export const CATEGORIES = { road: "Road Damage", streetlight: "Broken Streetlight", waste: "Waste", flood: "Flooding" };
export const STATUSES = { pending: "Pending", "in-progress": "In Progress", resolved: "Resolved" };
export const URGENCY = { low: "Low", medium: "Medium", high: "High" };
const TL = { pending: "Report Received", "in-progress": "In Progress", resolved: "Resolved" };

let mem = null;

function normalize(r) {
  if (!r || typeof r !== "object") return null;
  const lat = Number(r.coordinates?.lat), lng = Number(r.coordinates?.lng);
  if (!/^UP-\d{4}-\d{5}$/.test(r.id) || !CATEGORIES[r.category] || !STATUSES[r.status] || !URGENCY[r.urgency]) return null;
  if (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180)) return null;
  const created = Number.isNaN(Date.parse(r.createdAt)) ? new Date().toISOString() : r.createdAt;
  return {
    id: r.id, title: String(r.title ?? "").slice(0, 120), category: r.category, urgency: r.urgency,
    description: String(r.description ?? "").slice(0, 1000), coordinates: { lat, lng },
    image: typeof r.image === "string" && r.image.startsWith("data:image/jpeg;base64,") ? r.image : null,
    status: r.status, upvotes: Math.max(0, Number(r.upvotes) | 0), createdAt: created,
    ownerId: typeof r.ownerId === "string" && r.ownerId ? r.ownerId : null,
    updatedAt: Number.isNaN(Date.parse(r.updatedAt)) ? created : r.updatedAt,
    timeline: (Array.isArray(r.timeline) ? r.timeline : []).filter((t) => t && STATUSES[t.status])
      .map((t) => ({ status: t.status, label: String(t.label ?? TL[t.status]), timestamp: t.timestamp, note: String(t.note ?? "") })),
  };
}

function load() {
  if (mem) return mem;
  let raw = null, list = null;
  try { raw = localStorage.getItem(KEY); } catch { /* storage unavailable: memory only */ }
  if (raw !== null) {
    try { const a = JSON.parse(raw); if (Array.isArray(a)) list = a.map(normalize).filter(Boolean); }
    catch { console.warn("UrbanPulse: stored data was corrupted, so sample data was reloaded."); }
  }
  if (!list) { // seed only when key is absent (or unreadable)
    list = initialReports.map(normalize);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { console.warn("UrbanPulse: local storage is unavailable, using memory only."); }
  }
  return (mem = list);
}

function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); }
  catch (e) {
    throw new Error(e?.name === "QuotaExceededError" ? "Storage is full. Remove the photo or use a smaller image." : "Local storage is not available in this browser.");
  }
  mem = list;
}

const emit = (type, id) => window.dispatchEvent(new CustomEvent(EVT, { detail: { type, id, reports: getReports() } }));
const copy = (r) => structuredClone(r);

export const getReports = () => load().map(copy);
export const getReportById = (id) => { const r = load().find((x) => x.id === id); return r ? copy(r) : null; };

export function createReport(d) {
  const list = load();
  const n = list.reduce((m, r) => Math.max(m, Number(r.id.slice(-5))), 0) + 1;
  const now = new Date().toISOString();
  const r = normalize({
    id: `UP-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`,
    title: String(d?.title ?? "").trim(), category: d?.category, urgency: d?.urgency,
    description: String(d?.description ?? "").trim(), coordinates: d?.coordinates, image: d?.image || null,
    status: "pending", upvotes: 0, createdAt: now, updatedAt: now,
    // Laporan milik akun yang sedang login (dipakai dashboard "laporan saya").
    ownerId: getSession()?.userId ?? null,
    timeline: [{ status: "pending", label: TL.pending, timestamp: now, note: "Report submitted successfully." }],
  });
  if (!r || !r.title || !r.description) throw new Error("Invalid report data.");
  save([...list, r]);
  emit("create", r.id);
  return copy(r);
}

export function updateReport(id, updates) {
  const list = load(), i = list.findIndex((r) => r.id === id);
  if (i < 0) return null;
  const { title, description, category, urgency, upvotes, image } = updates ?? {};
  const patch = Object.fromEntries(Object.entries({ title, description, category, urgency, upvotes, image }).filter(([, v]) => v !== undefined));
  const merged = normalize({ ...list[i], ...patch, updatedAt: new Date().toISOString() });
  if (!merged) throw new Error("Invalid update.");
  save(list.map((r, k) => (k === i ? merged : r)));
  emit("update", id);
  return copy(merged);
}

export function updateReportStatus(id, status, note = "") {
  if (!STATUSES[status]) throw new Error("Invalid status.");
  const list = load(), cur = list.find((r) => r.id === id);
  if (!cur) return null;
  const now = new Date().toISOString();
  const next = { ...cur, status, updatedAt: now, timeline: [...cur.timeline, { status, label: TL[status], timestamp: now, note: String(note) }] };
  save(list.map((r) => (r.id === id ? next : r)));
  emit("status", id);
  return copy(next);
}

export function deleteReport(id) {
  const list = load();
  if (!list.some((r) => r.id === id)) return false;
  save(list.filter((r) => r.id !== id));
  emit("delete", id);
  return true;
}

export function subscribe(fn) {
  const h = (e) => fn(e.detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

// Cross-tab sync
window.addEventListener("storage", (e) => {
  if (e.key === KEY || e.key === null) { mem = null; load(); emit("external", null); }
});
