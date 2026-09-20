# OAuth + CORS audit (www.purplelife.org + Flutter)

**Date:** 2026-09-20 (Step 4)  
**Worker:** `purplelife` @ https://www.purplelife.org  
**Staging:** `purplelife-staging` @ https://staging.purplelife.org (Ploy Astro; `/api/*` proxied to prod)  
**Code:** `src/lib/oauth-allowed-origins.ts`, `src/lib/flutter-api-cors.ts`, `src/server.ts`

---

## Executive summary

| Area | Status | Notes |
|------|--------|-------|
| Worker CORS | **Hardened (PR)** | Explicit origin allowlist; no `*`; missing Flutter caregiver/chat paths added |
| Google/Apple OAuth (Cloudflare) | **Hardened (PR)** | `redirect_to` and token-exchange `redirect_uri` validated against allowlist |
| Whoop OAuth exchange | **Hardened (PR)** | `redirect_uri` validated (web + native schemes) |
| Oura OAuth exchange | **Edge function** | Still Supabase `oura-sync`; redirect enforced by Oura console + client |
| Apple Health webhook | **OK** | Server-to-server; token auth; no browser CORS |
| Flutter iOS/Android deep links | **OK in repo** | Schemes in `flutter/ios/Runner/Info.plist`, `flutter/android/.../AndroidManifest.xml` |
| Provider consoles | **Manual** | Google Cloud (pmt@x21.com), Apple Developer, Whoop portal — see checklist below |

---

## 1. CORS on `purplelife` Worker

### How it works

- Only routes in `FLUTTER_CORS_PATHS` (`src/lib/flutter-api-cors.ts`) emit CORS headers.
- Preflight `OPTIONS` is handled in `src/server.ts` before TanStack SSR (avoids HTML 404 on OPTIONS).
- Allowed `Origin` values come from `PURPLE_ALLOWED_SITE_ORIGINS` in `src/lib/oauth-allowed-origins.ts`.
- Same-origin callers (www TanStack, future Flutter-on-www cutover) do **not** need CORS.

### Allowed origins (never `*`)

| Origin | Purpose |
|--------|---------|
| `https://www.purplelife.org` | Production |
| `https://purplelife.org` | Apex (optional bookmark) |
| `https://staging.purplelife.org` | Staging OAuth/API QA if callbacks added |
| `http://localhost:8080`, `http://127.0.0.1:8080` | TanStack local dev |
| `http://localhost:8765`, `http://127.0.0.1:8765` | Flutter web preview |

### CORS-enabled API paths (Flutter web @ :8765 → www)

| Path | Flutter consumer |
|------|------------------|
| `/api/care/accept`, `/decline`, `/incoming-invites` | Care invites |
| `/api/care/today`, `/meds`, `/journal`, `/seizures`, `/reports`, `/report` | Caregiver dashboard |
| `/api/health/whoop-config`, `/whoop-exchange`, `/whoop-sync` | Whoop Tools |
| `/api/account/personal-share-code` | Account invite code |
| `/api/chat` | Ask Purple streaming |
| `/api/ai/summarize-report`, `/metric-insight`, `/daily-insight-cards` | AI insights |

**Not CORS-wrapped (by design):** `/api/data/query`, `/api/auth/*`, `/api/public/hooks/apple-health` — same-origin or non-browser.

### Verify CORS (after deploy)

```bash
BASE=https://www.purplelife.org
ORIGIN=http://127.0.0.1:8765

# Preflight (204 + Allow-Origin when origin allowed)
curl -sS -o /dev/null -w "OPTIONS care/today %{http_code}\n" \
  -X OPTIONS "$BASE/api/care/today" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization"

# Evil origin blocked (no Access-Control-Allow-Origin)
curl -sSI -X OPTIONS "$BASE/api/care/today" \
  -H "Origin: https://evil.example" \
  -H "Access-Control-Request-Method: POST" | rg -i "access-control-allow-origin" || echo "no CORS header (good)"
```

---

## 2. Social sign-in (Google + Apple)

### Production flow (`DATA_BACKEND=cloudflare`)

1. Browser → `GET /api/auth/oauth/{google|apple}?redirect_to=<allowlisted origin>`
2. Worker redirects to provider with callback `https://www.purplelife.org/oauth/{provider}/callback`
3. Client page `src/routes/oauth.*.callback.tsx` → `POST /api/auth/oauth/{provider}/callback` with `redirect_uri`
4. JWT stored in `localStorage` (`purple-cf-session`)

### Redirect URIs to register in provider consoles

| Provider | Console account | Redirect / return URI |
|----------|-----------------|------------------------|
| **Google** | Google Cloud (pmt@x21.com) | `https://www.purplelife.org/oauth/google/callback` |
| Google | same | `https://purplelife.org/oauth/google/callback` (optional apex) |
| **Apple** | Apple Developer | `https://www.purplelife.org/oauth/apple/callback` |
| Apple | same | `https://purplelife.org/oauth/apple/callback` (optional) |

**Apple Services ID:** `org.purplelife.web` (Worker secret `APPLE_CLIENT_ID`).  
**Supabase rollback URIs** (keep registered): `https://auth.purplelife.org/auth/v1/callback` — see `docs/oauth-provider-setup.md`.

### Native (Flutter + Capacitor) — still Supabase Auth path today

| URI | Platform | Register in |
|-----|----------|-------------|
| `org.purplelife.app://auth-callback` | iOS/Android | Supabase Auth redirect URLs + Info.plist / AndroidManifest (already in repo) |
| `org.purplelife.app://reset-password` | iOS/Android | Supabase Auth redirect URLs |

