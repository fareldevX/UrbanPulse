import * as repo from "../../services/reportRepository.js";
import { h, fmtDate } from "../../utils/dom.js";
import { UI, icoEl, catEl } from "../../utils/icons.js";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE = 5 * 1024 * 1024, MAX_B64 = 450000;
const CAT_DESC = { road: "Potholes, cracks, collapsed pavement", streetlight: "Dark, flickering, or damaged lights", waste: "Overflowing bins, illegal dumping", flood: "Standing water, blocked drains" };
const URG = [["low", "Low", "Can wait for routine repair", 1], ["medium", "Medium", "Needs attention soon", 2], ["high", "High", "Safety risk or blocks access", 3]];
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const G = () => (window.gsap && !rm() ? window.gsap : null);

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
          const s = Math.min(1, dim / Math.max(img.width, img.height)), c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
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

export function createReportForm({ mount, stage, map }) {
  let coords = null, image = null, cat = "", urg = "", busy = false, compressing = false, picking = false, temp = null;
  const err = {}, ctl = {};
  const errP = (k) => (err[k] = h("p", { class: "rp-err", id: `rp-${k}-err`, hidden: true }));
  const step = (n, key, title, help, ...body) => h("section", { class: "rp-step", "data-step": key },
    h("h2", { class: "rp-step-h" }, h("span", { class: "n" }, n), title), help ? h("p", { class: "rp-help" }, help) : null, ...body);
  const pulse = (e) => { const g = G(); if (g && e) g.fromTo(e, { scale: 0.4 }, { scale: 1, duration: 0.45, ease: "back.out(3)", clearProps: "transform" }); };

  const readout = h("output", { class: "rp-coords", "aria-live": "polite" }, "No location selected");
  const pickBtn = h("button", { type: "button", class: "rp-btn rp-btn--solid", onclick: () => startPick() }, icoEl(UI.pin, 16), "Pick on map");
  const clearBtn = h("button", { type: "button", class: "rp-btn", hidden: true, onclick: () => clearLoc() }, "Remove");
  ctl.loc = pickBtn; pickBtn.setAttribute("aria-describedby", "rp-loc-err");
  const s1 = step("01", "loc", "Location", "Required. A report cannot be saved without coordinates. After you press the button, click the map to drop a pin, then drag it to fine-tune.",
    h("div", { class: "rp-loc" }, readout, h("div", { class: "rp-loc-a" }, pickBtn, clearBtn)), errP("loc"));

  const radio = (name, value, onchange) => { const i = h("input", { type: "radio", name, value, class: "rp-vh" }); i.addEventListener("change", () => onchange(i)); return i; };
  const catTiles = Object.entries(repo.CATEGORIES).map(([k, l]) => {
    const i = radio("category", k, () => { cat = k; err.cat.hidden = true; meter(); pulse(i.parentNode.querySelector(".rp-ck")); });
    if (!ctl.cat) ctl.cat = i;
    return h("label", { class: `rp-tile mk--${k}` }, i, h("span", { class: "rp-tile-g" }, catEl(k, 20)), h("span", { class: "rp-tile-t" }, h("strong", {}, l), h("small", {}, CAT_DESC[k])), h("span", { class: "rp-ck", "aria-hidden": "true" }, icoEl(UI.check, 12)));
  });
  const urgOpts = URG.map(([k, l, d, n]) => {
    const i = radio("urgency", k, () => { urg = k; err.urg.hidden = true; meter(); });
    if (!ctl.urg) ctl.urg = i;
    return h("label", { class: `rp-seg-o rp-seg-o--${k}` }, i, h("span", { class: "rp-bars", "aria-hidden": "true" }, ...[1, 2, 3].map((x) => h("i", { class: x <= n ? "on" : "" }))), h("strong", {}, l), h("small", {}, d));
  });
  const s2 = step("02", "type", "Type and urgency", null,
    h("div", { class: "rp-tiles", role: "radiogroup", "aria-label": "Category", "aria-describedby": "rp-cat-err" }, catTiles), errP("cat"),
    h("p", { class: "rp-lbl" }, "How urgent is it?"),
    h("div", { class: "rp-seg", role: "radiogroup", "aria-label": "Urgency", "aria-describedby": "rp-urg-err" }, urgOpts), errP("urg"));

  const title = h("input", { class: "rp-in", type: "text", id: "rp-title", maxlength: "80", autocomplete: "off", placeholder: "e.g. Pothole at the Jl. Kaliurang bus shelter", "aria-describedby": "rp-title-err" });
  const desc = h("textarea", { class: "rp-in rp-ta", id: "rp-desc", rows: "5", maxlength: "500", placeholder: "What is wrong, how big is it, and what makes it risky? A crew should know what to bring.", "aria-describedby": "rp-desc-err rp-desc-n" });
  const descN = h("output", { class: "rp-n", id: "rp-desc-n" }, "0 / 500");
  ctl.title = title; ctl.desc = desc;
  const s3 = step("03", "det", "Details", null,
    h("div", { class: "rp-field" }, h("label", { class: "rp-lbl", for: "rp-title" }, "Report title"), title, errP("title")),
    h("div", { class: "rp-field" }, h("div", { class: "rp-lblrow" }, h("label", { class: "rp-lbl", for: "rp-desc" }, "Description"), descN), desc, errP("desc")));
  title.addEventListener("input", () => { err.title.hidden = true; meter(); });
  desc.addEventListener("input", () => { err.desc.hidden = true; descN.textContent = `${desc.value.length} / 500`; descN.classList.toggle("is-ok", desc.value.trim().length >= 20); meter(); });

  const file = h("input", { type: "file", accept: TYPES.join(","), class: "rp-vh", id: "rp-file", "aria-describedby": "rp-img-err" });
  const drop = h("label", { class: "rp-drop", for: "rp-file" }, icoEl(UI.upload, 22), h("span", { class: "rp-drop-t" }, h("strong", {}, "Drop a photo here, or browse"), h("small", {}, "JPG, PNG, or WebP up to 5 MB. Resized and compressed in your browser before it is stored.")));
  const prevImg = h("img", { alt: "Selected photo preview" }), prevMeta = h("div", { class: "rp-prev-m" });
  const prev = h("div", { class: "rp-prev", hidden: true }, prevImg, prevMeta, h("button", { type: "button", class: "rp-btn", onclick: () => { clearImg(); drop.focus?.(); file.focus(); } }, "Remove photo"));
  const busyEl = h("p", { class: "rp-busy", hidden: true, role: "status" }, h("span", { class: "mp-spin" }), "Compressing photo");
  const s4 = step("04", "img", "Photo", "Optional, but a photo helps a crew find and size the problem.", drop, prev, busyEl, file, errP("img"));
  for (const t of ["dragenter", "dragover"]) drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-over"); });
  for (const t of ["dragleave", "drop"]) drop.addEventListener(t, () => drop.classList.remove("is-over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleFile(f); });
  file.addEventListener("change", () => { if (file.files[0]) handleFile(file.files[0]); });
  function clearImg() { image = null; file.value = ""; prev.hidden = true; drop.hidden = false; prevImg.removeAttribute("src"); meter(); }
  async function handleFile(f) {
    err.img.hidden = true; compressing = true; busyEl.hidden = false; refreshSubmit();
    try {
      const d = await compress(f), to = Math.round(d.length * 0.75);
      image = d; prevImg.src = d; prevMeta.replaceChildren(h("strong", {}, f.name), h("span", {}, `${kb(f.size)} to ${kb(to)} after compression`));
      drop.hidden = true; prev.hidden = false;
      const g = G(); if (g) g.fromTo(prev, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" });
    } catch (x) { clearImg(); err.img.textContent = x.message; err.img.hidden = false; }
    finally { compressing = false; busyEl.hidden = true; refreshSubmit(); meter(); }
  }

  const summary = h("p", { class: "rp-sum", role: "alert" });
  const spin = h("span", { class: "mp-spin", hidden: true }), subL = h("span", {}, "Submit report");
  const submit = h("button", { type: "submit", class: "rp-submit" }, subL, spin);
  function refreshSubmit() { submit.disabled = busy || compressing; submit.setAttribute("aria-busy", String(busy)); spin.hidden = !busy; subL.textContent = busy ? "Saving" : compressing ? "Waiting for photo" : "Submit report"; }
  const form = h("form", { class: "rp-form", novalidate: true }, s1, s2, s3, s4, h("div", { class: "rp-foot" }, summary, submit));
  const done = h("div", { class: "rp-done", hidden: true, "aria-live": "polite" });
  mount.append(form, done);
  const pickBar = h("div", { class: "rp-pickbar", hidden: true, role: "status" }, h("span", {}, "Click the map to place the pin"), h("button", { type: "button", onclick: () => { cancelPick(); pickBtn.focus(); } }, "Cancel"));
  stage.append(pickBar);

  function setCoords(lat, lng) {
    coords = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    readout.textContent = `${coords.lat}, ${coords.lng}`; readout.classList.add("is-set");
    if (temp) temp.setLatLng([lat, lng]);
    else {
      temp = window.L.marker([lat, lng], { draggable: true, keyboard: false, title: "Selected location (drag to move)", icon: window.L.divIcon({ className: "", iconSize: [26, 34], iconAnchor: [13, 34], html: "<span class=\"rp-pin\"></span>" }) }).addTo(map);
      temp.on("dragend", () => { const p = temp.getLatLng(); setCoords(p.lat, p.lng); });
    }
    clearBtn.hidden = false; pickBtn.lastChild.textContent = "Change location"; err.loc.hidden = true; meter();
  }
  function clearLoc() { coords = null; if (temp) { map.removeLayer(temp); temp = null; } readout.textContent = "No location selected"; readout.classList.remove("is-set"); clearBtn.hidden = true; pickBtn.lastChild.textContent = "Pick on map"; meter(); }
  function startPick() { picking = true; mount.classList.add("is-picking"); pickBar.hidden = false; map.getContainer().classList.add("mp--picking"); stage.scrollIntoView({ block: "nearest", behavior: rm() ? "auto" : "smooth" }); }
  function cancelPick() { picking = false; mount.classList.remove("is-picking"); pickBar.hidden = true; map.getContainer().classList.remove("mp--picking"); }
  map.on("click", (ev) => { if (!picking) return; setCoords(ev.latlng.lat, ev.latlng.lng); cancelPick(); pickBtn.focus(); pulse(readout); });

  function meter() {
    const ok = { loc: !!coords, cat: !!(cat && urg), det: title.value.trim().length >= 5 && desc.value.trim().length >= 20, img: !!image };
    document.querySelectorAll("#rpMeter li").forEach((li) => li.classList.toggle("is-done", !!ok[li.dataset.k]));
    const c = document.getElementById("rpCount"); if (c) c.textContent = `${["loc", "cat", "det"].filter((k) => ok[k]).length} of 3 required steps complete`;
  }
  function validate() {
    const e = {}; 
    if (title.value.trim().length < 5) e.title = "Title must be at least 5 characters.";
    if (!repo.CATEGORIES[cat]) e.cat = "Select a report category.";
    if (!repo.URGENCY[urg]) e.urg = "Select an urgency level.";
    if (desc.value.trim().length < 20) e.desc = "Description must be at least 20 characters.";
    if (!coords) e.loc = "Select a location by clicking the map.";
    return e;
  }
  const show = (e) => { for (const k of Object.keys(err)) { err[k].hidden = !e[k]; err[k].textContent = e[k] || ""; ctl[k]?.setAttribute("aria-invalid", String(!!e[k])); } };
  function resetAll() { form.reset(); cat = ""; urg = ""; descN.textContent = "0 / 500"; descN.classList.remove("is-ok"); clearLoc(); clearImg(); show({}); summary.textContent = ""; meter(); }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (busy || compressing) return;
    const e = validate(); show(e);
    const bad = Object.keys(e);
    if (bad.length) {
      summary.textContent = `Please fix ${bad.length} field${bad.length > 1 ? "s" : ""} before submitting.`;
      ctl[bad[0]].focus(); const g = G(); if (g) g.fromTo(ctl[bad[0]].closest(".rp-step"), { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)", clearProps: "transform" });
      return;
    }
    busy = true; refreshSubmit(); summary.textContent = "";
    try {
      const r = repo.createReport({ title: title.value, category: cat, urgency: urg, description: desc.value, coordinates: coords, image });
      resetAll(); showDone(r);
    } catch (x) { summary.textContent = x.message; }
    finally { busy = false; refreshSubmit(); }
  });

  function showDone(r) {
    const f = (k, v) => h("div", {}, h("dt", {}, k), h("dd", {}, v));
    const head = h("h2", { tabindex: "-1" }, "Report saved");
    done.replaceChildren(h("span", { class: "rp-done-ck", "aria-hidden": "true" }, icoEl(UI.check, 28)), head,
      h("p", { class: "rp-done-id" }, r.id),
      h("p", { class: "rp-help" }, "Stored in this browser's report store. It is already on the map, and its status history starts at Pending."),
      h("dl", { class: "rp-done-dl" }, f("Title", r.title), f("Category", repo.CATEGORIES[r.category]), f("Urgency", repo.URGENCY[r.urgency]), f("Location", `${r.coordinates.lat.toFixed(5)}, ${r.coordinates.lng.toFixed(5)}`), f("Saved", fmtDate(r.createdAt))),
      h("div", { class: "rp-done-a" }, h("a", { class: "rp-btn rp-btn--solid", href: `peta.html?laporan=${encodeURIComponent(r.id)}` }, "View on map"),
        h("button", { type: "button", class: "rp-btn", onclick: () => { done.hidden = true; form.hidden = false; document.getElementById("rp-intro")?.removeAttribute("hidden"); title.focus(); } }, "File another report")));
    form.hidden = true; done.hidden = false;
    document.getElementById("rp-intro")?.setAttribute("hidden", "");
    const g = G();
    if (g) { const tl = g.timeline({ defaults: { ease: "power3.out" } }); tl.from(".rp-done-ck", { scale: 0, rotate: -90, duration: 0.6, ease: "back.out(2)" }).from(".rp-done h2", { clipPath: "inset(0 100% 0 0)", x: -30, duration: 0.6, clearProps: "clipPath,transform" }, "-=0.3").from(".rp-done-id", { letterSpacing: "0.4em", opacity: 0, duration: 0.7 }, "-=0.3").from(".rp-done-dl > div, .rp-done-a > *", { x: 30, opacity: 0, stagger: 0.06, duration: 0.45 }, "-=0.3"); }
    head.focus({ preventScroll: true }); done.scrollIntoView({ block: "start", behavior: rm() ? "auto" : "smooth" });
  }
  meter();
  return { isPicking: () => picking, cancelPick, isOpen: () => false, close() {}, open() { pickBtn.focus(); } };
}
