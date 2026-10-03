# Flutter Ploy auth chrome

**Status:** active (2026-10-03). Build `1.0.0+33`. Not uploaded.

Flutter sign-in matches the live Ploy page at www `/sign-in`:

- Source: `ploy-staging/src/components/staging/staging-live-sign-in.tsx`
- Shield: `PrivacyShield` in `ploy-staging/src/components/pages/pilot/components/mobile-graphics.tsx`
- Tokens: `.purplelife-pilot` in `ploy-staging/src/styles/globals.css`
- Flutter: `flutter/lib/features/auth/ploy_access_chrome.dart`

Production copy is "Sign in to PurpleLife." on a light canvas with a white card.
Do not port `src/routes/sign-in.tsx` ("Welcome back!"). That TanStack screen is obsolete.

Password sign-in stays Worker JWT: `DATA_BACKEND=cloudflare`, `POST /api/auth/sign-in`.
Reset password and welcome onboarding share this chrome.

**2026-10-03 follow-up:** The signed-in app uses the same `.purplelife-pilot`
palette. `flutter/lib/design/ploy_colors.dart` and both `design/tokens.json`
color buckets are that light set. Do not put Today, Meds, or Journal back on
the dark canvas. Pilot page layouts (WellbeingBloom, Today / Journal / Browse
tabs) were not copied one-for-one; Flutter keeps its data screens on these tokens.
