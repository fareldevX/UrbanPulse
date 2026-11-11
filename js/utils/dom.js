export const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null) el.append(c);
  return el;
};
export const fmtDate = (iso) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
// Entrance motion: GSAP when present, Web Animations fallback, none for reduced motion.
export const anim = (el) => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.gsap) window.gsap.from(el, { y: 24, opacity: 0, duration: 0.28, ease: "power2.out", clearProps: "all" });
  else el.animate([{ transform: "translateY(24px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: "ease-out" });
};
