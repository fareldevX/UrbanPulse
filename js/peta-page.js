/**
 * peta-page.js — GSAP animation module for peta.html (Command Center)
 *
 * Uses GSAP + ScrollTrigger loaded globally via CDN.
 * Reads real report counts from reportRepository.
 */
import * as repo from "./services/reportRepository.js";

// Wait for DOM + GSAP to be ready
document.addEventListener("DOMContentLoaded", () => {
  const { gsap } = window;
  if (!gsap) return;

  // Register ScrollTrigger plugin
  if (window.ScrollTrigger) {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  initHeroAnimations(gsap);
  initStatsCounters(gsap);
  initChipBounce(gsap);
  enhanceDetailPanel(gsap);
});

/* ─────────────────────────────────────────────────
   Hero entrance animations
───────────────────────────────────────────────── */
function initHeroAnimations(gsap) {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Live badge slides down
  tl.from(".peta-live-badge", {
    y: -24,
    opacity: 0,
    duration: 0.5,
  });

  // Title lines reveal via clip-path stagger
  tl.to(".peta-title-line", {
    clipPath: "inset(0 0% 0 0)",
    duration: 0.9,
    stagger: 0.18,
    ease: "power4.out",
  }, "-=0.1");

  // Subtitle fades + slides up
  tl.to(".peta-subtitle", {
    opacity: 1,
    y: 0,
    duration: 0.7,
  }, "-=0.4");
}

/* ─────────────────────────────────────────────────
   Stat counters (ScrollTrigger)
───────────────────────────────────────────────── */
function initStatsCounters(gsap) {
  const reports = repo.getReports();
  const total      = reports.length;
  const pending    = reports.filter(r => r.status === "pending").length;
  const inProgress = reports.filter(r => r.status === "in-progress").length;
  const resolved   = reports.filter(r => r.status === "resolved").length;
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const statsEl = document.getElementById("peta-stats");
  if (!statsEl) return;

  const ST = window.ScrollTrigger;

  // Animate stat cards into view first
  gsap.to(".peta-stat", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: ST ? {
      trigger: statsEl,
      start: "top 85%",
      toggleActions: "play none none none",
    } : undefined,
    onStart: ST ? undefined : undefined,
  });

  // Helper: animate a counter element
  function countUp(elId, target, suffix = "") {
    const el = document.getElementById(elId);
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      roundProps: "val",
      onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
      scrollTrigger: ST ? {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      } : undefined,
    });
  }

  countUp("stat-total",    total);
  countUp("stat-pending",  pending);
  countUp("stat-resolved", resolvedPct, "%");
  countUp("stat-progress", inProgress);
}

/* ─────────────────────────────────────────────────
   Filter chip bounce on click (observe DOM mutations)
───────────────────────────────────────────────── */
function initChipBounce(gsap) {
  // Use event delegation — chips are created by mapController.js
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".up-map-chip");
    if (!chip) return;
    gsap.timeline()
      .to(chip, { scale: 0.88, duration: 0.1, ease: "power2.in" })
      .to(chip, { scale: 1.08, duration: 0.15, ease: "back.out(3)" })
      .to(chip, { scale: 1,    duration: 0.12, ease: "power2.out" });
  }, true); // capture to fire before aria-pressed flips
}

/* ─────────────────────────────────────────────────
   Detail panel: watch for visibility changes and
   apply a richer GSAP slide-in from the right.
───────────────────────────────────────────────── */
function enhanceDetailPanel(gsap) {
  const root = document.getElementById("up-map-root");
  if (!root) return;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== "attributes" || m.attributeName !== "hidden") continue;
      const target = m.target;
      if (!target.classList.contains("up-detail")) continue;

      if (!target.hidden) {
        // Panel just became visible — slide in from right
        const isMobile = window.innerWidth <= 720;
        gsap.fromTo(
          target,
          isMobile
            ? { y: 60, opacity: 0, scale: 0.98 }
            : { x: 48, opacity: 0 },
          isMobile
            ? { y: 0, opacity: 1, scale: 1,  duration: 0.42, ease: "power3.out", clearProps: "transform,opacity" }
            : { x: 0, opacity: 1,             duration: 0.38, ease: "power3.out", clearProps: "transform,opacity" }
        );
      }
    }
  });

  // Observe the entire up-map subtree for attribute changes
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
}
