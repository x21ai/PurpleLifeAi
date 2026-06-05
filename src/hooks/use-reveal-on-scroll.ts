import { useEffect } from "react";

/**
 * Adds `data-revealed="true"` to every `[data-reveal]` element in the
 * document once it scrolls into view. CSS in `src/styles.css` handles the
 * opacity/translate transition and respects `prefers-reduced-motion`.
 *
 * Call once near the top of a marketing page.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-revealed", "true"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}