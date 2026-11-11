// UrbanPulse dashboard. Four states, driven by the session in services/authStore.js:
// guest, resident, active admin, and a locked page for admins still waiting for approval.
// Every admin action re-checks isActiveAdmin() before it runs, so the guard is in the logic,
// not only in which buttons happen to be on screen.
import * as auth from "./services/authStore.js";
import * as repo from "./services/reportRepository.js";
import { anim, h } from "./utils/dom.js";

const root = document.getElementById("dash-root");
const STATUS_CLASS = { pending: "pending", "in-progress": "progress", resolved: "resolved" };

let notice = null; // { kind: "ok" | "error", text }

const setNotice = (kind, text) => { notice = text ? { kind, text } : null; };

const kpi = (label, value) =>
  h("div", { class: "dash-kpi" }, h("span", { class: "dash-kpi-num" }, String(value)), h("span", { class: "dash-kpi-label" }, label));

const statusBadge = (status) => h("span", { class: `badge ${STATUS_CLASS[status] || ""}` }, repo.STATUSES[status] || status);

function noticeEl() {
  if (!notice) return null;
  return h("div", {
    class: `dash-notice dash-notice--${notice.kind}`,
    role: notice.kind === "error" ? "alert" : "status",
    tabindex: "-1",
  }, notice.text);
}

function guestView() {
  return h("section", { class: "dash-panel" },
    h("header", { class: "dash-head" }, h("div", {}, h("h1", {}, "Dashboard"))),
    h("div", { class: "dash-empty" },
      h("h2", {}, "Sign in required"),
      h("p", {}, "Sign in or create an account to use the dashboard. Residents get a personal list of their reports; officers get admin tools."),
      h("p", { class: "dash-muted" }, "This is a front-end demo with no server: accounts and sessions stay in this browser only."),
      h("div", { class: "dash-actions" },
        h("a", { class: "btn btn-primary", href: "masuk.html" }, "Sign in"),
        h("a", { class: "btn btn-outline", href: "daftar.html" }, "Create an account"))));
}

function residentView(s) {
  const mine = repo.getReports().filter((r) => r.ownerId === s.userId);
  const resolved = mine.filter((r) => r.status === "resolved").length;
  const pending = mine.filter((r) => r.status === "pending").length;

  const list = mine.length
    ? h("ul", { class: "dash-list" }, ...mine.map(reportRow))
    : h("div", { class: "dash-empty" },
        h("p", {}, "You have not filed a report yet. Once you file one, it shows up here with its current status."),
        h("a", { class: "btn btn-primary", href: "lapor.html" }, "Report an issue"));

  return h("section", { class: "dash-panel" },
    h("header", { class: "dash-head" }, h("div", {},
      h("p", { class: "dash-eyebrow" }, "Resident"),
      h("h1", {}, "Your dashboard"),
      h("p", {}, `Signed in as ${s.name} (${s.username}).`))),
    h("div", { class: "dash-kpis" },
      kpi("My reports", mine.length),
      kpi("Resolved", resolved),
      kpi("Pending", pending)),
    h("div", { class: "dash-section" },
      h("div", { class: "dash-section-head" },
        h("h2", {}, "My reports"),
        h("a", { class: "dash-link", href: "analitik.html" }, "View analytics")),
      list,
      mine.length
        ? h("div", { class: "dash-actions" }, h("a", { class: "btn btn-primary", href: "lapor.html" }, "Report an issue"))
        : null));
}

function reportRow(r) {
  return h("li", { class: "dash-report" },
    h("div", {},
      h("a", { class: "dash-report-title", href: `peta.html?laporan=${encodeURIComponent(r.id)}` }, r.title),
      h("p", { class: "dash-report-meta" }, `${repo.CATEGORIES[r.category] || r.category} - ${r.id}`)),
    h("div", { class: "dash-report-side" },
      statusBadge(r.status),
      h("span", { class: `dash-urg dash-urg--${r.urgency}` }, `${repo.URGENCY[r.urgency] || r.urgency} priority`),
      h("span", { class: "dash-up" }, `${r.upvotes} upvotes`)));
}

