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
`SERVICE_ROLE_KEY`.

### Eigital / corporate quarantine path (2026-07-12+)

`@eigital.com` mailboxes often quarantine `notify.purplelife.org` recovery mail
(Resend shows sent; inbox empty). Do **not** rely on Forgot password for those accounts.

1. Ops: Admin API temp password out-of-band (same as migration no-hash case).
2. User: sign in with the temp password (TF27+ for AuthGate).
3. User: **Account → Change password** (`supabase.auth.updateUser({ password })` in
   `flutter/lib/features/account/account_screen.dart` `_PasswordSection`).
4. Optional later: IT allowlist `notify.purplelife.org`, or use a non-corporate email
   for recovery.

User should change password after first sign-in; recovery email is a backup only when
the mailbox can receive Purple auth mail.

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

## Supabase recovery TTL and token rules (project `xxnzmfzsjplrutrgbzxy`)

| Field | Default | Max | Meaning |
|-------|---------|-----|---------|
| `mailer_otp_exp` | **3600 s (1 hour)** | **86400 s (24 h)** | Recovery/magic-link OTP validity |
| `jwt_exp` | **3600 s (1 hour)** | project setting | Access token after link is exchanged |
| Send cooldown | **60 s** | — | Min interval between recovery requests per user |

Query live values:

```bash
curl -s "https://api.supabase.com/v1/projects/xxnzmfzsjplrutrgbzxy/config/auth" \
  -H "Authorization: Bearer $SUPABASE_PERSONAL_TOKEN" \
  | jq '{mailer_otp_exp, jwt_exp, rate_limit_email_sent, rate_limit_otp}'
```

### Single-use and invalidation

- Recovery links are **single-use**. Verify/exchange consumes the token.
- Each new forgot-password request **revokes earlier OTPs**; only the **latest** email works.
- Also fails when: TTL elapsed; corporate mail **link prefetch/scanners** hit the URL before the user.
- Recovery creates a session before password change; web must `exchangeCodeForSession` on `/reset-password`.

Increase TTL (optional, ops): `PATCH .../config/auth` with `{"mailer_otp_exp": 86400}` (max 24h).

## Apple policy (distinct from OTP TTL)

- **Guideline 4.8:** If the app offers Google (or other third-party) login for the primary account, it must also offer **Sign in with Apple**. Does **not** set recovery email duration.
- **Apple ID users** recover through Apple, not Purple's reset email.
- **HIG:** dedicated forgot-password flow, clear inbox confirmation, Sign in with Apple alongside Google on iOS.

## Incident patterns (2026-07-06)

| Issue | Cause | Mitigation |
|-------|-------|------------|
| Multiple sends invalidate links | Supabase token rotation | UX: use latest email only; 60s cooldown |
| `@eigital.com` Resend delivered, inbox empty | Org quarantine/spam | Allowlist `notify.purplelife.org`; check quarantine |
| Expired on first click | Old link / prefetch / PKCE not exchanged | Web bootstrap deployed; open **newest** email only |
| Native reset from email | TF20 lacks deep link code | **TF21+** with `org.purplelife.app://reset-password` |
| Email queue stuck | pg_cron `pgmq.metrics` bug | Fixed 2026-07-06 (`scripts/fix-email-pump-cron.sql`) |
| TF27 still "cannot login" with old password | AuthGate race was a different bug; migration dropped hashes | Admin temp password; not TF28 AuthGate work |
| Forgot password "does nothing" for eigital | Hook+Resend succeed; corporate quarantine | Out-of-band temp password; IT allowlist |
