// Data-driven landing sections (timeline, priority queue, impact). Reads the shared report repository.
import * as repo from "../../services/reportRepository.js";

const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const CATC = { road: "#ef4444", streetlight: "#f59e0b", waste: "#10b981", flood: "#3b82f6" };
const CLS = { pending: "pending", "in-progress": "progress", resolved: "resolved" };
const fmt = (iso) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const gs = () => (window.gsap && !rm() ? window.gsap : null);
const badge = (r) => el("span", `badge ${CLS[r.status]}`, repo.STATUSES[r.status]);

/* ---- 06 impact ---- */
let group = "category";
const STC = { pending: "#f59e0b", "in-progress": "#38bdf8", resolved: "#10b981" }, URC = { low: "#64748b", medium: "#f59e0b", high: "#ef4444" };
const GROUPS = {
  category: { keys: Object.keys(repo.CATEGORIES), label: (k) => repo.CATEGORIES[k], get: (r) => r.category, color: (k) => CATC[k] },
  status: { keys: Object.keys(repo.STATUSES), label: (k) => repo.STATUSES[k], get: (r) => r.status, color: (k) => STC[k] },
  urgency: { keys: Object.keys(repo.URGENCY), label: (k) => repo.URGENCY[k], get: (r) => r.urgency, color: (k) => URC[k] },
};
function renderImpact(rs) {
  const done = rs.filter((r) => r.status === "resolved");
  const days = done.map((r) => (Date.parse(r.updatedAt) - Date.parse(r.createdAt)) / 864e5);
  const set = (id, v) => { const n = $("#" + id); if (n) n.textContent = v; };
  set("kpiTotal", rs.length);
  set("kpiPct", `${rs.length ? Math.round((done.length / rs.length) * 100) : 0}%`);
  set("kpiAvg", days.length ? `${(days.reduce((a, b) => a + b, 0) / days.length).toFixed(1)} d` : "n/a");
  set("kpiHot", rs.filter((r) => r.urgency === "high" && r.status !== "resolved").length);
  set("barsN", rs.length);
  const G = GROUPS[group], list = $("#bars");
  if (!list) return;
  const max = Math.max(1, ...G.keys.map((k) => rs.filter((r) => G.get(r) === k).length));
  if (list.children.length !== G.keys.length) list.replaceChildren(...G.keys.map(() => {
    const li = el("li", "bar"), t = el("span", "bar-t"); t.append(el("b"));
    li.append(el("span", "bar-l"), t, el("span", "bar-v")); return li;
  }));
  G.keys.forEach((k, i) => {
    const li = list.children[i], n = rs.filter((r) => G.get(r) === k).length, pct = rs.length ? Math.round((n / rs.length) * 100) : 0;
    li.style.setProperty("--c", G.color(k)); li.style.setProperty("--w", n / max);
    li.querySelector(".bar-l").textContent = G.label(k);
    li.querySelector(".bar-v").textContent = `${n} | ${pct}%`;
    li.title = `${G.label(k)}: ${n} of ${rs.length} reports`;
  });
}
const seg = $("#impactSeg");
if (seg) seg.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  group = b.dataset.g;
  seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  renderImpact(repo.getReports());
  const g = gs(); if (g) g.fromTo("#bars", { "--k": 0 }, { "--k": 1, duration: 0.8, ease: "power3.out" });
});