function lockedView(s) {
  return h("section", { class: "dash-panel" },
    h("header", { class: "dash-head" }, h("div", {},
      h("p", { class: "dash-eyebrow" }, "Officer"),
      h("h1", {}, "Dashboard"))),
    h("div", { class: "dash-locked" },
      h("span", { class: "badge pending" }, auth.STATUS_LABEL[s.status] || "Waiting for approval"),
      h("h2", {}, "Waiting for approval"),
      h("p", {}, `Your officer account (${s.username}) is waiting for review. An active admin has to approve it before any admin tools unlock.`),
      h("p", { class: "dash-muted" }, "You can sign out and try again later."),
      h("div", { class: "dash-actions" },
        h("button", { class: "btn btn-primary", type: "button", onclick: signOut }, "Sign out"),
        h("a", { class: "btn btn-outline", href: "analitik.html" }, "View analytics"))));
}

function approvalRow(u) {
  return h("li", { class: "dash-approval" },
    h("div", {},
      h("p", { class: "dash-approval-name" }, u.name),
      h("p", { class: "dash-approval-meta" }, `${u.username} - requested ${auth.accountAge(u.createdAt)}`)),
    h("div", { class: "dash-approval-act" },
      h("button", { class: "btn btn-primary", type: "button", onclick: () => decide("approve", u) }, "Approve"),
      h("button", { class: "btn btn-outline", type: "button", onclick: () => decide("reject", u) }, "Reject")));
}

function usersTableEl(users) {
  return h("div", { class: "dash-tablewrap" },
    h("table", { class: "dash-table" },
      h("caption", { class: "sr-only" }, "All accounts"),
      h("thead", {}, h("tr", {},
        h("th", { scope: "col" }, "Name"),
        h("th", { scope: "col" }, "Username"),
        h("th", { scope: "col" }, "Role"),
        h("th", { scope: "col" }, "Status"),
        h("th", { scope: "col" }, "Account age"))),
      h("tbody", {}, ...users.map((u) => h("tr", {},
        h("td", { "data-label": "Name" }, u.name),
        h("td", { "data-label": "Username" }, u.username),
        h("td", { "data-label": "Role" }, auth.ROLES[u.role] || u.role),
        h("td", { "data-label": "Status" }, auth.STATUS_LABEL[u.status] || u.status),
        h("td", { "data-label": "Account age" }, auth.accountAge(u.createdAt)))))));
}

function statusSelect(r) {
  const sel = h("select", {
    class: "select dash-status-select",
    "aria-label": `Status for report ${r.id}`,
    onchange: (e) => changeStatus(r, e.target.value),
  }, ...Object.entries(repo.STATUSES).map(([k, l]) => h("option", { value: k }, l)));
  sel.value = r.status;
  return sel;
}

function reportsTableEl(reports) {
  return h("div", { class: "dash-tablewrap" },
    h("table", { class: "dash-table dash-table--reports" },
      h("caption", { class: "sr-only" }, "All reports"),
      h("thead", {}, h("tr", {},
        h("th", { scope: "col" }, "Report"),
        h("th", { scope: "col" }, "Category"),
        h("th", { scope: "col" }, "Status"),
        h("th", { scope: "col" }, "Urgency"),
        h("th", { scope: "col" }, "Upvotes"),
        h("th", { scope: "col" }, "Actions"))),
      h("tbody", {}, ...reports.map((r) => h("tr", {},
        h("td", { "data-label": "Report" },
          h("a", { class: "dash-report-title", href: `peta.html?laporan=${encodeURIComponent(r.id)}` }, r.title),
          h("span", { class: "dash-report-id" }, r.id)),
        h("td", { "data-label": "Category" }, repo.CATEGORIES[r.category] || r.category),
        h("td", { "data-label": "Status" }, statusSelect(r)),
        h("td", { "data-label": "Urgency" }, repo.URGENCY[r.urgency] || r.urgency),
        h("td", { "data-label": "Upvotes" }, String(r.upvotes)),
        h("td", { "data-label": "Actions" },
          h("button", { class: "btn btn-outline dash-del", type: "button", onclick: () => removeReport(r) }, "Delete")))))));
}

