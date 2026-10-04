import { useEffect } from "react";

export default function useLandingMotion(root) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    const setup = () => {
      observer?.disconnect();
      element
        .querySelectorAll("[data-af-reveal]")
        .forEach((node) => node.classList.remove("af-awaiting"));
      if (media.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.remove("af-awaiting");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px 80px 0px" },
      );
      element.querySelectorAll("[data-af-reveal]").forEach((node) => {
        if (node.getBoundingClientRect().top > window.innerHeight)
          node.classList.add("af-awaiting");
        observer.observe(node);
      });
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", setup);
    };
  }, [root]);
}
