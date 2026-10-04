import { useEffect, useRef } from "react";

// The SVG is also the mobile, reduced-motion, and unavailable-WebGL version.
export default function RupeeMotif() {
  const root = useRef(null);
  useEffect(() => {
    const host = root.current;
    const media = window.matchMedia(
      "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let observer,
      dispose,
      generation = 0;
    const setup = () => {
      const current = ++generation;
      observer?.disconnect();
      dispose?.();
      dispose = undefined;
      host.classList.remove("af-rupee-rendered");
      if (!media.matches || navigator.connection?.saveData) return;
      observer = new IntersectionObserver(
        async ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          try {
            const { createRupeeScene } = await import("./rupeeScene");
            if (generation !== current) return;
            dispose = createRupeeScene(host);
          } catch {
            // The fallback remains visible if the GPU or module is unavailable.
          }
        },
        { rootMargin: "120px" },
      );
      observer.observe(host);
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      generation++;
      observer?.disconnect();
      dispose?.();
      media.removeEventListener("change", setup);
    };
  }, []);
  return (
    <div className="af-rupee-motif" ref={root} aria-hidden="true">
      <svg className="af-rupee-fallback" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="af-coin-face" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#557950" />
            <stop offset="1" stopColor="#153c2b" />
          </linearGradient>
        </defs>
        <circle
          cx="120"
          cy="120"
          r="86"
          fill="url(#af-coin-face)"
          stroke="#99b577"
          strokeWidth="3"
        />
        <circle cx="120" cy="120" r="75" fill="none" stroke="#bbcf952e" />
        <path
          d="M86 78H154M86 95H154M92 79H109C145 79 145 117 109 117H92L143 164"
          fill="none"
          stroke="#d9e6b7"
          strokeWidth="9"
          strokeLinejoin="round"
        />
      </svg>
      <span className="af-rupee-shadow" />
    </div>
  );
}
