/* UrbanPulse shell: injects the sticky navbar, mobile menu and footer on every page.
   Usage: <div id="app-navbar"></div> ... <main>...</main> ... <div id="app-footer"></div>
          <script src="js/layout.js"></script>   (tanpa dependensi eksternal) */
(function () {
  const NAV = [
    { href: "index.html#home", label: "Home", m: true },
    { href: "index.html#about", label: "About" },
    { href: "index.html#features", label: "Features" },
    { href: "index.html#how-it-works", label: "How it works" },
    { href: "peta.html", label: "Report map" },
    // halaman statistik belum ada; arahkan ke ringkasan data di beranda, jangan taruh tautan mati.
    { href: "index.html#impact", label: "Statistics" },
  ];
  const CATS = [
    ["road", "Road damage"],
    ["streetlight", "Broken streetlights"],
    ["waste", "Waste"],
    ["flood", "Flooding"],
  ];
  const svg = (d, s = 16, sw = 2) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ico = {
    pulse: svg('<path d="M3 12h4l3-8 4 16 3-8h4"/>', 18, 2.2),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 14, 2.4),
    up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>', 14, 2.4),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>', 20, 2.2),
  };
  const page = location.pathname.split("/").pop() || "index.html";
  const hash = (h) => (h.includes("#") ? h.split("#")[1] : "");
  const pad = (n) => String(n).padStart(2, "0");
  const desk = NAV.filter((n) => !n.m);

  const navbar = `
  <a class="up-skip" href="#main">Skip to content</a>
  <header class="up-nav" id="navbar">
    <div class="container up-nav-in">
      <a class="up-brand" href="index.html#home" aria-label="UrbanPulse home"><span class="up-brand-mark">${ico.pulse}</span><span>Urban<b>Pulse</b></span></a>
      <nav class="up-nav-main" aria-label="Primary">
        <ul class="up-nav-links" id="upLinks">
          ${NAV.map((n) => {
            const i = desk.indexOf(n);
            const on = n.href === page;
            return `<li${n.m ? ' class="m"' : ""}><a href="${n.href}" data-spy="${hash(n.href)}"${on ? ' class="active" aria-current="page"' : ""}>${i >= 0 ? `<i>${pad(i + 1)}</i>` : ""}${n.label}</a></li>`;
          }).join("")}
        </ul>
        <span class="up-nav-ind" aria-hidden="true"></span>
      </nav>
      <div class="up-nav-act">
        <a class="up-nav-cta" href="lapor.html"><span>Report an issue</span>${ico.arrow}</a>
        <button class="up-nav-toggle" id="upToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="upMenu"><span class="up-burger" aria-hidden="true"><i></i><i></i></span><span>Menu</span></button>
      </div>
    </div>
  </header>
  <div class="up-menu" id="upMenu" role="dialog" aria-modal="true" aria-label="Site navigation" aria-hidden="true" inert>
    <div class="container up-menu-in">
      <div class="up-menu-top">
        <a class="up-brand" href="index.html#home"><span class="up-brand-mark">${ico.pulse}</span><span>Urban<b>Pulse</b></span></a>
        <button class="up-menu-close" type="button" aria-label="Close menu">${ico.x}</button>
      </div>
      <nav aria-label="Mobile">
        <ol class="up-menu-list">
          ${NAV.map((n, i) => `<li><a href="${n.href}" data-spy="${hash(n.href)}"${n.href === page ? ' class="active" aria-current="page"' : ""}><span class="n">${pad(i + 1)}</span><span class="t"><span>${n.label}</span></span></a></li>`).join("")}
        </ol>
      </nav>
      <div class="up-menu-foot">
        <a class="up-menu-cta" href="lapor.html"><span>Report an issue</span>${ico.arrow}</a>
        <p class="up-mono">Smart City &amp; Urban Innovation &middot; SDG 9 &amp; 11</p>
      </div>
    </div>
  </div>`;

  const footer = `
  <footer class="up-foot" id="upFoot">
    <div class="container">
      <div class="up-foot-top">
        <div class="up-foot-brand">
          <p class="up-foot-lead">UrbanPulse is a civic reporting demo for resident-filed infrastructure reports. Every entry in the dataset is simulated, and the project is built as a student prototype.</p>
          <div class="up-foot-id">
            <p class="up-mono">Smart City &amp; Urban Innovation</p>
            <div class="up-foot-sdg"><b>9</b><span>Industry, Innovation &amp; Infrastructure</span></div>
            <div class="up-foot-sdg"><b>11</b><span>Sustainable Cities &amp; Communities</span></div>
          </div>
        </div>
        <nav class="up-foot-nav" aria-label="Footer">
          <ol>
            ${NAV.map((n, i) => `<li><a href="${n.href}"><i>${pad(i + 1)}</i>${n.label}${ico.arrow}</a></li>`).join("")}
            <li><a href="lapor.html"><i>${pad(NAV.length + 1)}</i>Report an issue${ico.arrow}</a></li>
          </ol>
          <div class="up-foot-cats"><span class="up-mono">Browse the map by category</span>${CATS.map(([k, l]) => `<a href="peta.html?kategori=${k}">${l}</a>`).join("")}</div>
        </nav>
      </div>
      <svg class="up-foot-pulse" viewBox="0 0 1200 36" aria-hidden="true"><path d="M0 18H430l16-14 22 28 18-22 12 8H1200"/></svg>
      <div class="up-foot-mark" id="upMark" role="img" aria-label="UrbanPulse"><span class="up-foot-mark-in"><span class="u">Urban</span><span class="p">Pulse</span></span></div>
      <div class="up-foot-bottom">
        <p>&copy; <span id="upYear"></span> UrbanPulse. Prototype dataset, all reports simulated.</p>
        <button class="up-foot-totop" type="button" id="upTop">Back to top ${ico.up}</button>
      </div>
    </div>
  </footer>`;

  const mount = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.outerHTML = html;
  };
  mount("app-navbar", navbar);
  mount("app-footer", footer);
  const $ = (s, r = document) => r.querySelector(s);
  const main = $("main");
  if (main && !main.id) {
    main.id = "main";
    main.tabIndex = -1;
  }
  const yr = $("#upYear");
  if (yr) yr.textContent = new Date().getFullYear();

  const root = document.documentElement,
    nav = $("#navbar"),
    toggle = $("#upToggle"),
    menu = $("#upMenu");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  if (!nav) return;

  /* ---- sticky navbar: scrolled state ---- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      nav.classList.toggle("is-scrolled", scrollY > 8);
    });
  };
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  /* ---- active item: indicator + section scroll-spy (landing page) ---- */
  const links = [...document.querySelectorAll("#upLinks a")],
    menuLinks = [...document.querySelectorAll(".up-menu-list a")],
    ind = $(".up-nav-ind");
  function place() {
    const a = links.find((x) => x.classList.contains("active"));
    if (!a || !a.offsetWidth || !ind) {
      if (ind) ind.style.opacity = 0;
      return;
    }
    const p = parseFloat(getComputedStyle(a).paddingLeft) || 0;
    ind.style.width = `${a.offsetWidth - 2 * p}px`;
    ind.style.transform = `translateX(${a.offsetLeft + p}px)`;
    ind.style.opacity = 1;
  }
  function setActive(id) {
    [links, menuLinks].forEach((list) =>
      list.forEach((a) => {
        if (
          a.dataset.spy === undefined ||
          a.getAttribute("href").split("#")[0] !== "index.html"
        )
          return;
        const on = !!id && a.dataset.spy === id;
        a.classList.toggle("active", on);
        on
          ? a.setAttribute("aria-current", "location")
          : a.removeAttribute("aria-current");
      }),
    );
    place();
  }
  if (page === "index.html" && "IntersectionObserver" in window) {
    const ids = NAV.map((n) => hash(n.href)).filter((h) => h && h !== "home");
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting)
            setActive(ids.includes(e.target.id) ? e.target.id : null);
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main > section").forEach((s) => io.observe(s));
  }
  place();
  addEventListener("resize", place);
  if (document.fonts) document.fonts.ready.then(place);

  /* ---- mobile menu ---- */
  let open = false;
  const closeBtn = $(".up-menu-close"),
    focusables = () => [...menu.querySelectorAll("a[href],button")];

  function openMenu() {
    if (open) return;
    open = true;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");
    menu.classList.add("is-open");
    root.classList.add("up-lock");
    closeBtn.focus({ preventScroll: true });
  }

  function closeMenu() {
    if (!open) return;
    open = false;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    menu.setAttribute("inert", "");
    menu.setAttribute("aria-hidden", "true");
    menu.classList.remove("is-open");
    root.classList.remove("up-lock");
    toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => (open ? closeMenu() : openMenu()));
  closeBtn.addEventListener("click", () => closeMenu());
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a") || !e.target.closest("button")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "Tab") {
      const f = focusables(),
        first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
    if (e.matches) closeMenu();
  });

  /* ---- footer: fitted wordmark, back-to-top ---- */
  const mark = $("#upMark"),
    inner = mark && $(".up-foot-mark-in", mark);
  const fit = () => {
    if (!mark || !inner) return;
    mark.style.fontSize = "100px";
    const w = inner.getBoundingClientRect().width,
      t = mark.clientWidth;
    if (w > 0 && t > 0) mark.style.fontSize = `${((100 * t) / w).toFixed(2)}px`;
  };
  if (mark) {
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
    if ("ResizeObserver" in window)
      new ResizeObserver(fit).observe(mark.parentElement);
    else addEventListener("resize", fit);
  }
  const top = $("#upTop");
  if (top)
    top.addEventListener("click", () =>
      scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" }),
    );
})();
