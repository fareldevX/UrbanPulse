import * as repo from "../../services/reportRepository.js";
import { h, fmtDate, anim } from "../../utils/dom.js";
import { createReportForm } from "../reports/reportForm.js";

const CENTER = [-7.7828, 110.3671]; // Yogyakarta (wilayah demo)
const CLS = { pending: "pending", "in-progress": "progress", resolved: "resolved" };
const SLUG = { jalan: "road", lampu: "streetlight", sampah: "waste", banjir: "flood" };
const GLYPH = { pending: "!", "in-progress": "…", resolved: "✓" };
const PATH = {
  road: "M4 21 9 3M20 21 15 3M12 5v3M12 11v3M12 17v3",
  streetlight: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  waste: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  flood: "M2 9q2.5-3 5 0t5 0 5 0 5 0M2 15q2.5-3 5 0t5 0 5 0 5 0",
};
const svg = (c, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATH[c]}"/></svg>`;
// Only validated enum values reach this template (see repository.normalize).
const icon = (r) => window.L.divIcon({ className: "", iconSize: [34, 34], iconAnchor: [17, 17],
  html: `<span class="up-marker up-marker--${r.category} up-marker--${r.status}${r.urgency === "high" && r.status !== "resolved" ? " is-hot" : ""}">${svg(r.category)}<i class="up-marker-st">${GLYPH[r.status]}</i></span>` });

/** Animate the detail panel with GSAP slide-from-right if available, else fallback to anim(). */
function animateDetailIn(el) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const g = window.gsap;
  if (g) {
    const isMobile = window.innerWidth <= 720;
    g.fromTo(
      el,
      isMobile
        ? { y: 60, opacity: 0, scale: 0.97 }
        : { x: 48, opacity: 0 },
      isMobile
        ? { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: "power3.out", clearProps: "transform,opacity" }
        : { x: 0, opacity: 1,           duration: 0.38, ease: "power3.out", clearProps: "transform,opacity" }
    );
  } else {
    anim(el);
  }
}