Google/Apple **provider** consoles do **not** get the custom scheme; Supabase redirects to the app after provider auth (`docs/native-oauth-setup.md`).

### Staging note

Ploy staging has email/password sign-in only (`/login`). Google/Apple OAuth callbacks are **not** on staging Astro. Use **www** for social sign-in QA, or add TanStack callback routes to staging later.

---

## 3. Wearables (Oura + Whoop)

Canonical URIs: `mem/native-wearable-oauth-redirects.md`

| Provider | Web (www) | Native (Flutter/Capacitor) |
|----------|-----------|----------------------------|
| Oura | `https://www.purplelife.org/oauth/oura/callback` | `org.purplelife.app://oauth-oura-callback` |
| Whoop | `https://www.purplelife.org/oauth/whoop/callback` | `org.purplelife.app://oauth-whoop-callback` |

Local web dev: `{origin}/oauth/{oura|whoop}/callback` (e.g. `http://localhost:8080/...`) — register in consoles only when testing.

### Exchange endpoints

| Provider | Exchange | Auth |
|----------|----------|------|
| Oura | Supabase Edge `oura-sync` (`action: exchange`) | Supabase session JWT |
| Whoop | Worker `POST /api/health/whoop-exchange` | Bearer (Supabase or Cloudflare JWT) |

Whoop `redirect_uri` is validated server-side against the same allowlist as native schemes + www paths.

---

## 4. Apple Health webhook

| Item | Value |
|------|-------|
| URL | `https://www.purplelife.org/api/public/hooks/apple-health?token=<secret>` |
| Auth | Per-user `webhook_secret` in `apple_health_tokens` (query param or `x-purple-token`) |
| CORS | None (Health Auto Export / server POST only) |
| GET ping | Same URL; returns `{ ok: true }` when token valid |

No provider console registration. Users copy webhook URL from Tools / Settings in-app.

---

## 5. Flutter rebuild / config checklist

No store rebuild required for CORS-only Worker changes. Rebuild Flutter when changing **deep links**, **API base URL**, or **bundle id**.

### Defaults (`flutter/lib/core/config/app_config.dart`)

| Define | Default | When to override |
|--------|---------|------------------|
| `SUPABASE_URL` | `https://auth.purplelife.org` | Rare |
| `SUPABASE_ANON_KEY` | required `--dart-define` | Doppler `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SITE_URL` | `https://www.purplelife.org` | Staging/dev only |
| `WORKER_API_BASE_URL` | `https://www.purplelife.org/api` | Point at www always for prod TF |

### TestFlight / device build example

```bash
cd flutter
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter build ipa --release \
  --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --dart-define=SITE_URL=https://www.purplelife.org \
  --dart-define=WORKER_API_BASE_URL=https://www.purplelife.org/api
```

### Deep links already in tree

- iOS: `flutter/ios/Runner/Info.plist` — scheme `org.purplelife.app`, hosts `auth-callback`, `oauth-oura-callback`, `oauth-whoop-callback`, `reset-password`
- Android: `flutter/android/app/src/main/AndroidManifest.xml` — matching intent filters
- Bundle id: `org.purplelife.app` (`flutter/lib/core/constants/app_constants.dart`)

### After URI or bundle changes

1. Register new URIs in Oura / Whoop / Supabase Auth consoles (manual)
2. `flutter test` + `flutter analyze`
3. New TestFlight build (`bun run ios:flutter-testflight` per runbook)

---

## 6. Remaining manual console steps

| Console | Owner | Action |
|---------|-------|--------|
| **Google Cloud** | pmt@x21.com | Authorized redirect URIs: `https://www.purplelife.org/oauth/google/callback` (+ apex optional). JS origins: `https://www.purplelife.org`. |
| **Apple Developer** | Owner | Services ID `org.purplelife.web` → Return URLs: `https://www.purplelife.org/oauth/apple/callback` (+ apex). Domains: `www.purplelife.org`. |
| **Whoop Developer** | Owner | Add `org.purplelife.app://oauth-whoop-callback` + `https://www.purplelife.org/oauth/whoop/callback` (`docs/OPEN-ISSUES.md` **whoop-native-redirect-console**) |
| **Oura Cloud** | Done 2026-07-06 | Native + web URIs registered |
| **Supabase Auth URL config** | Cursor/ops | Keep `org.purplelife.app://*` redirects in `uri_allow_list` for Flutter/Capacitor Supabase path |

---

## 7. Deploy (operator)

CORS/OAuth hardening ships with the **www** Worker only:

```bash
bun run check:oauth-cors
bun run build:prod
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler deploy -c wrangler.deploy.jsonc
```

**Do not** redeploy staging for this step unless merging unrelated Ploy work.

---

## 8. Evidence commands (post-deploy)

```bash
# Allowlist gate (local)
bun run check:oauth-cors

# Reject bad OAuth redirect_to (302 to www callback, not evil.com)
curl -sSI "https://www.purplelife.org/api/auth/oauth/google?redirect_to=https://evil.example" \
  | rg "location:" 

# Reject bad redirect_uri on token exchange
curl -sS -X POST https://www.purplelife.org/api/auth/oauth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"fake","redirect_uri":"https://evil.example/oauth/google/callback"}' \
  | jq .
```

Expected: Google auth URL uses `www.purplelife.org` callback when `redirect_to` is evil; token exchange returns `400 Invalid redirect_uri`.
