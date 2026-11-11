import * as repo from "../../services/reportRepository.js";
import { h, anim } from "../../utils/dom.js";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE = 5 * 1024 * 1024, MAX_B64 = 450000;

// Native FileReader + Canvas: resize to <=1200px, JPEG, retry smaller if payload too big.
function compress(file) {
  return new Promise((ok, no) => {
    if (!TYPES.includes(file.type)) return no(new Error("Photo must be a JPG, PNG, or WebP file."));
    if (file.size > MAX_FILE) return no(new Error("Photo must be 5 MB or smaller."));
    const fr = new FileReader();
    fr.onerror = () => no(new Error("The photo could not be read."));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => no(new Error("That file is not a valid image."));
      img.onload = () => {
        for (const [dim, q] of [[1200, 0.75], [900, 0.65], [640, 0.55]]) {
          const s = Math.min(1, dim / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const x = c.getContext("2d");
          x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          const d = c.toDataURL("image/jpeg", q);
          if (d.length <= MAX_B64) return ok(d);
        }
        no(new Error("The photo is still too large after compression. Choose another one."));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/** Animate the form panel opening with GSAP if available, else fallback. */
function animatePanelIn(el) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const g = window.gsap;
  if (g) {
    const isMobile = window.innerWidth <= 720;
    g.fromTo(
      el,
      isMobile
        ? { y: 80, opacity: 0, scale: 0.96 }
        : { x: 56, opacity: 0, scale: 0.98 },
      isMobile
        ? { y: 0, opacity: 1, scale: 1,  duration: 0.48, ease: "back.out(1.4)", clearProps: "transform,opacity" }
        : { x: 0, opacity: 1, scale: 1,  duration: 0.42, ease: "power3.out",   clearProps: "transform,opacity" }
    );
  } else {
    anim(el);
  }
}

/** Animate success state with GSAP scale pop if available. */
function animateSuccess(el) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const g = window.gsap;
  if (g) {
    g.fromTo(el,
      { scale: 0.88, opacity: 0 },
      { scale: 1,    opacity: 1, duration: 0.5, ease: "back.out(2)", clearProps: "transform,opacity" }
    );
  } else {
    anim(el);
  }
}

export function createReportForm({ stage, map, onView }) {
  let coords = null, image = null, busy = false, picking = false, temp = null, opener = null;
  const err = {}, ctl = {};
  const field = (key, label, control) => {
    const e = h("p", { class: "up-report-err", id: `up-r-${key}-err`, hidden: true });
    control.id = `up-r-${key}`; control.setAttribute("aria-describedby", e.id);
    err[key] = e; ctl[key] = control;
    return h("div", { class: "up-report-field" }, h("label", { class: "label", for: control.id }, label), control, e);
  };
  const opts = (m, ph) => [h("option", { value: "" }, ph), ...Object.entries(m).map(([v, l]) => h("option", { value: v }, l))];

  const title = h("input", { class: "input", type: "text", required: true, minlength: "5", maxlength: "80", autocomplete: "off" });
  const cat = h("select", { class: "select", required: true }, opts(repo.CATEGORIES, "Select a category"));
  const urg = h("select", { class: "select", required: true }, opts(repo.URGENCY, "Select urgency"));
  const desc = h("textarea", { class: "textarea", required: true, minlength: "20", maxlength: "500", rows: "4" });

  // ── Character counter for description ──────────────────────────
  const MAX_DESC = 500;
  const charCounter = h("div", { class: "up-report-char-counter" }, `0 / ${MAX_DESC}`);

  const updateCounter = () => {
    const len = desc.value.length;
    charCounter.textContent = `${len} / ${MAX_DESC}`;
    charCounter.classList.toggle("warn",  len >= MAX_DESC * 0.75 && len < MAX_DESC);
    charCounter.classList.toggle("limit", len >= MAX_DESC);
  };
  desc.addEventListener("input", updateCounter);

  // ──────────────────────────────────────────────────────────────
  const readout = h("output", { class: "up-report-coords" }, "Not selected");
  const locBtn = h("button", { type: "button", class: "btn btn-outline", onclick: () => startPick() }, "Select on map");
  const clearBtn = h("button", { type: "button", class: "btn btn-outline", hidden: true, onclick: () => clearLoc() }, "Remove");
  const locWrap = h("div", { class: "up-report-loc" }, readout, h("div", {}, locBtn, clearBtn));
  ctl.loc = locBtn; err.loc = h("p", { class: "up-report-err", id: "up-r-loc-err", hidden: true });
  locBtn.setAttribute("aria-describedby", "up-r-loc-err");
  const file = h("input", { class: "input", type: "file", accept: TYPES.join(",") });
  const preview = h("img", { alt: "Report photo preview" });
  const rm = h("button", { type: "button", class: "btn btn-outline", onclick: () => clearImg() }, "Remove photo");
  const prevWrap = h("div", { class: "up-report-prev", hidden: true }, preview, rm);
  const summary = h("p", { class: "up-report-err", role: "alert" });
  const submit = h("button", { type: "submit", class: "btn btn-primary" }, "Submit report");
  const close = h("button", { type: "button", class: "up-detail-x", "aria-label": "Close form", onclick: () => api.close() }, "×");

  // Build the desc field wrapper with counter
  const descFieldWrapper = h("div", { class: "up-report-field" });
  const descLabelEl = h("label", { class: "label", for: "up-r-desc" }, "Description (at least 20 characters)");
  err.desc = h("p", { class: "up-report-err", id: "up-r-desc-err", hidden: true });
  desc.id = "up-r-desc";
  desc.setAttribute("aria-describedby", "up-r-desc-err");
  ctl.desc = desc;
  descFieldWrapper.append(descLabelEl, desc, charCounter, err.desc);

  const form = h("form", { class: "up-report-form", novalidate: true },
    field("title", "Report title", title), field("cat", "Category", cat), field("urg", "Urgency", urg),
    descFieldWrapper,
    h("div", { class: "up-report-field" }, h("span", { class: "up-report-lbl" }, "Location"), locWrap, err.loc),
    field("img", "Photo (optional, JPG/PNG/WebP, max 5 MB)", file), prevWrap, summary, submit);
  const done = h("div", { class: "up-report-done", hidden: true });
  const panel = h("section", { class: "up-report", hidden: true, role: "dialog", "aria-labelledby": "up-report-h" },
    h("div", { class: "up-detail-top" }, h("h3", { id: "up-report-h" }, "New report"), close), form, done);
  const bar = h("div", { class: "up-pick-bar", hidden: true, role: "status" }, h("span", {}, "Click the map to mark the location"),
    h("button", { type: "button", onclick: () => { cancelPick(); locBtn.focus(); } }, "Cancel"));
  stage.append(panel, bar);

  const validate = () => {
    const e = {}, d = desc.value.trim();
    if (title.value.trim().length < 5) e.title = "Title must be at least 5 characters.";
    if (!repo.CATEGORIES[cat.value]) e.cat = "Select a report category.";
    if (!repo.URGENCY[urg.value]) e.urg = "Select an urgency level.";
    if (d.length < 20) e.desc = "Description must be at least 20 characters.";
    if (!coords) e.loc = "Select a location by clicking the map.";
    return e;
  };
  const show = (e) => { for (const k of Object.keys(err)) { err[k].hidden = !e[k]; err[k].textContent = e[k] || ""; ctl[k].setAttribute("aria-invalid", String(!!e[k])); } };
  form.addEventListener("input", (ev) => { const k = Object.keys(ctl).find((x) => ctl[x] === ev.target); if (k) { err[k].hidden = true; ctl[k].removeAttribute("aria-invalid"); } });

  function setCoords(lat, lng) {
    coords = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    readout.textContent = `${coords.lat}, ${coords.lng}`;
    if (temp) temp.setLatLng([lat, lng]);
    else {
      temp = window.L.marker([lat, lng], { draggable: true, title: "Selected location (drag to move)", keyboard: false,
        icon: window.L.divIcon({ className: "", iconSize: [22, 22], iconAnchor: [11, 22], html: "<span class=\"up-pin\"></span>" }) }).addTo(map);
      temp.on("dragend", () => { const p = temp.getLatLng(); setCoords(p.lat, p.lng); });
    }
    clearBtn.hidden = false; locBtn.textContent = "Change location"; err.loc.hidden = true;
  }
  function clearLoc() { coords = null; if (temp) { map.removeLayer(temp); temp = null; } readout.textContent = "Not selected"; clearBtn.hidden = true; locBtn.textContent = "Select on map"; }
  function startPick() { picking = true; panel.classList.add("is-picking"); bar.hidden = false; anim(bar); map.getContainer().classList.add("up-map--picking"); }
  function cancelPick() { picking = false; panel.classList.remove("is-picking"); bar.hidden = true; map.getContainer().classList.remove("up-map--picking"); }
  map.on("click", (ev) => { if (!picking) return; setCoords(ev.latlng.lat, ev.latlng.lng); cancelPick(); locBtn.focus(); });

  function clearImg() { image = null; file.value = ""; prevWrap.hidden = true; preview.removeAttribute("src"); }
  file.addEventListener("change", async () => {
    const f = file.files[0]; err.img.hidden = true;
    if (!f) return clearImg();
    try { image = await compress(f); preview.src = image; prevWrap.hidden = false; anim(prevWrap); }
    catch (x) { clearImg(); err.img.textContent = x.message; err.img.hidden = false; }
  });

  function reset() { form.reset(); clearLoc(); clearImg(); show({}); summary.textContent = ""; updateCounter(); }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (busy) return;
    const e = validate(); show(e);
    const bad = Object.keys(e);
    if (bad.length) { summary.textContent = `Please fix ${bad.length} field${bad.length > 1 ? "s" : ""} before submitting.`; ctl[bad[0]].focus(); anim(summary); return; }
    busy = true; submit.disabled = true; summary.textContent = "";
    try {
      const r = repo.createReport({ title: title.value, category: cat.value, urgency: urg.value, description: desc.value, coordinates: coords, image });
      reset();
      done.replaceChildren(h("h3", {}, "Report submitted ✓"), h("p", {}, "Your report ID:"), h("p", { class: "up-report-id" }, r.id),
        h("button", { type: "button", class: "btn btn-primary", onclick: () => { api.close(); onView(r.id); } }, "View on map"),
        h("button", { type: "button", class: "btn btn-outline", onclick: () => api.open(opener) }, "Report another issue"));
      form.hidden = true; done.hidden = false;
      animateSuccess(done);
    } catch (x) { summary.textContent = x.message; }
    finally { busy = false; submit.disabled = false; }
  });

  const api = {
    isPicking: () => picking, cancelPick, isOpen: () => !panel.hidden,
    open(from) { opener = from || opener; panel.hidden = false; form.hidden = false; done.hidden = true; animatePanelIn(panel); title.focus(); },
    close() { cancelPick(); panel.hidden = true; opener?.focus(); },
  };
  return api;
}
