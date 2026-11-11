/* lapor.html motion: sequential, directional reveals for the form steps. Uses GSAP + ScrollTrigger from the CDN. */
document.addEventListener("DOMContentLoaded", () => {
  const g = window.gsap;
  if (
    !g ||
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !document.querySelector(".rp")
  )
    return;
  if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
  g.timeline({ defaults: { ease: "power3.out" } })
    .from(".rp-mapcol", {
      clipPath: "inset(0 0 0 100%)",
      duration: 1.1,
      ease: "power3.inOut",
      clearProps: "clipPath",
    })
    .from(
      ".rp-head > *",
      {
        clipPath: "inset(0 100% 0 0)",
        x: -30,
        stagger: 0.09,
        duration: 0.8,
        clearProps: "clipPath,transform",
      },
      0.1,
    )
    .from(
      ".rp-meter li",
      {
        scaleX: 0,
        transformOrigin: "left",
        stagger: 0.08,
        duration: 0.5,
        clearProps: "transform",
      },
      0.5,
    );
  // Each step: hairline + heading wipe from the left, controls slide in from alternating sides.
  g.utils.toArray(".rp-step").forEach((s, i) => {
    const st = window.ScrollTrigger
      ? { trigger: s, start: "top 82%", once: true }
      : undefined;
    g.from(s.querySelector(".rp-step-h"), {
      clipPath: "inset(0 100% 0 0)",
      x: -24,
      duration: 0.7,
      ease: "power3.out",
      clearProps: "clipPath,transform",
      scrollTrigger: st,
    });
    g.from(
      s.querySelectorAll(".rp-loc, .rp-tile, .rp-seg-o, .rp-field, .rp-drop"),
      {
        x: i % 2 ? 36 : -36,
        opacity: 0,
        stagger: 0.07,
        duration: 0.6,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: st,
      },
    );
  });
});
