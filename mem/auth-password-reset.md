---
name: Auth password reset and recovery deep links
description: Supabase recovery email flows, PKCE bootstrap on web, native reset-password deep link, and migration-era accounts without password hashes.
type: feature
---

Password reset uses Supabase Auth recovery emails. Web and native use different
`redirectTo` targets; both must appear in the Supabase project redirect allow
list. Wearable OAuth redirects are unrelated; see `mem/native-wearable-oauth-redirects.md`.

## Canonical redirect URIs

| Surface | `redirectTo` | Registered in Supabase |
|---------|--------------|------------------------|
| **Web** (`sign-in.tsx`, TanStack) | `https://www.purplelife.org/reset-password` (or `window.location.origin + "/reset-password"` in dev) | Yes (site URL path) |
| **Flutter native** (iOS/Android) | `org.purplelife.app://reset-password` | **Added 2026-07-06** to Supabase Auth redirect allow list |
| **Flutter web preview** | `{siteUrl}/reset-password` (same as TanStack) | Same as web |

Local dev: `http://localhost:8080/reset-password` when testing from `bun run dev`.

## Where enforced in code

| Surface | Location |
|---------|----------|
| Web PKCE / implicit bootstrap | `src/lib/auth-recovery.ts` (`bootstrapRecoverySessionFromUrl`, `isAuthCallbackUrl`) |
| Web reset page | `src/routes/reset-password.tsx` |
| Web forgot-password send | `src/routes/sign-in.tsx` `handleForgotPassword` |
| Flutter redirect target | `flutter/lib/core/auth/auth_redirect_uris.dart` |
| Flutter native deep link handler | `flutter/lib/core/auth/auth_deep_link.dart` (`AuthDeepLinkService`, `getSessionFromUrl`) |
| Flutter reset UI | `flutter/lib/features/auth/reset_password_screen.dart` |
| Flutter forgot-password send | `flutter/lib/core/auth/auth_repository.dart` `resetPasswordForEmail` |
| Android intent filter | `flutter/android/app/src/main/AndroidManifest.xml` (`host="reset-password"`) |
| iOS URL scheme | `flutter/ios/Runner/Info.plist` (`org.purplelife.app` scheme; host routed in Dart) |

`AuthDeepLinkListener` in `flutter/lib/app.dart` binds native links for the app lifetime.

## Web fix (2026-07-06): PKCE exchange on `/reset-password`

**Symptom:** Recovery email links showed "expired" or never reached the password form,
even on a fresh send.

**Root causes:**

1. Supabase recovery emails use PKCE (`?code=`) or legacy implicit (`#access_token=`).
   `/reset-password` mounted before exchanging the code, so `updateUser({ password })`
   ran without a session.
2. Multiple recovery sends in one session invalidate earlier OTPs; only the **latest**
   email link works.

**Fix:** `bootstrapRecoverySessionFromUrl()` in `src/lib/auth-recovery.ts`:

- Parses `error_code` / `error_description` from query or hash (surfaces `otp_expired`).
- Calls `supabase.auth.exchangeCodeForSession(window.location.href)` when `?code=` is present.
- Polls `getSession()` briefly for implicit hash tokens.
- Returns `{ ok, expired, message }` for the reset page UI.

`reset-password.tsx` calls this on mount before showing the new-password form.

## Native fix (2026-07-06, uncommitted until TF21)

Flutter sends recovery emails with `redirectTo: org.purplelife.app://reset-password`.
`AuthDeepLinkService` listens via `app_links`, calls `getSessionFromUrl(uri)`, then
routes to `/reset-password`. On failure, routes to sign-in with `?reset=expired`.

**TestFlight:** shipped build **1.0 (20)** does **not** include this code. Device
verification requires **TF21+** upload after the auth-reset slice lands and passes
gates. Supabase allow list is already updated; no dashboard change needed for TF21.

## Migration note: accounts without password hashes

Some users imported via Admin API (`purple-migration/import-auth.mjs`) retained
UUID and profile data but **no `encrypted_password`** in `auth.users`. They cannot
sign in with email/password until a password is set.

**Example (2026-07-06):** `pmt@eigital.com` (primary live-data QA account per
`docs/FLUTTER-STAGE1-SIGNOFF.md`). Ops set a **temporary password via Supabase Admin
API** (`auth.admin.updateUserById`). The value is **not** stored in repo, docs, or
chat; retrieve or rotate only through Supabase dashboard or Admin API with Doppler
`SERVICE_ROLE_KEY`. User should change password after first sign-in or via reset email.

## Verify

**Web (prod or local):**

```bash
bun run dev   # or test against www.purplelife.org after deploy
# Sign-in → forgot password → open latest email only → /reset-password form loads → update succeeds
```

**Flutter web (`:8765`):**

```bash
./scripts/flutter-web-serve.sh --rebuild
# Forgot password on sign-in → email link → /reset-password (hash route)
```

**Flutter native (TF21+):**

1. App installed from TestFlight build including `auth_deep_link.dart`.
2. Trigger reset from Flutter sign-in or web; open email on device.
3. Link opens app → reset screen → password update → sign-in with new password.

**Supabase dashboard:** Authentication → URL Configuration → Redirect URLs includes
`org.purplelife.app://reset-password` and production `/reset-password` path.
