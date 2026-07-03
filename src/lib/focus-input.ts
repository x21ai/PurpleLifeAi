/**
 * Focus an input on iOS PWAs where a single focus() call is often ignored until
 * the sheet animation finishes. Uses preventScroll to avoid viewport jumps.
 */
export function focusInput(el: HTMLElement | null | undefined, delayMs = 0): void {
  if (!el) return;
  const run = () => {
    el.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
    });
  };
  if (delayMs > 0) window.setTimeout(run, delayMs);
  else run();
}
