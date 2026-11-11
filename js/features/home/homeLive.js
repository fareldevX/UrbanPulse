// Menghubungkan beranda (Person 1) ke repository laporan yang sama dengan peta.
import * as repo from "../../services/reportRepository.js";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const CLS = { pending: "pending", "in-progress": "progress", resolved: "resolved" };
const ago = (iso) => {
  const m = Math.round((Date.parse(iso) - Date.now()) / 6e4), a = Math.abs(m);
  return a < 60 ? rtf.format(m, "minute") : a < 1440 ? rtf.format(Math.round(m / 60), "hour") : rtf.format(Math.round(m / 1440), "day");
};
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function stats(rs) {
  const done = rs.filter((r) => r.status === "resolved");
  const days = done.map((r) => (Date.parse(r.updatedAt) - Date.parse(r.createdAt)) / 864e5);
  return { total: rs.length, open: rs.length - done.length, pct: rs.length ? Math.round((done.length / rs.length) * 100) : 0,
    avg: days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0, votes: rs.reduce((s, r) => s + r.upvotes, 0) };
}

const NS = "http://www.w3.org/2000/svg";
let layer = "all";
function renderPins(rs) {
  const g = document.getElementById("hxPins");
  if (!g) return;
  const tip = document.getElementById("hxTip"), hero = g.closest(".hx"), first = !g.children.length;
  const hide = () => { tip.hidden = true; };
  g.replaceChildren(...rs.map((r) => {
    const x = Math.min(780, Math.max(20, 80 + ((r.coordinates.lng - 110.35) / 0.06) * 640));
    const y = Math.min(580, Math.max(20, 60 + ((-7.71 - r.coordinates.lat) / 0.11) * 480));
    const a = document.createElementNS(NS, "a");
    a.setAttribute("href", `peta.html?laporan=${encodeURIComponent(r.id)}`);
    a.setAttribute("class", `hx-pin hx-pin--${r.category}${r.urgency === "high" && r.status !== "resolved" ? " hot" : ""}${layer !== "all" && layer !== r.category ? " is-dim" : ""}`);
    a.dataset.cat = r.category;
    a.setAttribute("aria-label", `${repo.CATEGORIES[r.category]}: ${r.title} (${repo.STATUSES[r.status]})`);
    for (const [c, rad] of [["ring", 9], ["dot", 6]]) {
      const k = document.createElementNS(NS, "circle");
      k.setAttribute("class", c); k.setAttribute("cx", x); k.setAttribute("cy", y); k.setAttribute("r", rad); a.append(k);
    }
    const show = () => {
      const t = el("strong", "", r.title), b = el("span", `badge ${CLS[r.status]}`, repo.STATUSES[r.status]);
      tip.replaceChildren(t, el("small", "", `${repo.CATEGORIES[r.category]} | Urgency: ${repo.URGENCY[r.urgency]}`), b, el("small", "", "Select to open this report"));
      const pr = a.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      tip.style.left = `${Math.max(8, Math.min(hr.width - 240, pr.left - hr.left + 16))}px`;
      tip.style.top = `${Math.max(8, pr.top - hr.top - 12)}px`;
      tip.hidden = false;
    };
    ["mouseenter", "focus"].forEach((e) => a.addEventListener(e, show));
    ["mouseleave", "blur"].forEach((e) => a.addEventListener(e, hide));
    return a;
  }));
  if (first) document.dispatchEvent(new Event("up:pins"));
}
document.querySelectorAll(".hx-chip").forEach((c) => c.addEventListener("click", () => {
  layer = c.dataset.cat;
  document.querySelectorAll(".hx-chip").forEach((o) => o.setAttribute("aria-pressed", String(o === c)));
  document.querySelectorAll(".hx-pin").forEach((p) => p.classList.toggle("is-dim", layer !== "all" && p.dataset.cat !== layer));
}));

function render() {
  const rs = repo.getReports(), s = stats(rs);
  document.querySelectorAll("[data-live]").forEach((e) => { const v = s[e.dataset.live]; e.dataset.count = e.dataset.live === "avg" ? v.toFixed(1) : String(v); });
  document.querySelectorAll("[data-live-text]").forEach((e) => { const k = e.dataset.liveText, v = s[k] ?? 0; e.textContent = k === "pct" ? `${v}%` : v.toLocaleString("en-US"); });
  renderPins(rs);
  const feed = document.getElementById("feedList");
  if (!feed) return;
  const latest = [...rs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3);
  feed.replaceChildren(...latest.map((r) => {
    const a = el("a", "", r.title); a.href = `peta.html?laporan=${encodeURIComponent(r.id)}`;
    const strong = el("strong"); strong.append(a);
    const row = el("span"); row.style.cssText = "display:flex;justify-content:space-between;align-items:center";
    row.append(el("span", `badge ${CLS[r.status]}`, repo.STATUSES[r.status]), el("small", "", ago(r.createdAt)));
    const li = el("li"); li.append(strong, row); return li;
  }));
}
render();
repo.subscribe(render);
