## Changes

### 1. Footer visible on all viewports for marketing pages
- `src/components/layout/site-footer.tsx` — remove `hidden lg:block` so the footer renders on mobile, tablet, and desktop.
- The signed-in `AppShell` does not render `SiteFooter`, so it stays hidden after sign-in automatically. No app-shell changes needed.
- `tests/e2e/theme-footer.spec.ts` — update assertion to expect the footer visible at every viewport.

### 2. Charter page — real content, no founder name
Replace the "Coming soon" placeholder in `src/routes/_app/charter.tsx` with the founding charter, styled to match the existing layout (eyebrow → serif headline → body-serif sections):

- **Why Purple exists** — for people managing epilepsy and other pattern-driven conditions; named after the global epilepsy awareness color.
- **The promises we won't break**
  1. Free forever for individuals
  2. Open source (Apache 2.0)
  3. No ads. Ever.
  4. We never sell your data
  5. Your data is yours — full export, full delete, anytime
  6. Conversation-first, not form-first
  7. Condition-aware, not condition-locked
  8. Not a medical device — supports you, doesn't replace your clinician
- **What we will never do** — dark patterns, lock-in, behavioral ads, data brokers, paywalled core journaling.

No author/signature line.

### 3. Save the rule as memory
- `mem://design/footer-visibility` — "SiteFooter renders on all viewports for marketing/auth routes only; the signed-in AppShell never renders it."
- Update `mem://index.md` to reference it.

### Files touched
- `src/components/layout/site-footer.tsx`
- `tests/e2e/theme-footer.spec.ts`
- `src/routes/_app/charter.tsx`
- `mem://index.md`
- `mem://design/footer-visibility`
