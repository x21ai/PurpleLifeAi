---
name: Footer visibility
description: SiteFooter renders on all viewports for marketing/auth routes only; the signed-in AppShell never renders it.
type: design
---
SiteFooter (`src/components/layout/site-footer.tsx`) must be visible on mobile, tablet, and desktop. Do NOT add `hidden lg:block` or any breakpoint gate to it.

It is only imported by marketing/auth routes (`/`, `/about`, `/features`, `/pricing`, `/contact`, `/sign-in`). The signed-in `AppShell` does not render it, so it disappears after sign-in automatically — that behavior is by design and should not be implemented with CSS visibility.

History: this rule was flipped on 2026-05-27 (hide on mobile/tablet) and reverted on 2026-05-30 because the marketing site needs the footer on every viewport.