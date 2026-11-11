import * as repo from "../services/reportRepository.js";
import { anim } from "../utils/dom.js";

const DAY = 864e5;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const STATUS_ORDER = ["pending", "in-progress", "resolved"];
const CATEGORY_ORDER = ["road", "streetlight", "waste", "flood"];
const URGENCY_ORDER = ["high", "medium", "low"];
const STATUS_CLASS = {
  pending: "pending",
  "in-progress": "progress",
  resolved: "resolved",
};
const URGENCY_RANK = { high: 0, medium: 1, low: 2 };

let sortMode = "newest";

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const setText = (id, value) => {
  const el = $(id);
  if (el) el.textContent = String(value);
};
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function dayKey(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function fmtShort(key) {
  const d = new Date(`${key}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}
function fmtDayOfMonth(key) {
  return String(new Date(`${key}T00:00:00Z`).getUTCDate());
}
function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

function resolutionDays(r) {
  const event = (r.timeline || []).find((t) => t.status === "resolved");
  const end = Date.parse(event ? event.timestamp : r.updatedAt);
  const start = Date.parse(r.createdAt);
  if (Number.isNaN(end) || Number.isNaN(start) || end < start) return null;
  return (end - start) / DAY;
}

function summarize(reports) {
  const total = reports.length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const days = reports
    .filter((r) => r.status === "resolved")
    .map(resolutionDays)
    .filter((v) => v !== null);
  const avgDays = days.length
    ? days.reduce((a, b) => a + b, 0) / days.length
    : null;
  const highOpen = reports.filter(
    (r) => r.urgency === "high" && r.status !== "resolved",
  ).length;
  return { total, resolved, avgDays, highOpen };
}

function renderKpi(reports) {
  const s = summarize(reports);
  setText("an-total", s.total);
  setText("an-resolved", `${pct(s.resolved, s.total)}%`);
  setText("an-resolved-sub", `${s.resolved} of ${s.total} reports`);
  setText("an-avgdays", s.avgDays === null ? "n/a" : s.avgDays.toFixed(1));
  setText(
    "an-avgdays-sub",
    s.avgDays === null
      ? "No resolved reports yet"
      : `Across ${plural(s.resolved, "resolved report")}`,
  );
  setText("an-highopen", s.highOpen);
}

function barRows(entries, total) {
  if (!total) return `<p class="an-empty">No reports to break down yet.</p>`;
  return entries
    .map(([label, count]) => {
      const share = pct(count, total);
      return `<div class="an-bar-row">
        <span class="an-bar-label">${esc(label)}</span>
        <span class="an-bar-track" role="img" aria-label="${esc(label)}: ${count} of ${total} reports, ${share} percent"><span class="an-bar-fill" style="width:${share}%"></span></span>
        <span class="an-bar-val"><b>${count}</b> &middot; ${share}%</span>
      </div>`;
    })
    .join("");
}

function renderBars(targetId, field, order, labels, reports) {
  const el = $(targetId);
  if (!el) return;
  const total = reports.length;
  el.innerHTML = barRows(
    order.map((k) => [labels[k], reports.filter((r) => r[field] === k).length]),
    total,
  );
}

function buildTrend(reports) {
  const counts = new Map();
  reports.forEach((r) => {
    const k = dayKey(r.createdAt);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  });
  const keys = [...counts.keys()].sort();
  if (!keys.length) return [];
  const out = [];
  const start = Date.parse(`${keys[0]}T00:00:00Z`);
  const end = Date.parse(`${keys[keys.length - 1]}T00:00:00Z`);
  for (let t = start; t <= end; t += DAY) {
    const key = new Date(t).toISOString().slice(0, 10);
    out.push({ key, count: counts.get(key) || 0 });
  }
  return out;
}

function renderTrend(reports) {
  const el = $("an-trend");
  const note = $("an-trend-note");
  if (!el) return;
  const data = buildTrend(reports);
  if (!data.length) {
    el.innerHTML = `<p class="an-empty">No reports yet, so there is nothing to chart.</p>`;
    if (note) note.textContent = "";
    return;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  el.innerHTML = `<div class="an-cols">${data
    .map((d) => {
      const height = Math.round((d.count / max) * 100);
      const full = fmtShort(d.key);
      return `<div class="an-col" title="${full}: ${plural(d.count, "report")}">
        <div class="an-col-track"><div class="an-col-bar" style="height:${height}%"></div></div>
        <span class="an-col-lbl an-col-lbl--full">${full}</span>
        <span class="an-col-lbl an-col-lbl--mini">${fmtDayOfMonth(d.key)}</span>
        <span class="sr-only">${full}: ${plural(d.count, "report")}</span>
      </div>`;
    })
    .join("")}</div>`;
  if (note) {
    const first = data[0].key;
    const last = data[data.length - 1].key;
    const year = new Date(`${last}T00:00:00Z`).getUTCFullYear();
    note.textContent = `${fmtShort(first)} to ${fmtShort(last)}, ${year} (UTC). The tallest day holds ${plural(max, "report")}.`;
  }
}

function renderRank(reports) {
  const el = $("an-rank");
  if (!el) return;
  if (!reports.length) {
    el.innerHTML = `<li class="an-empty">No reports yet.</li>`;
    return;
  }
  const top = [...reports]
    .sort((a, b) => b.upvotes - a.upvotes || a.id.localeCompare(b.id))
    .slice(0, 5);
  el.innerHTML = top
    .map(
      (r, i) => `<li class="an-rank-row">
        <span class="an-rank-n" aria-hidden="true">${i + 1}</span>
        <span class="an-rank-main">
          <span class="an-rank-title">${esc(r.title)}</span>
          <span class="an-rank-meta">${esc(repo.CATEGORIES[r.category])} / ${esc(repo.STATUSES[r.status])}</span>
        </span>
        <span class="an-rank-votes"><b>${r.upvotes}</b> ${r.upvotes === 1 ? "vote" : "votes"}</span>
      </li>`,
    )
    .join("");
}

function sortedReports(reports) {
  const list = [...reports];
  switch (sortMode) {
    case "oldest":
      return list.sort(
        (a, b) =>
          Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
          a.id.localeCompare(b.id),
      );
    case "votes":
      return list.sort(
        (a, b) => b.upvotes - a.upvotes || a.id.localeCompare(b.id),
      );
    case "urgency":
      return list.sort(
        (a, b) =>
          URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    case "category":
      return list.sort(
        (a, b) =>
          repo.CATEGORIES[a.category].localeCompare(
            repo.CATEGORIES[b.category],
          ) || a.id.localeCompare(b.id),
      );
    default:
      return list.sort(
        (a, b) =>
          Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          a.id.localeCompare(b.id),
      );
  }
}

function renderTable(reports) {
  const body = $("an-tbody");
  if (!body) return;
  setText(
    "an-count",
    reports.length ? `${plural(reports.length, "report")} listed` : "",
  );
  if (!reports.length) {
    body.innerHTML = `<tr><td colspan="8" class="an-empty">No reports to list yet.</td></tr>`;
  } else {
    body.innerHTML = sortedReports(reports)
      .map(
        (r) => `<tr>
        <td data-label="ID"><span class="an-id">${esc(r.id)}</span></td>
        <td data-label="Title">${esc(r.title)}</td>
        <td data-label="Category">${esc(repo.CATEGORIES[r.category])}</td>
        <td data-label="Urgency"><span class="an-tag an-tag--${r.urgency}">${esc(repo.URGENCY[r.urgency])}</span></td>
        <td data-label="Status"><span class="badge ${STATUS_CLASS[r.status]}">${esc(repo.STATUSES[r.status])}</span></td>
        <td data-label="Upvotes">${r.upvotes}</td>
        <td data-label="Created">${esc(fmtDate(r.createdAt))}</td>
        <td data-label="Owner">${esc(r.ownerId || "guest")}</td>
      </tr>`,
      )
      .join("");
  }
  body.querySelectorAll("tr").forEach((tr) => anim(tr));
}

function entrance() {
  const trend = $("an-trend");
  const rank = $("an-rank");
  document.querySelectorAll(".an-kpi").forEach((el) => anim(el));
  document.querySelectorAll(".an-grid .an-panel").forEach((el) => anim(el));
  if (trend && trend.closest(".an-panel")) anim(trend.closest(".an-panel"));
  if (rank && rank.closest(".an-panel")) anim(rank.closest(".an-panel"));
}

function renderAll() {
  const reports = repo.getReports();
  renderKpi(reports);
  const empty = $("an-empty");
  if (empty) empty.hidden = reports.length > 0;
  renderBars("an-cat", "category", CATEGORY_ORDER, repo.CATEGORIES, reports);
  renderBars("an-status", "status", STATUS_ORDER, repo.STATUSES, reports);
  renderBars("an-urg", "urgency", URGENCY_ORDER, repo.URGENCY, reports);
  renderTrend(reports);
  renderRank(reports);
  renderTable(reports);
  entrance();
}

function init() {
  const sort = $("an-sort");
  if (sort) {
    sortMode = sort.value;
    sort.addEventListener("change", () => {
      sortMode = sort.value;
      renderTable(repo.getReports());
    });
  }
  renderAll();
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init);
else init();
repo.subscribe(renderAll);