/* ---- 03 timeline ---- */
let selId = null;
function renderTimeline(rs, animate, refocus) {
  const pick = $("#tlPick"), tl = $("#tl");
  if (!pick || !tl) return;
  const list = [...rs].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 6);
  if (!list.length) { pick.replaceChildren(); tl.replaceChildren(el("p", "empty", "No reports yet. File the first one and its history will appear here.")); return; }
  if (!list.some((r) => r.id === selId)) selId = (list.find((r) => r.status === "resolved") || list[0]).id;
  pick.replaceChildren(...list.map((r) => {
    const b = el("button"); b.type = "button"; b.setAttribute("aria-pressed", String(r.id === selId));
    b.append(el("strong", "", r.title), badge(r), el("span", "", r.id));
    b.addEventListener("click", () => { selId = r.id; renderTimeline(repo.getReports(), true, true); });
    return b;
  }));
  if (refocus) pick.querySelector("[aria-pressed=true]").focus({ preventScroll: true });
  const r = repo.getReportById(selId), meta = el("div", "tl-meta"), a = el("a", "", "Open on the map");
  a.href = `peta.html?laporan=${encodeURIComponent(r.id)}`;
  meta.append(el("h3", "", r.title), el("span", "", `${repo.CATEGORIES[r.category]} | Urgency: ${repo.URGENCY[r.urgency]}`), a);
  const track = el("div", "tl-track"); track.append(el("span", "tl-line"));
  r.timeline.forEach((t) => { const n = el("div", "tl-node"); n.append(el("h4", "", t.label), el("time", "", fmt(t.timestamp)), el("p", "", t.note || "No note.")); track.append(n); });
  tl.replaceChildren(meta, track);
  const g = animate && gs();
  if (g) { g.from(".tl-line", { scaleX: 0, duration: 0.9, ease: "power3.inOut" }); g.from(".tl-node", { x: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power3.out", delay: 0.15 }); }
}

/* ---- 04 priority (demo votes live in memory only) ---- */
const votes = new Map(); let hideDone = true;
function renderPrio(rs, flip, focusId) {
  const list = $("#prio");
  if (!list) return;
  const items = rs.filter((r) => !(hideDone && r.status === "resolved")).map((r) => ({ r, n: r.upvotes + (votes.get(r.id) || 0) })).sort((a, b) => b.n - a.n).slice(0, 6);
  const before = new Map([...list.children].map((li) => [li.dataset.id, li.getBoundingClientRect().top]));
  if (!items.length) { list.replaceChildren(el("li", "empty", "Nothing open right now. Every report in this sample is resolved.")); return; }
  const max = Math.max(1, ...items.map((i) => i.n));
  list.replaceChildren(...items.map(({ r, n }, i) => {
    const li = el("li"); li.dataset.id = r.id; li.tabIndex = -1; li.style.setProperty("--c", CATC[r.category]);
    const t = el("div", "pr-t"), meta = el("div", "pr-meta"), bar = el("div", "pr-bar"), b = el("b"); b.style.setProperty("--w", n / max); bar.append(b);
    const dot = el("i"); meta.append(dot, el("span", "", repo.CATEGORIES[r.category]), badge(r), el("span", "", r.id));
    t.append(el("strong", "", r.title), meta, bar);
    const v = el("div", "pr-vote"), btn = el("button", "pr-btn", votes.has(r.id) ? "Voted" : "Upvote");
    btn.type = "button"; btn.disabled = votes.has(r.id); btn.setAttribute("aria-label", `Upvote: ${r.title}`);
    btn.addEventListener("click", () => { votes.set(r.id, 1); renderPrio(repo.getReports(), true, r.id); });
    v.append(el("span", "pr-n", n), btn);
    li.append(el("span", "rk", String(i + 1).padStart(2, "0")), t, v); return li;
  }));
  if (focusId) list.querySelector(`[data-id="${focusId}"]`)?.focus({ preventScroll: true });
  if (flip && !rm()) [...list.children].forEach((li) => { const p = before.get(li.dataset.id); if (p == null) return; const d = p - li.getBoundingClientRect().top; if (d) li.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" }); });
}
const tog = $("#prioOpen");
if (tog) tog.addEventListener("change", () => { hideDone = tog.checked; renderPrio(repo.getReports(), true); });

function renderAll() { const rs = repo.getReports(); renderImpact(rs); renderTimeline(rs); renderPrio(rs); }
renderAll();
repo.subscribe(renderAll);

/* scroll motion for the dynamic blocks (plugin is registered by home-motion.js) */
const g = gs();
if (g && window.ScrollTrigger) {
  g.fromTo("#bars", { "--k": 0 }, { "--k": 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: "#bars", start: "top 85%" } });
  g.fromTo("#prio", { "--k": 0 }, { "--k": 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: "#prio", start: "top 85%" } });
  g.from("#prio li", { clipPath: "inset(0 0 100% 0)", stagger: 0.09, duration: 0.7, ease: "power3.out", clearProps: "clipPath", scrollTrigger: { trigger: "#prio", start: "top 85%" } });
  window.requestAnimationFrame(() => window.ScrollTrigger.refresh());
}
