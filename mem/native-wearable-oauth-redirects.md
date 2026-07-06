---
name: Native wearable OAuth redirect URIs
description: Exact Oura and Whoop redirect URIs for native deep links and production web; register in provider developer consoles.
type: feature
---

Purple connects Oura and Whoop from Tools (`/tools`). OAuth uses different redirect
URIs on native (custom scheme) vs web (HTTPS path). These strings must match the
code exactly; trailing slashes or different hosts break token exchange.

## Canonical redirect URIs

| Provider | Native (iOS/Android/Flutter) | Web (production) |
|----------|------------------------------|--------------------|
| **Oura** | `org.purplelife.app://oauth-oura-callback` | `https://www.purplelife.org/oauth/oura/callback` |
| **Whoop** | `org.purplelife.app://oauth-whoop-callback` | `https://www.purplelife.org/oauth/whoop/callback` |

## Where they are enforced in code

| Surface | Location |
|---------|----------|
| Capacitor web shell | `src/lib/native/wearable-oauth.ts` (`NATIVE_REDIRECT`) |
| TanStack web Tools | `src/components/connections/oura-connection.tsx`, `whoop-connection.tsx` |
| Flutter native + web | `flutter/lib/features/tools/wearable_oauth.dart` |
| iOS URL scheme | `flutter/ios/Runner/Info.plist`, `ios/App/App/Info.plist` |
| Android intent filters | `flutter/android/.../AndroidManifest.xml`, `android/.../AndroidManifest.xml` |

Web local dev uses `window.location.origin + "/oauth/{oura,whoop}/callback"` (e.g.
`http://localhost:8080/oauth/oura/callback`). Only register staging/local URLs in
provider consoles when actively testing; production web URIs above are required for
`www.purplelife.org`.


## Supabase Auth redirect allow list (Management API)

Wearable native deep links that flow through Supabase Auth (or must be accepted as
redirect targets) belong in project `xxnzmfzsjplrutrgbzxy` → **Authentication → URL
configuration** field `uri_allow_list` (comma-separated).

| URI | In allow list |
|-----|----------------|
| `org.purplelife.app://auth-callback` | yes |
| `org.purplelife.app://reset-password` | yes |
| `org.purplelife.app://oauth-oura-callback` | add if native Oura uses Auth redirects |
| `org.purplelife.app://oauth-whoop-callback` | **yes (added 2026-07-06 via PATCH `/v1/projects/{ref}/config/auth`)** |

Ops: `GET` then `PATCH` with Doppler `cursor-cloudflare` / `prd_cloudlfare`
`SUPABASE_PERSONAL_TOKEN`. Append only; do not drop existing entries.

## Provider developer consoles (manual)

There is no API to register redirects. Owner must add both native and web URIs in
each provider app:

- **Oura:** [Oura Cloud developer portal](https://cloud.ouraring.com/) → your app → Redirect URIs
- **Whoop:** [Whoop Developer Portal](https://developer.whoop.com/) → your app → Redirect URIs

**Oura native URI registered 2026-07-06** (authorize probe: 302 vs 400 for bad URI).
**Whoop native URI** is on the Supabase Auth allow list (2026-07-06). **Whoop Developer Portal**
redirect registration is still a **manual owner step** (no API): add
`org.purplelife.app://oauth-whoop-callback` and `https://www.purplelife.org/oauth/whoop/callback`
in the portal (`docs/OPEN-ISSUES.md`).

## Exchange path (not redirect URIs)

- **Oura:** authorization code exchanged via Supabase Edge Function `oura-sync`
- **Whoop:** authorization code exchanged via Worker `/api/health/whoop-config` and
  `whoop-exchange` (`docs/DECISIONS.md` 2026-07-04)

Supabase Auth redirect URLs are separate from wearable OAuth:

| Flow | Native URI | Doc |
|------|------------|-----|
| Google/Apple sign-in | `org.purplelife.app://auth-callback` | `docs/native-oauth-setup.md` |
| Password recovery | `org.purplelife.app://reset-password` | `mem/auth-password-reset.md` |

Both scheme hosts must be in the Supabase Auth redirect allow list.
