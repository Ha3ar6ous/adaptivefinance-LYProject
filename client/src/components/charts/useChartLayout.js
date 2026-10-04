import { useEffect, useRef, useState } from "react";

// Measure the actual card, so mobile charts retain readable labels and full-height plots.
export default function useChartLayout(enabled) {
  const ref = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const measure = () =>
      setWidth(
        Math.max(240, Math.round(element.getBoundingClientRect().width)),
      );
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);
  return { ref, width };
}
