/* peta.html motion: spatial reveal of the console and map. Uses GSAP + ScrollTrigger from the CDN. */
document.addEventListener("DOMContentLoaded", () => {
  const g = window.gsap;
  if (
    !g ||
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !document.querySelector(".mp-stage")
  )
    return;
  if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
  const tl = g.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".mp-stage", {
    clipPath: "inset(0 0 0 100%)",
    duration: 1.1,
    ease: "power3.inOut",
    clearProps: "clipPath",
  })
    .from(
      ".mp-head > *",
      {
        clipPath: "inset(0 0 100% 0)",
        y: 22,
        stagger: 0.08,
        duration: 0.7,
        clearProps: "clipPath,transform",
      },
      0.15,
    )
    .from(
      ".mp-filters > *",
      {
        x: -28,
        opacity: 0,
        stagger: 0.07,
        duration: 0.55,
        clearProps: "transform,opacity",
      },
      0.4,
    )
    .from(
      ".mp-cat",
      {
        x: -16,
        opacity: 0,
        stagger: 0.04,
        duration: 0.4,
        clearProps: "transform,opacity",
      },
      0.55,
    )
    .from(
      ".mp-row",
      {
        clipPath: "inset(0 100% 0 0)",
        stagger: 0.05,
        duration: 0.5,
        clearProps: "clipPath",
      },
      0.7,
    )
    .from(
      ".mp-ctl",
      { x: -34, opacity: 0, duration: 0.5, clearProps: "transform,opacity" },
      0.8,
    )
    .from(
      ".mp-legend, .mp-hint",
      {
        y: 28,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        clearProps: "transform,opacity",
      },
      0.9,
    )
    .from(
      ".mk",
      {
        scale: 0,
        stagger: 0.04,
        duration: 0.45,
        ease: "back.out(2.2)",
        clearProps: "transform",
      },
      0.95,
    );
  // On small screens the report list sits below the map: reveal rows as they scroll into view.
  if (window.ScrollTrigger)
    g.matchMedia().add("(max-width: 820px)", () => {
      window.ScrollTrigger.batch(".mp-row", {
        start: "top 92%",
        once: true,
        onEnter: (els) =>
          g.from(els, {
            clipPath: "inset(0 100% 0 0)",
            stagger: 0.06,
            duration: 0.5,
            clearProps: "clipPath",
          }),
      });
    });
});
