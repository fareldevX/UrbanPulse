import * as repo from "../../services/reportRepository.js";
import { h, fmtDate } from "../../utils/dom.js";
import {
  PATH,
  UI,
  GLYPH,
  CLS,
  catIcon,
  icoEl,
  catEl,
} from "../../utils/icons.js";
import { createReportForm } from "../reports/reportForm.js";

const CENTER = [-7.7828, 110.3671];
const SLUG = {
  jalan: "road",
  lampu: "streetlight",
  sampah: "waste",
  banjir: "flood",
};
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const icon = (r) =>
  window.L.divIcon({
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    html: `<span class="mk mk--${r.category} mk--st-${CLS[r.status]} mk--u-${r.urgency}${r.urgency === "high" && r.status !== "resolved" ? " is-hot" : ""}">${catIcon(r.category, 16)}<i class="mk-st">${GLYPH[r.status]}</i></span>`,
  });
function animIn(el) {
  if (rm()) return;
  const mobile = window.innerWidth <= 820;
  if (window.gsap)
    window.gsap.fromTo(
      el,
      mobile ? { y: 70, opacity: 0 } : { x: 44, opacity: 0 },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
        clearProps: "transform,opacity",
      },
    );
}

export function initUrbanPulseMap(
  root = document.getElementById("up-map-root"),
) {
  if (!root || root.dataset.upReady || !window.L) return null;
  root.dataset.upReady = "1";
  const L = window.L,
    view = root.dataset.mode !== "report";
  let cat = "all",
    q = "",
    openId = null;
  const sts = new Set(),
    markers = new Map();
  let form = {
    isPicking: () => false,
    cancelPick() {},
    isOpen: () => false,
    close() {},
  };

  const canvas = h("div", { class: "mp-canvas" });
  const loader = h(
    "div",
    { class: "mp-pill mp-loader", role: "status" },
    h("span", { class: "mp-spin" }),
    "Loading map",
  );
  const errPill = h(
    "div",
    { class: "mp-pill mp-pill--err", role: "alert", hidden: true },
    "Map tiles could not be loaded. Check your connection. Report data is still available.",
  );
  const toastEl = h("div", {
    class: "mp-toast",
    role: "status",
    "aria-live": "polite",
  });
  let tt;
  const toast = (m) => {
    toastEl.textContent = m;
    toastEl.classList.add("is-on");
    clearTimeout(tt);
    tt = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  };
  const ib = (label, d, on) =>
    h(
      "button",
      {
        type: "button",
        class: "mp-ib",
        "aria-label": label,
        "data-tip": label,
        onclick: on,
      },
      icoEl(d),
    );
  const ctl = h("div", {
    class: "mp-ctl",
    role: "group",
    "aria-label": "Map controls",
  });
  const legend = h(
    "details",
    { class: "mp-legend", open: true },
    h("summary", {}, "Legend"),
    h(
      "ul",
      {},
      ...Object.entries(repo.CATEGORIES).map(([k, l]) =>
        h("li", { class: `mk--${k}` }, catEl(k, 14), l),
      ),
      h(
        "li",
        { class: "mp-legend-n" },
        "Marker size shows urgency: small is low, large is high. High-urgency open reports pulse.",
      ),
      h(
        "li",
        { class: "mp-legend-n" },
        "! Pending   … In Progress   ✓ Resolved",
      ),
    ),
  );
  const detail = h("aside", {
    class: "mp-detail",
    hidden: true,
    role: "dialog",
    "aria-labelledby": "mp-d-title",
  });
  const hint = h(
    "div",
    { class: "mp-pill mp-hint" },
    "Select a marker or a report to see its details",
  );
  const resetAll = () => {
    cat = "all";
    sts.clear();
    q = "";
    if (search) search.value = "";
    sync();
  };
  const emptyPill = h(
    "div",
    { class: "mp-pill mp-pill--warn", role: "status", hidden: true },
    "No reports match these filters.",
    h("button", { type: "button", onclick: resetAll }, "Reset"),
  );
  const stage = h(
    "div",
    { class: "mp-stage" },
    canvas,
    ctl,
    legend,
    ...(view ? [hint, emptyPill, detail] : []),
    errPill,
    loader,
    toastEl,
  );

  let search = null,
    count,
    resetBtn,
    catBtns = [],
    stBtns = [],
    list;
  let sideEls = [];
  if (view) {
    search = h("input", {
      type: "search",
      class: "mp-in",
      placeholder: "Search title or ID",
      "aria-label": "Search reports",
      autocomplete: "off",
    });
    const clearQ = h(
      "button",
      {
        type: "button",
        class: "mp-clear",
        "aria-label": "Clear search",
        hidden: true,
        onclick: () => {
          search.value = "";
          q = "";
          sync();
          search.focus();
        },
      },
      icoEl(UI.x, 14),
    );
    search.addEventListener("input", () => {
      q = search.value.trim().toLowerCase();
      sync();
    });
    const kbd = h("kbd", {}, "/");
    const field = h(
      "label",
      { class: "mp-search" },
      icoEl(UI.search, 16),
      search,
      kbd,
      clearQ,
    );
    field.clearQ = clearQ;
    search.clearQ = clearQ;
    catBtns = Object.entries({ all: "All categories", ...repo.CATEGORIES }).map(
      ([k, l]) =>
        h(
          "button",
          {
            type: "button",
            class: "mp-cat",
            "aria-pressed": "false",
            "data-k": k,
            onclick: () => {
              cat = k;
              sync();
            },
          },
          h(
            "span",
            { class: `mp-cat-g mk--${k}` },
            k === "all" ? icoEl(UI.all, 15) : catEl(k, 15),
          ),
          h("span", { class: "mp-cat-l" }, l),
          h("b", { class: "mp-cat-n" }, "0"),
        ),
    );
    stBtns = Object.entries(repo.STATUSES).map(([k, l]) =>
      h(
        "button",
        {
          type: "button",
          class: "mp-st",
          "aria-pressed": "false",
          "data-k": k,
          onclick: () => {
            sts.has(k) ? sts.delete(k) : sts.add(k);
            sync();
          },
        },
        h(
          "i",
          { class: `badge-dot st-${CLS[k]}`, "aria-hidden": "true" },
          GLYPH[k],
        ),
        h("span", {}, l),
        h("b", {}, "0"),
      ),
    );
    count = h("p", { class: "mp-count", "aria-live": "polite" });
    resetBtn = h(
      "button",
      { type: "button", class: "mp-reset", onclick: resetAll },
      "Reset filters",
    );
    list = h("ol", { class: "mp-list", "aria-label": "Reports" });
    const head = h(
      "header",
      { class: "mp-head" },
      h("p", { class: "mp-kicker" }, "Report map"),
      h(
        root.dataset.heading || "h2",
        {},
        root.dataset.title || "City infrastructure",
      ),
      h(
        "p",
        { class: "mp-note" },
        "Simulated reports for a demo area in Yogyakarta, stored in this browser. Not live and not verified.",
      ),
    );
    const filters = h(
      "div",
      { class: "mp-filters" },
      field,
      h(
        "div",
        { class: "mp-cats", role: "group", "aria-label": "Category" },
        catBtns,
      ),
      h(
        "div",
        { class: "mp-sts", role: "group", "aria-label": "Status" },
        stBtns,
      ),
      h("div", { class: "mp-meta" }, count, resetBtn),
    );
    sideEls = [
      h(
        "aside",
        { class: "mp-side" },
        head,
        filters,
        h("div", { class: "mp-listwrap" }, list),
      ),
    ];
  }
  root.classList.add("mp");
  if (!view) root.classList.add("mp--report");
  root.replaceChildren(...sideEls, stage);

  const map = L.map(canvas, { minZoom: 11, zoomControl: false }).setView(
    CENTER,
    13,
  );
  map.attributionControl.setPrefix(false);
  let tilesOk = false,
    tileErr = 0;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
    .addTo(map)
    .on("load", () => {
      tilesOk = true;
      loader.hidden = true;
      errPill.hidden = true;
    })
    .on("tileerror", () => {
      if (!tilesOk && ++tileErr >= 3) {
        loader.hidden = true;
        errPill.hidden = false;
      }
    });
  setTimeout(() => {
    loader.hidden = true;
  }, 9000);
  const layer = L.layerGroup().addTo(map);
  new ResizeObserver(() => map.invalidateSize()).observe(canvas);
  ctl.append(
    ib("Zoom in", UI.plus, () => map.zoomIn()),
    ib("Zoom out", UI.minus, () => map.zoomOut()),
    ib("Fit visible reports", UI.fit, () => {
      const pts = [...markers.values()].map((m) => m.mk.getLatLng());
      if (pts.length)
        map.fitBounds(L.latLngBounds(pts), {
          padding: [60, 60],
          maxZoom: 16,
          animate: !rm(),
        });
    }),
    ib("Reset view", UI.reset, () =>
      map.setView(CENTER, 13, { animate: !rm() }),
    ),
  );
  if (!view)
    form = createReportForm({
      mount: document.getElementById(root.dataset.formMount),
      stage,
      map,
    });

  const match = (r, skip) =>
    (skip === "cat" || cat === "all" || r.category === cat) &&
    (skip === "st" || !sts.size || sts.has(r.status)) &&
    (!q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  const el = (id) => markers.get(id)?.mk.getElement();
  const hl = (id, on) => {
    el(id)?.firstChild?.classList.toggle("is-hover", on);
    list?.querySelector(`[data-id="${id}"]`)?.classList.toggle("is-hover", on);
  };
  const decorate = (mk, r) => {
    const e = mk.getElement();
    if (!e) return;
    e.setAttribute(
      "aria-label",
      `${r.title}. ${repo.CATEGORIES[r.category]}, ${repo.STATUSES[r.status]}, urgency ${repo.URGENCY[r.urgency]}`,
    );
    if (view) e.setAttribute("role", "button");
  };
  function applySel() {
    for (const [id, m] of markers) {
      el(id)?.firstChild?.classList.toggle("is-selected", id === openId);
      m.mk.setZIndexOffset(id === openId ? 1000 : 0);
    }
    list?.querySelectorAll(".mp-row").forEach((b) => {
      const on = b.dataset.id === openId;
      b.classList.toggle("is-on", on);
      on
        ? b.setAttribute("aria-current", "true")
        : b.removeAttribute("aria-current");
    });
  }
  function sync() {
    const all = repo.getReports(),
      vis = view ? all.filter((r) => match(r)) : all,
      ids = new Set(vis.map((r) => r.id));
    for (const [id, m] of markers)
      if (!ids.has(id)) {
        layer.removeLayer(m.mk);
        markers.delete(id);
      }
    for (const r of vis) {
      const sig = `${r.category}|${r.status}|${r.urgency}|${r.title}`,
        m = markers.get(r.id);
      if (!m) {
        const mk = L.marker([r.coordinates.lat, r.coordinates.lng], {
          icon: icon(r),
          keyboard: view,
          interactive: view,
          riseOnHover: true,
        });
        if (view) {
          mk.on("click", () => {
            if (!form.isPicking()) select(r.id);
          })
            .on("mouseover", () => hl(r.id, true))
            .on("mouseout", () => hl(r.id, false));
          mk.bindTooltip(h("span", {}, r.title), {
            direction: "top",
            offset: [0, -24],
            className: "mp-tip",
            opacity: 1,
          });
        }
        layer.addLayer(mk);
        markers.set(r.id, { mk, sig });
        decorate(mk, r);
      } else if (m.sig !== sig) {
        m.mk.setIcon(icon(r));
        m.sig = sig;
        decorate(m.mk, r);
      }
    }
    if (view) {
      catBtns.forEach((b) => {
        const k = b.dataset.k;
        b.setAttribute("aria-pressed", String(k === cat));
        b.querySelector(".mp-cat-n").textContent = all.filter(
          (r) => match(r, "cat") && (k === "all" || r.category === k),
        ).length;
      });
      stBtns.forEach((b) => {
        const k = b.dataset.k;
        b.setAttribute("aria-pressed", String(sts.has(k)));
        b.querySelector("b").textContent = all.filter(
          (r) => match(r, "st") && r.status === k,
        ).length;
      });
      const active = (cat !== "all") + sts.size + (q ? 1 : 0);
      resetBtn.disabled = !active;
      resetBtn.textContent = active
        ? `Reset filters (${active})`
        : "Reset filters";
      search.clearQ.hidden = !q;
      count.replaceChildren(
        h("b", {}, String(vis.length)),
        ` of ${all.length} reports`,
      );
      emptyPill.hidden = vis.length > 0;
      const sorted = [...vis]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 80);
      list.replaceChildren(
        ...(sorted.length
          ? sorted.map(row)
          : [
              h(
                "li",
                { class: "mp-list-empty" },
                h("strong", {}, "No reports match"),
                h(
                  "p",
                  {},
                  "Try a different category or status, or clear the search.",
                ),
                h(
                  "button",
                  { type: "button", class: "mp-btn", onclick: resetAll },
                  "Reset filters",
                ),
              ),
            ]),
      );
      if (openId) {
        if (repo.getReportById(openId)) renderDetail(openId);
        else closeDetail(true);
      }
    }
    applySel();
  }
  const urg = (u) =>
    h(
      "span",
      { class: `mp-urg mp-urg--${u}`, "aria-hidden": "true" },
      h("i"),
      h("i"),
      h("i"),
    );
  const row = (r) =>
    h(
      "li",
      {},
      h(
        "button",
        {
          type: "button",
          class: "mp-row",
          "data-id": r.id,
          onclick: () => select(r.id),
          onmouseenter: () => hl(r.id, true),
          onmouseleave: () => hl(r.id, false),
        },
        h(
          "span",
          { class: `mp-row-g mk--${r.category}` },
          catEl(r.category, 16),
        ),
        h(
          "span",
          { class: "mp-row-t" },
          h("span", { class: "mp-row-id" }, r.id),
          h("strong", {}, r.title),
          h(
            "span",
            { class: "mp-row-m" },
            repo.CATEGORIES[r.category],
            urg(r.urgency),
            h("span", {}, `${repo.URGENCY[r.urgency]} urgency`),
          ),
        ),
        h("span", { class: `badge ${CLS[r.status]}` }, repo.STATUSES[r.status]),
      ),
    );

  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast("Copy is not available here. Select the text instead.");
    }
  }
  function renderDetail(id) {
    const r = repo.getReportById(id),
      f = (k, ...v) =>
        h("div", { class: "mp-d-f" }, h("dt", {}, k), h("dd", {}, ...v));
    const coords = `${r.coordinates.lat.toFixed(5)}, ${r.coordinates.lng.toFixed(5)}`,
      link = `${location.origin}${location.pathname}?laporan=${encodeURIComponent(r.id)}`;
    const photo = r.image
      ? h("img", {
          class: "mp-d-photo",
          src: r.image,
          alt: `Report photo: ${r.title}`,
          onerror: (e) =>
            e.target.replaceWith(
              h("p", { class: "mp-d-nophoto" }, "Photo unavailable"),
            ),
        })
      : h("p", { class: "mp-d-nophoto" }, "No photo attached");
    detail.replaceChildren(
      h(
        "div",
        { class: "mp-d-top" },
        h("span", { class: "mp-row-id" }, r.id),
        h(
          "button",
          {
            type: "button",
            class: "mp-ib mp-d-x",
            "aria-label": "Close details",
            onclick: () => closeDetail(),
          },
          icoEl(UI.x, 16),
        ),
      ),
      h("h2", { id: "mp-d-title" }, r.title),
      h(
        "dl",
        { class: "mp-d-grid" },
        f(
          "Category",
          h(
            "span",
            { class: `mp-d-cat mk--${r.category}` },
            catEl(r.category, 15),
            repo.CATEGORIES[r.category],
          ),
        ),
        f("Urgency", urg(r.urgency), repo.URGENCY[r.urgency]),
        f(
          "Status",
          h(
            "span",
            { class: `badge ${CLS[r.status]}` },
            repo.STATUSES[r.status],
          ),
        ),
        f("Submitted", fmtDate(r.createdAt)),
      ),
      h("p", { class: "mp-d-desc" }, r.description),
      photo,
      h(
        "button",
        {
          type: "button",
          class: "mp-d-coords",
          onclick: () => copy(coords, "Coordinates copied"),
        },
        icoEl(UI.pin, 15),
        h("span", {}, coords),
        h("small", {}, "Copy"),
      ),
      h("h3", { class: "mp-d-h" }, "Status history"),
      h(
        "ol",
        { class: "mp-d-tl" },
        r.timeline.map((t) =>
          h(
            "li",
            {},
            h("strong", {}, t.label),
            h("time", {}, fmtDate(t.timestamp)),
            t.note ? h("p", {}, t.note) : null,
          ),
        ),
      ),
      h(
        "div",
        { class: "mp-d-act" },
        h(
          "button",
          {
            type: "button",
            class: "mp-btn",
            onclick: () => copy(link, "Link copied"),
          },
          icoEl(UI.link, 15),
          "Copy link",
        ),
        h(
          "a",
          { class: "mp-btn mp-btn--solid", href: "lapor.html" },
          "Report a new issue",
        ),
      ),
    );
  }
  function select(id) {
    const r = repo.getReportById(id);
    if (!r) {
      toast("That report could not be found.");
      return;
    }
    if (!match(r)) resetAll();
    const first = detail.hidden;
    openId = id;
    renderDetail(id);
    detail.hidden = false;
    hint.hidden = true;
    applySel();
    map.setView(
      [r.coordinates.lat, r.coordinates.lng],
      Math.max(map.getZoom(), 15),
      { animate: !rm() },
    );
    if (stage.clientWidth > 820) map.panBy([190, 0], { animate: false });
    if (first) animIn(detail);
    detail.querySelector(".mp-d-x").focus({ preventScroll: true });
  }
  function closeDetail(silent) {
    const id = openId;
    openId = null;
    detail.hidden = true;
    hint.hidden = false;
    applySel();
    if (!silent)
      (el(id) || list?.querySelector(`[data-id="${id}"]`))?.focus({
        preventScroll: true,
      });
  }

  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (form.isPicking()) form.cancelPick();
    else if (search && document.activeElement === search && search.value) {
      search.value = "";
      q = "";
      sync();
    } else if (openId) closeDetail();
    else if (form.isOpen()) form.close();
  });
  if (view)
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
        !document.documentElement.classList.contains("up-lock")
      ) {
        e.preventDefault();
        search.focus();
      }
    });
  repo.subscribe(sync);
  const qs = new URLSearchParams(location.search),
    k = qs.get("kategori");
  if (k && view) cat = repo.CATEGORIES[k] ? k : SLUG[k] || "all";
  sync();
  if (view && qs.get("laporan")) select(qs.get("laporan"));
  return { map, refresh: sync, openDetail: select };
}
