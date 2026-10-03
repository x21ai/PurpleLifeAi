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
Reset password and welcome onboarding share this chrome. Today, Meds, and the
rest of the signed-in app stay on the dark shell until a separate reskin.
