/* UrbanPulse home: interactions (always on) + GSAP/ScrollTrigger motion (skipped for reduced motion). */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");

  /* 01 Story: the stage state follows the step in view; the tabs scroll to a step instead of overriding it */
  const stage = $("#stage");
  if (stage) {
    const LABEL = ["Scattered", "Located", "Pattern"];
    const CAP = ["Six channels, six places. Nobody sees the whole picture.", "Each report now has coordinates and sits where the problem is.", "Four reports on one spot read very differently from four separate complaints."];
    const steps = $$(".story-step"), segs = $$("[data-go]", stage);
    const setStep = (i) => {
      stage.dataset.step = i; $("#stageLabel").textContent = LABEL[i]; $("#stageCapT").textContent = CAP[i];
      steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
      segs.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.go === i)));
    };
    segs.forEach((b) => b.addEventListener("click", () => steps[+b.dataset.go].scrollIntoView({ behavior: reduceMQ.matches ? "auto" : "smooth", block: "center" })));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setStep(steps.indexOf(e.target))), { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach((s) => io.observe(s));
    }
    setStep(0);
  }

  /* 02 Anatomy: pick a field, see the rule the form enforces */
  const RULES = {
    title: ["Title", "5 to 80 characters. Short enough to scan on a map, long enough to say what is wrong."],
    category: ["Category", "Road damage, broken streetlight, waste, or flooding. Each has its own marker color and icon on the map."],
    urgency: ["Urgency", "Low, medium, or high. Open reports marked high pulse on the map so they are hard to miss."],
    location: ["Location", "Chosen by clicking the map, and adjustable by dragging the pin. A report cannot be submitted without coordinates."],
    description: ["Description", "20 to 500 characters: enough for a crew to know what to bring."],
    photo: ["Photo (optional)", "JPG, PNG, or WebP up to 5 MB. It is resized to 1200 px at most and compressed in your browser before it is stored."],
  };
  const fbtns = $$(".field-btn"), crows = $$(".crow");
  const pickField = (k) => {
    fbtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === k)));
    crows.forEach((r) => r.classList.toggle("is-on", r.dataset.f === k));
    $("#ruleT").textContent = RULES[k][0]; $("#ruleP").textContent = RULES[k][1];
  };
  fbtns.forEach((b) => b.addEventListener("click", () => pickField(b.dataset.f)));
  if (fbtns.length) pickField("location");

  /* 05 Flow: highlight one role's hand-offs */
  const roleSeg = $("#roleSeg");
  if (roleSeg) roleSeg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    roleSeg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $$(".st").forEach((p) => p.classList.toggle("is-dim", b.dataset.role !== "all" && !` ${p.dataset.role} `.includes(` ${b.dataset.role} `)));
  });

  /* 07 CTA: the category choice retargets the map link */
  const ctaSeg = $("#ctaSeg"), ctaMap = $("#ctaMap");
  if (ctaSeg) ctaSeg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    ctaSeg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    ctaMap.href = `peta.html?kategori=${b.dataset.cat}`;
    ctaMap.textContent = `See ${b.textContent.toLowerCase()} on the map`;
  });

  const g = window.gsap, ST = window.ScrollTrigger;
  const root = document.documentElement;
  if (!g || !ST || matchMedia("(prefers-reduced-motion: reduce)").matches) { root.classList.add("no-motion"); return; }
  g.registerPlugin(ST);

  /* Hero: masked headline lines, road network drawing itself, pins popping in */
  g.timeline({ defaults: { ease: "power4.out" } })
    .from(".hx-eyebrow", { opacity: 0, x: -24, duration: 0.6 })
    .from(".hx-line > span", { yPercent: 115, duration: 1, stagger: 0.12 }, "-=0.3")
    .from(".hx-lead, .hx-cta, .hero-meta > *", { opacity: 0, y: 20, duration: 0.7, stagger: 0.08 }, "-=0.5")
    .from(".hx-layers, .hx-feed", { opacity: 0, x: 30, duration: 0.7, stagger: 0.1 }, "-=0.6");
  g.utils.toArray(".hx-roads path").forEach((p) => {
    const L = p.getTotalLength();
    g.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", delay: 0.2, onComplete: () => p.style.strokeDasharray = "none" });
  });
  document.addEventListener("up:pins", () => g.from(".hx-pin", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.07, ease: "back.out(2)", delay: 0.9 }));
  /* Hero scroll: the map pushes in while copy and side panel drift at different speeds (layered depth) */
  g.timeline({ scrollTrigger: { trigger: ".hx", start: "top top", end: "bottom top", scrub: true } })
    .to(".hx-map", { scale: 1.3, yPercent: -6, ease: "none" }, 0)
    .to(".hx-copy", { yPercent: -10, ease: "none" }, 0)
    .to(".hx-side", { yPercent: -28, ease: "none" }, 0);

  /* 01 Story: each block of copy wipes open from the top; the road layer drifts slower than the page */
  g.utils.toArray(".story-step > *").forEach((n) => g.from(n, { clipPath: "inset(0 0 100% 0)", y: 36, duration: 0.9, ease: "power3.out", clearProps: "clipPath", scrollTrigger: { trigger: n, start: "top 82%" } }));
  g.to(".stage-roads", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".story", start: "top bottom", end: "bottom top", scrub: true } });

  /* 02 Anatomy: card rows appear one after another, driven by scroll progress */
  g.from(".field-btn", { x: -40, opacity: 0, stagger: 0.08, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".field-list", start: "top 80%" } });
  g.from(".fx-card .crow", { clipPath: "inset(0 100% 0 0)", opacity: 0, stagger: 0.2, ease: "none", scrollTrigger: { trigger: ".fx-anatomy", start: "top 70%", end: "center 45%", scrub: true } });

  /* 03 and 04: headlines enter from different directions */
  g.from(".fx-time h2", { clipPath: "inset(0 0 0 100%)", x: 60, duration: 1, ease: "power3.out", clearProps: "clipPath", scrollTrigger: { trigger: ".fx-time", start: "top 70%" } });
  g.from(".fx-prio h2", { clipPath: "inset(100% 0 0 0)", y: 50, duration: 1, ease: "power3.out", clearProps: "clipPath", scrollTrigger: { trigger: ".fx-prio", start: "top 70%" } });

  /* 05 Flow: on wide screens the section pins and the track moves sideways with scroll progress */
  const flow = $("#flow"), track = $("#flowTrack");
  if (flow && track) g.matchMedia().add("(min-width: 900px)", () => {
    flow.classList.add("is-pinned");
    const bar = $("#flowBar"), n = $("#flowN"), count = $$(".st", track).length;
    g.to(track, { x: () => -Math.max(0, track.scrollWidth - innerWidth + 80), ease: "none",
      scrollTrigger: { trigger: flow, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true,
        onUpdate: (s) => { bar.style.setProperty("--p", s.progress); n.textContent = String(Math.min(count, Math.floor(s.progress * count * 0.999) + 1)).padStart(2, "0"); } } });
    return () => flow.classList.remove("is-pinned");
  });

  /* 06 Impact: headline wipes in from the left (bars are animated by homeStory.js) */
  g.from(".impact h2", { clipPath: "inset(0 100% 0 0)", duration: 1, ease: "power3.inOut", clearProps: "clipPath", scrollTrigger: { trigger: ".impact", start: "top 70%" } });

  /* 07 CTA: the three lines converge from different sides, the category strip slides with scroll */
  g.from(".cta-h span", { opacity: 0, x: (i) => (i === 1 ? 0 : i === 0 ? -140 : 140), y: (i) => (i === 1 ? 60 : 0), stagger: 0.12, ease: "none", scrollTrigger: { trigger: ".cta-x", start: "top 70%", end: "top 15%", scrub: true } });
  g.to(".marq-track", { xPercent: -50, ease: "none", scrollTrigger: { trigger: ".marq", start: "top bottom", end: "bottom top", scrub: 0.5 } });
})();
