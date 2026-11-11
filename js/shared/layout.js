(function () {
  const NAV = [
    { href: "index.html#home", label: "Home", m: true },
    { href: "index.html#about", label: "About" },
    { href: "index.html#features", label: "Features" },
    { href: "index.html#how-it-works", label: "How it works" },
    { href: "peta.html", label: "Report Map" },
    { href: "analitik.html", label: "Analytics" },
    { href: "dashboard.html", label: "Dashboard" },
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
  const SESSION_KEY = "urbanpulse.session.v1";
  const USERS_KEY = "urbanpulse.users.v1";
  const readSession = () => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      const list = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      const u =
        s && Array.isArray(list) ? list.find((x) => x.id === s.userId) : null;
      return u ? { name: u.name, role: u.role, status: u.status } : null;
    } catch {
      return null;
    }
  };
  const sess = readSession();
  const roleLabel = sess
    ? sess.role === "admin"
      ? "Officer"
      : "Resident"
    : "";
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
        ${
          sess
            ? `<span class="up-nav-user"><i>${roleLabel}</i>${sess.name}</span><button class="up-nav-out" type="button" id="upSignout">Sign out</button>`
            : `<a class="up-nav-signin" href="masuk.html">Sign in</a>`
        }
        <a class="up-nav-cta" href="lapor.html"><span>Report an Issue</span>${ico.arrow}</a>
        <button class="up-nav-toggle" id="upToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="upMenu"><span class="up-burger" aria-hidden="true"><i></i><i></i></span><span>Menu</span></button>
      </div>
    </div>
    <span class="up-nav-prog" aria-hidden="true"></span>
  </header>
  <div class="up-menu" id="upMenu" role="dialog" aria-modal="true" aria-label="Site navigation" aria-hidden="true" inert>
    <div class="up-menu-bg" aria-hidden="true"><svg viewBox="0 0 400 300"><path d="M-10 230C80 210 150 140 260 120S390 60 420 40"/><path d="M60 310C90 220 170 170 210 60S280 -10 290 -20"/><path d="M-10 120C60 140 140 120 220 170S350 250 420 230"/></svg></div>
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
        ${
          sess
            ? `<p class="up-mono">Signed in as ${sess.name} &middot; ${roleLabel}${sess.status === "pending" ? " (waiting for approval)" : ""}</p><button class="up-menu-out" type="button" id="upMenuOut">Sign out</button>`
            : `<p class="up-mono">No account yet? <a href="daftar.html">Create one</a>, or <a href="masuk.html">sign in</a>.</p>`
        }
        <a class="up-menu-cta" href="lapor.html"><span>Report an Issue</span>${ico.arrow}</a>
        <p class="up-mono">Smart City &amp; Urban Innovation &middot; SDG 9 &amp; 11</p>
      </div>
    </div>
  </div>`;

  const letters = (t, cls) =>
    `<span class="${cls}">${[...t].map((c) => `<span class="l">${c}</span>`).join("")}</span>`;
  const footer = `
  <footer class="up-foot" id="upFoot">
    <div class="container">
      <div class="up-foot-top">
        <div class="up-foot-brand">
          <p class="up-foot-lead">UrbanPulse is an independent civic-tech platform that helps residents report, track, and prioritize repairs to city infrastructure.</p>
          <div class="up-foot-id">
            <p class="up-mono">Smart City &amp; Urban Innovation</p>
            <div class="up-foot-sdg"><b>9</b><span>Industry, Innovation &amp; Infrastructure</span></div>
            <div class="up-foot-sdg"><b>11</b><span>Sustainable Cities &amp; Communities</span></div>
          </div>
        </div>
        <nav class="up-foot-nav" aria-label="Footer">
          <ol>
            ${NAV.map((n, i) => `<li><a href="${n.href}"><i>${pad(i + 1)}</i>${n.label}${ico.arrow}</a></li>`).join("")}
            <li><a href="lapor.html"><i>${pad(NAV.length + 1)}</i>Report an Issue${ico.arrow}</a></li>
          </ol>
          <div class="up-foot-cats"><span class="up-mono">Browse the map by category</span>${CATS.map(([k, l]) => `<a href="peta.html?kategori=${k}">${l}</a>`).join("")}</div>
        </nav>
      </div>
      <svg class="up-foot-pulse" viewBox="0 0 1200 36" aria-hidden="true"><path pathLength="1" d="M0 18H430l16-14 22 28 18-22 12 8H1200"/></svg>
      <div class="up-foot-mark" id="upMark" role="img" aria-label="UrbanPulse"><span class="up-foot-mark-in" aria-hidden="true">${letters("Urban", "u")}${letters("Pulse", "p")}</span></div>
      <div class="up-foot-bottom">
        <p>&copy; <span id="upYear"></span> UrbanPulse. Smart City &amp; Urban Innovation category (SDG 9 &amp; 11).</p>
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
  const gs = () => (window.gsap && !reduce.matches ? window.gsap : null);
  if (window.gsap && !reduce.matches) root.classList.add("has-gsap");
  if (!nav) return;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      nav.classList.toggle("is-scrolled", scrollY > 8);
      nav.style.setProperty(
        "--p",
        max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0,
      );
    });
  };
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  const links = [...document.querySelectorAll("#upLinks a")],
    menuLinks = [...document.querySelectorAll(".up-menu-list a")],
    ind = $(".up-nav-ind");
  function place() {
    const a = links.find((x) => x.classList.contains("active"));
    if (!a || !a.offsetWidth) {
      ind.style.opacity = 0;
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

  let open = false,
    tl = null;
  const closeBtn = $(".up-menu-close"),
    focusables = () => [...menu.querySelectorAll("a[href],button")];

  function resetMenuElements() {
    const g = window.gsap;
    if (g) {
      g.set([menu, closeBtn], { clearProps: "all" });
      g.set(".up-menu-list .t > span, .up-menu-list .n, .up-menu-foot > *", {
        clearProps: "all",
      });
    }
  }

  function openMenu() {
    if (open) return;
    open = true;

    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");
    root.classList.add("up-lock");

    const g = gs();

    if (g) {
      const w = innerWidth,
        cx = w - 36,
        r = Math.hypot(cx, innerHeight) + 24;

      if (tl) {
        tl.kill();
        tl = null;
      }
      resetMenuElements();

      tl = g.timeline({ defaults: { ease: "power3.inOut" } });
      tl.set(menu, { visibility: "visible" })
        .fromTo(
          menu,
          { clipPath: `circle(0px at ${cx}px 36px)` },
          { clipPath: `circle(${r}px at ${cx}px 36px)`, duration: 0.85 },
        )
        .fromTo(
          ".up-menu-list .t > span",
          { yPercent: 118, rotate: 3 },
          {
            yPercent: 0,
            rotate: 0,
            duration: 0.75,
            stagger: 0.07,
            ease: "power4.out",
            clearProps: "transform",
          },
          "-=0.45",
        )
        .fromTo(
          ".up-menu-list .n",
          { opacity: 0, x: -14 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.07,
            ease: "power2.out",
            clearProps: "opacity,transform",
          },
          "<",
        )
        .fromTo(
          ".up-menu-foot > *",
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "opacity,transform",
          },
          "-=0.45",
        )
        .fromTo(
          closeBtn,
          { rotate: -135, scale: 0.4, opacity: 0 },
          {
            rotate: 0,
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(2)",
            clearProps: "transform,opacity",
          },
          0.25,
        );
    } else menu.classList.add("is-open");
    setTimeout(() => closeBtn.focus({ preventScroll: true }), g ? 400 : 60);
  }

  function closeMenu(instant) {
    if (!open) return;
    open = false;

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    menu.setAttribute("inert", "");
    menu.setAttribute("aria-hidden", "true");
    root.classList.remove("up-lock");

    const g = window.gsap;

    if (tl && g && !instant) {
      const t = tl;
      t.eventCallback("onReverseComplete", () => {
        resetMenuElements();
        t.kill();
        if (tl === t) tl = null;
      });
      t.timeScale(1.5).reverse();
    } else {
      if (tl) {
        tl.kill();
        tl = null;
      }
      resetMenuElements();
      menu.classList.remove("is-open");
    }
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
    if (e.matches) closeMenu(true);
  });

  const foot = $("#upFoot"),
    mark = $("#upMark"),
    inner = mark && $(".up-foot-mark-in", mark);
  const fit = () => {
    if (!mark) return;
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
  const signOut = (btn) =>
    btn &&
    btn.addEventListener("click", () => {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
      }
      location.href = "index.html";
    });
  signOut($("#upSignout"));
  signOut($("#upMenuOut"));

  const top = $("#upTop");
  if (top)
    top.addEventListener("click", () =>
      scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" }),
    );
  const g = gs();
  if (g && window.ScrollTrigger && foot) {
    g.registerPlugin(window.ScrollTrigger);
    const trig = { trigger: foot, start: "top 82%" };
    g.from(".up-foot-lead, .up-foot-id > *", {
      y: 28,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: trig,
    });
    g.from(".up-foot-nav li", {
      clipPath: "inset(0 100% 0 0)",
      x: 36,
      duration: 0.8,
      stagger: 0.07,
      ease: "power3.inOut",
      clearProps: "clipPath,transform",
      scrollTrigger: trig,
    });
    g.from(".up-foot-cats > *", {
      opacity: 0,
      y: 14,
      duration: 0.5,
      stagger: 0.05,
      scrollTrigger: { trigger: ".up-foot-cats", start: "top 95%" },
    });
    g.fromTo(
      ".up-foot-pulse path",
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power2.inOut",
        scrollTrigger: { trigger: ".up-foot-pulse", start: "top 92%" },
      },
    );
    g.from(".up-foot-mark .l", {
      yPercent: 115,
      duration: 0.9,
      stagger: 0.04,
      ease: "power4.out",
      clearProps: "transform",
      onComplete: () => mark.classList.add("is-in"),
      scrollTrigger: trig,
    });
    g.fromTo(
      ".up-foot-mark-in",
      { yPercent: 14 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: foot,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
  }
})();
