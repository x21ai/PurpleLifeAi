# Hide site footer on mobile + tablet

## What you're seeing

The bottom strip with **Charter · Privacy · Terms · Contact · GitHub · © 2026 Purple…** is rendered by `src/components/layout/site-footer.tsx`. It's currently visible at every viewport. On phones and tablets it duplicates information that already lives in the hamburger menu (`MobileTopBar`) and the bottom tab bar, which is why it feels noisy on those sizes.

You're right: on desktop it belongs there, on mobile and tablet it doesn't.

## Fix

One-line change in `src/components/layout/site-footer.tsx`: add `hidden lg:block` to the `<footer>` root. That hides it below the `lg` (1024 px) breakpoint — so phones and tablets (including iPad portrait at 768 px and iPad landscape at 1024 px–1px) no longer see it, while desktop keeps it.

This covers every place the footer renders today:
- Marketing: `/`, `/about`, `/features`, `/pricing`, `/contact`, `/sign-in`
- Anywhere else it gets used in future

## About `/welcome` specifically

The onboarding page (`src/routes/_app/welcome.tsx`) does **not** import `SiteFooter`, and neither does `AppShell`. If you're still seeing the footer there after this change, it's a stale preview/service-worker cache — a hard refresh (or unregistering the SW from DevTools → Application) will clear it. The fix above guarantees the footer can never appear on tablet/mobile regardless.

## Out of scope

No changes to the bottom tab bar, mobile top bar, or sidebar — only the marketing/legal footer strip.