async function adminView(s) {
  const reports = repo.getReports();
  const users = await auth.listUsers();
  const pending = await auth.pendingAdmins();

  return h("section", { class: "dash-panel" },
    h("header", { class: "dash-head" }, h("div", {},
      h("p", { class: "dash-eyebrow" }, "Officer (admin)"),
      h("h1", {}, "Admin dashboard"),
      h("p", {}, `Signed in as ${s.name} (${s.username}).`))),

    h("div", { class: "dash-kpis" },
      kpi("Total reports", reports.length),
      kpi("Pending", reports.filter((r) => r.status === "pending").length),
      kpi("In progress", reports.filter((r) => r.status === "in-progress").length),
      kpi("Resolved", reports.filter((r) => r.status === "resolved").length),
      kpi("Admin requests", pending.length)),

    h("div", { class: "dash-section" },
      h("div", { class: "dash-section-head" },
        h("h2", {}, "Admin approvals"),
        h("span", { class: "dash-count" }, `${pending.length} waiting`)),
      pending.length
        ? h("ul", { class: "dash-approvals" }, ...pending.map(approvalRow))
        : h("p", { class: "dash-muted" }, "No officer accounts are waiting for approval.")),

    h("div", { class: "dash-section" },
      h("div", { class: "dash-section-head" },
        h("h2", {}, "Users"),
        h("span", { class: "dash-count" }, `${users.length} accounts`)),
      usersTableEl(users)),

    h("div", { class: "dash-section" },
      h("div", { class: "dash-section-head" },
        h("h2", {}, "Report management"),
        h("span", { class: "dash-count" }, `${reports.length} reports`)),
      reports.length
        ? reportsTableEl(reports)
        : h("p", { class: "dash-muted" }, "There are no reports to manage.")));
}

function focusNotice() {
  const n = root.querySelector(".dash-notice");
  if (n) n.focus();
}

function signOut() {
  auth.logout();
  location.href = "index.html";
}

// Shared guard: bail out with a message when the caller is not an active admin.
async function denied(message) {
  setNotice("error", message);
  await render();
  focusNotice();
}

async function decide(kind, u) {
  if (!auth.isActiveAdmin()) return denied("Only an active admin can review officer accounts.");
  let res;
  try {
    res = kind === "approve" ? await auth.approveAdmin(u.id) : await auth.rejectAdmin(u.id);
  } catch {
    res = { ok: false, error: "That action failed. Please try again." };
  }
  const verb = kind === "approve" ? "Approved" : "Rejected";
  setNotice(res.ok ? "ok" : "error",
    res.ok ? `${verb} the officer account for ${u.username}.` : res.error || "That action failed.");
  await render();
  focusNotice();
}

async function changeStatus(r, status) {
  if (!auth.isActiveAdmin()) return denied("Only an active admin can change a report status.");
  let ok = true, msg;
  try {
    const updated = repo.updateReportStatus(r.id, status);
    if (updated) msg = `${r.id} is now ${repo.STATUSES[status]}.`;
    else { ok = false; msg = "That report no longer exists."; }
  } catch (err) {
    ok = false;
    msg = err && err.message ? err.message : "Could not update the status.";
  }
  setNotice(ok ? "ok" : "error", msg);
  await render();
  focusNotice();
}

async function removeReport(r) {
  if (!auth.isActiveAdmin()) return denied("Only an active admin can delete reports.");
  if (!window.confirm(`Delete report ${r.id}? This cannot be undone.`)) return;
  let ok = true, msg;
  try {
    ok = repo.deleteReport(r.id);
    msg = ok ? `Deleted ${r.id}.` : "That report no longer exists.";
  } catch (err) {
    ok = false;
    msg = err && err.message ? err.message : "Could not delete the report.";
  }
  setNotice(ok ? "ok" : "error", msg);
  await render();
  focusNotice();
}

async function render() {
  const s = auth.getSession();
  let view;
  if (!s) view = guestView();
  else if (s.role === "admin" && s.status === "active") view = await adminView(s);
  else if (s.role === "admin") view = lockedView(s);
  else view = residentView(s);

  const kids = [];
  const n = noticeEl();
  if (n) kids.push(n);
  kids.push(view);
  root.replaceChildren(...kids);
  entrance();
}

// Animasi masuk untuk panel, kartu KPI, dan baris data. Gaya sama seperti halaman lain:
// GSAP bila termuat (durasi .28s, stagger kecil, clearProps), kalau tidak pakai anim().
function entrance() {
  const items = [...root.querySelectorAll(".dash-panel, .dash-section, .dash-kpi, .dash-report, .dash-approval, .dash-notice, .dash-empty")];
  if (!items.length) return;
  if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.gsap.from(items, { y: 24, opacity: 0, duration: 0.28, ease: "power2.out", stagger: 0.05, clearProps: "all" });
    return;
  }
  items.forEach(anim);
}

(async function start() {
  await auth.ready();
  await render();
  // Repaint on any account or report change, including changes from another tab.
  auth.subscribe(() => { render(); });
  repo.subscribe(() => { render(); });
})();
