export const PATH = {
  road: "M4 21 9 3M20 21 15 3M12 5v3M12 11v3M12 17v3",
  streetlight:
    "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  waste: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  flood: "M2 9q2.5-3 5 0t5 0 5 0 5 0M2 15q2.5-3 5 0t5 0 5 0 5 0",
};
export const UI = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  fit: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  reset: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  x: "M6 6l12 12M18 6 6 18",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  all: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
};
export const GLYPH = { pending: "!", "in-progress": "…", resolved: "✓" };
export const CLS = {
  pending: "pending",
  "in-progress": "progress",
  resolved: "resolved",
};
const wrap = (d, s) =>
  `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
export const catIcon = (c, s = 16) => wrap(PATH[c], s);
export const icoEl = (d, s = 18) => {
  const t = document.createElement("template");
  t.innerHTML = wrap(d, s);
  return t.content.firstChild;
};
export const catEl = (c, s = 16) => icoEl(PATH[c], s);
