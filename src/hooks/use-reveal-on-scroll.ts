import { useEffect } from "react";

/**
 * Reveal-on-scroll for marketing pages.
 *
 * Contract with CSS in `src/styles.css`:
 *   - Elements default to fully visible.
 *   - This hook adds `.reveal-pending` on mount to opt elements into the
 *     fade-in transition, then toggles `data-revealed="true"` when in view.
 *   - A hard 1200ms fallback flips any still-pending element to revealed,
 *     so images can never end up permanently hidden if IO never fires.
 *
 * Also watches the DOM for late-mounted `[data-reveal]` nodes.
 *
 * Call once near the top of a marketing page.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = (el: Element) => {
      el.setAttribute("data-revealed", "true");
    };

    const isInViewport = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    const supportsIO = "IntersectionObserver" in window;
    const io: IntersectionObserver | null =
      !reduce && supportsIO
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) {
                  reveal(entry.target);
                  io?.unobserve(entry.target);
                }
              }
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
          )
        : null;

    const tracked = new WeakSet<Element>();
    const setup = (el: Element) => {
      if (tracked.has(el)) return;
      tracked.add(el);
      // Opt in to the fade-in transition. Without this class the element
      // stays fully visible, so a JS failure can never hide the image.
      el.classList.add("reveal-pending");
      if (reduce || !io) {
        reveal(el);
        return;
      }
      // Reveal synchronously if already in view at mount time, so we don't
      // wait for IntersectionObserver's first async callback.
      if (isInViewport(el)) {
        reveal(el);
        return;
      }
      io.observe(el);
    };

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach(setup);

    // Pick up sections mounted after this hook runs.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.("[data-reveal]")) setup(node);
          node.querySelectorAll?.("[data-reveal]").forEach(setup);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: after 1.2s, force-reveal anything still pending so
    // images can never stay hidden because of a stalled observer.
    const fallback = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed="true"])')
        .forEach(reveal);
    }, 1200);

    return () => {
      io?.disconnect();
      mo.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);
}