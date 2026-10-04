import { useEffect } from "react";

export default function useLandingMotion(root) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false,
      loading = false,
      mediaContext;
    const setup = async () => {
      if (disposed || loading || mediaContext || reduced.matches) return;
      loading = true;
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (disposed || reduced.matches) return;
        gsap.registerPlugin(ScrollTrigger);
        mediaContext = gsap.matchMedia();
        mediaContext.add(
          {
            desktop: "(min-width: 1024px)",
            mobile: "(max-width: 1023px)",
            reduced: "(prefers-reduced-motion: reduce)",
          },
          (context) => {
            if (context.conditions.reduced) return;
            const desktop = context.conditions.desktop;
            const select = (selector) => element.querySelector(selector);
            const all = (selector) => [...element.querySelectorAll(selector)];
            element.classList.add("af-scroll-ready");

            // 1. Different depths leave the hero at different speeds; the coin shares its progress.
            const hero = select(".af-hero");
            const motif = select(".af-rupee-motif");
            const heroTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.65,
                onUpdate: (trigger) => {
                  motif.dataset.scrollProgress = trigger.progress;
                  motif.dispatchEvent(
                    new CustomEvent("af:rupee-progress", {
                      detail: trigger.progress,
                    }),
                  );
                },
              },
            });
            if (desktop) {
              heroTimeline
                .to(
                  select(".af-product-stage"),
                  { y: 65, rotation: -3, scale: 0.95, ease: "none" },
                  0,
                )
                .to(select(".af-hero-copy"), { y: -32, ease: "none" }, 0)
                .to(motif, { y: 115, x: -24, rotation: 12, ease: "none" }, 0)
                .fromTo(
                  select(".af-product-stage .af-forecast"),
                  { y: 8, rotation: 2 },
                  { y: -30, rotation: -3, ease: "none" },
                  0,
                )
                .to(
                  select(".af-product-stage .af-floating-note"),
                  { y: -60, x: 16, rotation: 4, ease: "none" },
                  0,
                );
            } else {
              heroTimeline.to(
                select(".af-product-stage"),
                { y: 12, ease: "none" },
                0,
              );
            }

            // 2. A uniform-looking payday opens into the actual, uneven earning week.
            const week = select(".af-earnings-strip");
            const bars = all(".af-week-bars .af-bar-space > span");
            const payday = gsap.timeline({
              scrollTrigger: {
                trigger: week,
                start: "top 90%",
                end: "bottom 58%",
                scrub: 0.5,
              },
            });
            bars.forEach((bar, index) => {
              payday.fromTo(
                bar,
                { height: "55%" },
                {
                  height: bar.style.getPropertyValue("--bar-height"),
                  duration: 1,
                  ease: "none",
                },
                index * 0.05,
              );
            });
            if (desktop)
              payday.fromTo(
                all(".af-earning-day"),
                {
                  x: (index) => (3 - index) * 10,
                  rotation: (index) => (index - 3) * 1.5,
                },
                { x: 0, rotation: 0, ease: "none", duration: 1.2 },
                0,
              );

            // 3. A single canvas changes meaning as the explanatory chapters pass it.
            // Sticky positioning is CSS; no scroll hijacking or extra pin spacer is needed.
            if (desktop) {
              const track = select(".af-journey-track");
              const layers = all(".af-journey-layer");
              const chapters = all(".af-journey-chapter");
              const markers = all(".af-journey-progress > span");
              const journey = gsap.timeline({
                scrollTrigger: {
                  trigger: track,
                  start: "top 22%",
                  end: "bottom 78%",
                  scrub: 0.6,
                  onUpdate: (self) => {
                    const active = Math.min(
                      4,
                      Math.floor(self.progress * 4.3 + 0.1),
                    );
                    chapters.forEach((chapter, index) =>
                      chapter.classList.toggle(
                        "af-journey-active",
                        index === active,
                      ),
                    );
                    markers.forEach((marker, index) =>
                      marker.classList.toggle(
                        "af-journey-active",
                        index === active,
                      ),
                    );
                  },
                },
              });
              gsap.set(layers.slice(1), {
                opacity: 0,
                y: 65,
                rotation: 4,
                scale: 0.92,
              });
              chapters[0].classList.add("af-journey-active");
              markers[0].classList.add("af-journey-active");
              for (let index = 1; index < layers.length; index++) {
                const at = index - 0.35;
                journey
                  .to(
                    layers[index - 1],
                    {
                      opacity: 0,
                      y: -45,
                      x: index % 2 ? -25 : 25,
                      rotation: -4,
                      scale: 0.95,
                      duration: 0.45,
                      ease: "power1.inOut",
                    },
                    at,
                  )
                  .to(
                    layers[index],
                    {
                      opacity: 1,
                      y: 0,
                      rotation: 0,
                      scale: 1,
                      duration: 0.55,
                      ease: "power1.inOut",
                    },
                    at + 0.08,
                  );
              }
              journey
                .to(
                  all(".af-journey-bars span"),
                  {
                    scaleY: 0.08,
                    scaleX: 0.5,
                    borderRadius: 12,
                    duration: 0.5,
                    stagger: 0.025,
                    ease: "none",
                  },
                  0.6,
                )
                .fromTo(
                  select(".af-journey-volatility-line"),
                  {
                    strokeDasharray: "1",
                    strokeDashoffset: 1,
                  },
                  { strokeDashoffset: 0, duration: 0.65, ease: "none" },
                  0.75,
                )
                .fromTo(
                  select(".af-journey-score-arc"),
                  { strokeDasharray: "0 100" },
                  { strokeDasharray: "76 100", duration: 0.65, ease: "none" },
                  1.65,
                )
                .fromTo(
                  all(".af-journey-factor-chips span"),
                  { y: 22, rotation: 5 },
                  { y: 0, rotation: 0, duration: 0.55, stagger: 0.04 },
                  1.75,
                )
                .fromTo(
                  select(".af-journey-shield"),
                  { scale: 0.7, rotation: -20 },
                  { scale: 1, rotation: 0, duration: 0.55 },
                  2.7,
                )
                .fromTo(
                  select(".af-journey-allocation div"),
                  { scaleX: 0.2 },
                  { scaleX: 1, duration: 0.6 },
                  3.7,
                )
                .to(
                  select(".af-journey-halo"),
                  { rotation: 110, scale: 1.2, duration: 4.3, ease: "none" },
                  0,
                )
                .to(
                  select(".af-journey-currency"),
                  { y: -70, rotation: 18, duration: 4.3, ease: "none" },
                  0,
                );
            }

            // 4. Guidance settles inside its protective frame; scenario controls remain independent.
            const safety = select(".af-safety-composition");
            const safetyTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: safety,
                start: "top 92%",
                end: "center 53%",
                scrub: 0.6,
              },
            });
            safetyTimeline
              .fromTo(
                select(".af-safety-frame"),
                {
                  rotation: desktop ? -11 : -3,
                  scale: 0.94,
                  x: desktop ? 24 : 0,
                  y: 35,
                },
                {
                  rotation: 0,
                  scale: 1,
                  x: 0,
                  y: 0,
                  duration: 1,
                  ease: "none",
                },
                0,
              )
              .fromTo(
                select(".af-safety-preview"),
                {
                  rotation: desktop ? 5 : 0,
                  x: desktop ? -18 : 0,
                  y: desktop ? 65 : 18,
                },
                { rotation: 0, x: 0, y: 0, duration: 1, ease: "none" },
                0,
              );
            if (desktop)
              safetyTimeline.fromTo(
                select(".af-safety-copy .af-outline-icon"),
                { y: -20, rotation: -15 },
                { y: 0, rotation: 0, duration: 1, ease: "none" },
                0,
              );

            const refresh = () => ScrollTrigger.refresh();
            document.fonts?.ready.then(() => {
              if (!disposed) refresh();
            });
            return () => {
              element.classList.remove("af-scroll-ready");
              all(".af-journey-active").forEach((node) =>
                node.classList.remove("af-journey-active"),
              );
              motif.dataset.scrollProgress = "0";
              motif.dispatchEvent(
                new CustomEvent("af:rupee-progress", { detail: 0 }),
              );
            };
          },
          element,
        );
      } catch {
        // Content is already complete and readable without motion dependencies.
      } finally {
        loading = false;
      }
    };
    setup();
    reduced.addEventListener("change", setup);
    return () => {
      disposed = true;
      mediaContext?.revert();
      reduced.removeEventListener("change", setup);
    };
  }, [root]);
}