export function initUrbanPulseMap(root = document.getElementById("up-map-root")) {
  if (!root || root.dataset.upReady || !window.L) return null;
  root.dataset.upReady = "1";
  let cat = "all", openId = null;
  const sts = new Set(), markers = new Map();

  const allowReport = root.dataset.allowReport !== "false" && root.dataset.mode !== "view";

  const count = h("p", { class: "up-map-count", "aria-live": "polite" });
  let cta = null;
  const metaKids = [count];
  if (allowReport) {
    cta = h("button", { type: "button", class: "btn btn-primary up-map-cta", onclick: () => { closeDetail(true); form.open(cta); } }, "Report an issue");
    metaKids.push(cta);
  }

  const head = h("header", { class: "up-map-head" },
    h("div", {}, h(root.dataset.heading || "h2", {}, root.dataset.title || "City infrastructure map"), h("p", {}, "Demo area: Yogyakarta and surroundings. Every incident on this map is simulated data, not a verified citizen report.")),
    h("div", { class: "up-map-meta" }, ...metaKids));

  const chip = (label, on, k) => h("button", { type: "button", class: "up-map-chip", "aria-pressed": "false", "data-k": k, onclick: on }, label);
  const catBtns = Object.entries({ all: "All", ...repo.CATEGORIES }).map(([k, l]) => chip(l, () => { cat = k; sync(); }, k));
  const stBtns = Object.entries(repo.STATUSES).map(([k, l]) => chip(`${GLYPH[k]} ${l}`, () => { sts.has(k) ? sts.delete(k) : sts.add(k); sync(); }, k));
  const resetAll = () => { cat = "all"; sts.clear(); sync(); };
  const filters = h("div", { class: "up-map-filters" },
    h("div", { class: "up-map-group", role: "group", "aria-label": "Category filter" }, catBtns),
    h("div", { class: "up-map-group", role: "group", "aria-label": "Status filter" }, stBtns),
    h("button", { type: "button", class: "up-map-reset", onclick: resetAll }, "Reset filters"));

  const canvas = h("div", { class: "up-map-canvas" });
  const detail = h("aside", { class: "up-detail", hidden: true, role: "dialog", "aria-labelledby": "up-detail-title" });
  const empty = h("div", { class: "up-map-empty", hidden: true, role: "status" }, h("p", {}, "No reports match this combination of filters."), chip("Show all", resetAll));
  const legend = h("ul", { class: "up-map-legend", "aria-label": "Map legend" },
    Object.entries(repo.CATEGORIES).map(([k, l]) => { const li = h("li", { class: `up-marker--${k}` }); li.innerHTML = svg(k, 14); li.append(l); return li; }),
    h("li", { class: "up-map-legend-st" }, "! Pending   … In Progress   ✓ Resolved"));
  const stage = h("div", { class: "up-map-stage" }, canvas, legend, empty, detail);
  root.classList.add("up-map");
  root.replaceChildren(head, filters, stage);

  const map = window.L.map(canvas, { minZoom: 11 }).setView(CENTER, 13);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19,
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>" }).addTo(map);
  const layer = window.L.layerGroup().addTo(map);
  new ResizeObserver(() => map.invalidateSize()).observe(canvas);

  const form = allowReport
    ? createReportForm({ stage, map, onView: (id) => { resetAll(); showDetail(id); } })
    : {
        isPicking: () => false,
        cancelPick: () => {},
        isOpen: () => false,
        open: () => {},
        close: () => {},
      };

  function sync() {
    const all = repo.getReports();
    const vis = all.filter((r) => (cat === "all" || r.category === cat) && (!sts.size || sts.has(r.status)));
    const ids = new Set(vis.map((r) => r.id));
    for (const [id, m] of markers) if (!ids.has(id)) { layer.removeLayer(m.mk); markers.delete(id); }
    for (const r of vis) {
      const sig = `${r.category}|${r.status}|${r.urgency}`, m = markers.get(r.id);
      if (!m) {
        const mk = window.L.marker([r.coordinates.lat, r.coordinates.lng], { icon: icon(r), title: r.title, alt: r.title, keyboard: true })
          .on("click", () => { if (!form.isPicking()) showDetail(r.id); });
        layer.addLayer(mk); markers.set(r.id, { mk, sig });
      } else if (m.sig !== sig) { m.mk.setIcon(icon(r)); m.sig = sig; }
    }
    catBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === cat)));
    stBtns.forEach((b) => b.setAttribute("aria-pressed", String(sts.has(b.dataset.k))));
    count.replaceChildren(h("b", {}, String(vis.length)), `of ${all.length} reports shown`);
    empty.hidden = vis.length > 0;
    if (openId) { if (repo.getReportById(openId)) renderDetail(openId); else closeDetail(true); }
  }

  function renderDetail(id) {
    const r = repo.getReportById(id);
    const photo = r.image
      ? h("img", { class: "up-detail-photo", src: r.image, alt: `Report photo: ${r.title}`, onerror: (e) => e.target.replaceWith(h("div", { class: "up-detail-photo up-detail-nophoto" }, "Photo unavailable")) })
      : h("div", { class: "up-detail-photo up-detail-nophoto" }, "No photo");
    const row = (k, v) => [h("dt", {}, k), h("dd", {}, v)];
    detail.replaceChildren(
      h("div", { class: "up-detail-top" }, h("span", { class: "up-detail-id" }, r.id),
        h("button", { type: "button", class: "up-detail-x", "aria-label": "Close details", onclick: () => closeDetail() }, "×")),
      h("h3", { id: "up-detail-title" }, r.title),
      h("p", { class: `up-detail-tags up-marker--${r.category}` }, `${repo.CATEGORIES[r.category]}  |  Urgency ${repo.URGENCY[r.urgency]}`),
      h("span", { class: `badge ${CLS[r.status]}` }, repo.STATUSES[r.status]),
      photo, h("p", { class: "up-detail-desc" }, r.description),
      h("dl", {}, row("Submitted", fmtDate(r.createdAt)), row("Coordinates", `${r.coordinates.lat.toFixed(5)}, ${r.coordinates.lng.toFixed(5)}`), row("Upvotes", String(r.upvotes))),
      h("ol", { class: "up-detail-tl", "aria-label": "Status history" }, r.timeline.map((t) => h("li", {}, `${t.label}, ${fmtDate(t.timestamp)}`))));
  }
  function showDetail(id) {
    const r = repo.getReportById(id);
    if (!r) return;
    form.close();
    const first = detail.hidden; openId = id; renderDetail(id); detail.hidden = false;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.setView([r.coordinates.lat, r.coordinates.lng], Math.max(map.getZoom(), 15), { animate: !reduce });
    if (stage.clientWidth > 720) map.panBy([190, 0], { animate: false });
    if (first) animateDetailIn(detail);
    detail.querySelector(".up-detail-x").focus();
  }
  function closeDetail(silent) {
    const id = openId; openId = null; detail.hidden = true;
    if (!silent) markers.get(id)?.mk.getElement()?.focus();
  }

  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (form.isPicking()) form.cancelPick(); else if (openId) closeDetail(); else if (form.isOpen()) form.close();
  });
  repo.subscribe(sync);
  const q = new URLSearchParams(location.search), k = q.get("kategori");
  if (k) cat = repo.CATEGORIES[k] ? k : SLUG[k] || "all"; // ?kategori=road|jalan|lampu|sampah|banjir
  sync();
  if (root.dataset.mode === "report") form.open(cta); // lapor.html
  else if (q.get("laporan")) showDetail(q.get("laporan")); // ?laporan=UP-2026-00001
  return { map, refresh: sync, openDetail: showDetail };
}
