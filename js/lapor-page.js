/**
 * lapor-page.js — GSAP animation module for lapor.html (Mission Control)
 *
 * Uses GSAP + ScrollTrigger loaded globally via CDN.
 * Orange accent, word-by-word title reveal, animated step indicators.
 */

document.addEventListener("DOMContentLoaded", () => {
  const { gsap } = window;
  if (!gsap) return;

  if (window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  initHeroAnimations(gsap);
  initStepAnimations(gsap);
  enhanceFormPanel(gsap);
  enhanceFormFields(gsap);
});

/* ─────────────────────────────────────────────────
   Hero entrance — eyebrow + word-by-word title + subtitle
───────────────────────────────────────────────── */
function initHeroAnimations(gsap) {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Eyebrow dot + label
  tl.from(".lapor-eyebrow", {
    x: -32,
    opacity: 0,
    duration: 0.55,
  });

  // Words reveal staggered (each .lapor-word)
  tl.to(".lapor-word", {
    opacity: 1,
    y: 0,
    duration: 0.65,
    stagger: 0.14,
    ease: "back.out(1.6)",
  }, "-=0.1");

  // Subtitle
  tl.to(".lapor-subtitle", {
    opacity: 1,
    y: 0,
    duration: 0.6,
  }, "-=0.3");
}

/* ─────────────────────────────────────────────────
   Step indicators with connector line draw
───────────────────────────────────────────────── */
function initStepAnimations(gsap) {
  const stepsEl = document.getElementById("lapor-steps");
  if (!stepsEl) return;

  const ST = window.ScrollTrigger;
  const steps      = stepsEl.querySelectorAll(".lapor-step");
  const connectors = stepsEl.querySelectorAll(".lapor-step-connector");

  const tl = gsap.timeline({
    scrollTrigger: ST ? {
      trigger: stepsEl,
      start: "top 80%",
      toggleActions: "play none none none",
    } : undefined,
  });

  steps.forEach((step, i) => {
    // Slide each step in from right
    tl.to(step, {
      opacity: 1,
      x: 0,
      duration: 0.55,
      ease: "power3.out",
    }, i === 0 ? 0 : "-=0.25");

    // After each step (except last), draw the connector
    if (connectors[i]) {
      tl.to(connectors[i], {
        scaleY: 1,
        duration: 0.35,
        ease: "power2.inOut",
        transformOrigin: "top",
      }, "-=0.1");
    }
  });

  // Spin animation already on .lapor-step-ring via CSS
  // Add a subtle glow pulse to icons after entrance
  gsap.to(".lapor-step-icon", {
    boxShadow: "0 0 24px rgba(16,185,129,.35)",
    duration: 1.5,
    stagger: 0.4,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
    delay: 1.5,
  });
}

/* ─────────────────────────────────────────────────
   Form panel: slide + scale on open (observe DOM)
───────────────────────────────────────────────── */
function enhanceFormPanel(gsap) {
  const root = document.getElementById("up-map-root");
  if (!root) return;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== "attributes" || m.attributeName !== "hidden") continue;
      const target = m.target;

      if (target.classList.contains("up-report") && !target.hidden) {
        const isMobile = window.innerWidth <= 720;
        gsap.fromTo(
          target,
          isMobile
            ? { y: 80, opacity: 0, scale: 0.96 }
            : { x: 56, opacity: 0, scale: 0.98 },
          isMobile
            ? { y: 0, opacity: 1, scale: 1,  duration: 0.48, ease: "back.out(1.4)", clearProps: "transform,opacity" }
            : { x: 0, opacity: 1, scale: 1,  duration: 0.42, ease: "power3.out",   clearProps: "transform,opacity" }
        );
      }

      // Success done state transition
      if (target.classList.contains("up-report-done") && !target.hidden) {
        gsap.fromTo(
          target,
          { scale: 0.9, opacity: 0 },
          { scale: 1,   opacity: 1, duration: 0.5, ease: "back.out(1.8)" }
        );
      }
    }
  });

  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
}

/* ─────────────────────────────────────────────────
   Form field focus glow enhancement
───────────────────────────────────────────────── */
function enhanceFormFields(gsap) {
  // Delegate to any input/select/textarea within the report panel
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (!el.closest(".up-report")) return;
    if (!["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) return;
    gsap.to(el, { scale: 1.01, duration: 0.2, ease: "power2.out" });
  });

  document.addEventListener("focusout", (e) => {
    const el = e.target;
    if (!el.closest(".up-report")) return;
    if (!["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) return;
    gsap.to(el, { scale: 1, duration: 0.2, ease: "power2.in" });
  });
}
