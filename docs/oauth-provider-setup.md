# OAuth provider setup (Apple + Google)

**Project ref:** `xxnzmfzsjplrutrgbzxy`  
**Branded callback URL (use this):** `https://auth.purplelife.org/auth/v1/callback`  
**Fallback callback URL:** `https://xxnzmfzsjplrutrgbzxy.supabase.co/auth/v1/callback`  
**Paste credentials:** https://supabase.com/dashboard/project/xxnzmfzsjplrutrgbzxy/auth/providers  

The supabase-js client uses `VITE_SUPABASE_URL = https://auth.purplelife.org` (the
Supabase custom domain), so `signInWithOAuth` sends users to that host and the Google
consent screen shows `auth.purplelife.org` instead of the `*.supabase.co` project URL.
Keep both redirect URIs registered: the branded one is what the client uses, the
`*.supabase.co` one is the rollback path if the client URL is reverted.

**Time:** ~15 min Google, ~25 min Apple (includes .p8 key download).

---

## Google (~15 minutes)

1. Open [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials).
2. Select or create a project for Purple.
3. **OAuth consent screen** (if prompted): External or Internal per your org; add app name, support email, scopes `email`, `profile`, `openid`.
4. **Create credentials** → **OAuth client ID** → Application type **Web application**.
5. **Authorized JavaScript origins** (add your app URLs):
   - `http://localhost:5173` (local dev)
   - Your production origin when deployed (e.g. Cloudflare Workers URL)
6. **Authorized redirect URIs** - add both (branded first, supabase.co as fallback):
   - `https://auth.purplelife.org/auth/v1/callback`
   - `https://xxnzmfzsjplrutrgbzxy.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client secret**.
8. In Supabase: **Authentication** → **Providers** → **Google** → enable, paste Client ID and secret → Save.

---

## Apple (~25 minutes)

1. Open [Apple Developer — Identifiers](https://developer.apple.com/account/resources/identifiers/list).
2. **App ID** (if needed): register your app bundle ID for the native/web wrapper you use.
3. **Services ID** (for Sign in with Apple on web):
   - Register a Services ID, enable **Sign in with Apple**, configure **Web**.
   - **Domains and Subdomains:** your app host (e.g. `localhost` for dev is limited; use production domain for web).
   - **Return URLs:** `https://auth.purplelife.org/auth/v1/callback` (and `https://xxnzmfzsjplrutrgbzxy.supabase.co/auth/v1/callback` as fallback)
4. **Key** (.p8): Keys → create key with **Sign in with Apple** → download `.p8` once (cannot re-download).
5. Note **Team ID**, **Services ID** (client id), **Key ID**, and the `.p8` private key contents.
6. In Supabase: **Authentication** → **Providers** → **Apple** → enable:
   - Services ID (client id)
   - Secret: generate per [Supabase Apple docs](https://supabase.com/docs/guides/auth/social-login/auth-apple) using Team ID, Key ID, and .p8
7. Save.

---

## Verify in the app

1. Run `bun run dev`, open `/sign-in`.
2. Tap **Continue with Google** and **Continue with Apple**; confirm redirect returns to the app signed in.
3. If redirect fails, re-check redirect URI character-for-character against the Supabase callback URL above.

---

## Cloudflare backend (`DATA_BACKEND=cloudflare`)

When production runs on Workers JWT + D1 (not Supabase Auth), social sign-in uses
`/api/auth/oauth/{google,apple}` and callback pages at `/oauth/{google,apple}/callback`.

Worker secrets (Doppler `cursor-cloudflare` / `prd_cloudlfare`):

| Secret | Purpose |
|--------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth web client |
| `APPLE_CLIENT_ID` | Apple Services ID (prod: `org.purplelife.web`) |
| `APPLE_CLIENT_SECRET` | JWT client secret (same format Supabase used; rotate with Team ID + Key ID + `.p8`) |
| `PUBLIC_SITE_URL` | Default redirect origin (`https://www.purplelife.org`) |

**Redirect URIs to register (character-for-character):**

| Provider | Console | Redirect URI |
|----------|---------|--------------|
| Google | [Cloud Console](https://console.cloud.google.com/apis/credentials) | `https://www.purplelife.org/oauth/google/callback` |
| Google | same | `https://purplelife.org/oauth/google/callback` (apex, optional) |
| Apple | [Services ID → Sign in with Apple → Web](https://developer.apple.com/account/resources/identifiers/list/serviceId) | `https://www.purplelife.org/oauth/apple/callback` |
| Apple | same | `https://purplelife.org/oauth/apple/callback` (apex, optional) |

Supabase callback URLs above remain for rollback (`DATA_BACKEND=supabase`).

---

## Related

- PR #1 merged auth UI for Apple + Google above email.
- Provider secrets live in Supabase Dashboard (Supabase path) or Worker secrets (Cloudflare path), not in the repo.
