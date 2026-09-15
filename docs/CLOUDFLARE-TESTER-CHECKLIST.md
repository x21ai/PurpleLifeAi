# Cloudflare tester checklist

Production target: **100% Cloudflare** (`DATA_BACKEND=cloudflare`) with Supabase kept as rollback only.

## URLs

| Environment | URL |
|-------------|-----|
| Production | https://www.purplelife.org |
| Sign in | https://www.purplelife.org/sign-in |

## Deploy (operator)

```bash
# 1. Worker secrets (Doppler cursor-cloudflare / prd_cloudlfare)
#    DATA_BACKEND=cloudflare
#    AUTH_JWT_SECRET=<random 32+ bytes>
#    IMPORT_ADMIN_SECRET=<random>  # remove after tester passwords set
#    GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  # Google OAuth
#    APPLE_CLIENT_ID / APPLE_CLIENT_SECRET    # Apple Sign In (Services ID + JWT secret)
#    PUBLIC_SITE_URL=https://www.purplelife.org

# 2. Build with Cloudflare client flag baked in
bun run build:prod

# 3. Deploy Worker (bindings in wrangler.deploy.jsonc)
bunx wrangler deploy -c wrangler.deploy.jsonc

# 4. Set tester passwords (once)
IMPORT_ADMIN_SECRET=... PUBLIC_SITE_URL=https://www.purplelife.org \
  node scripts/cloudflare/set-tester-passwords.mjs 'ChooseAStrongPassword!'
```

## Tester accounts

| Email | Notes |
|-------|-------|
| pmt@eigital.com | Founding team |
| samuelc1@yahoo.com | Beta tester |
| devynrosewalker@gmail.com | Beta tester |

Sign in at `/sign-in` with email + password after operator runs `set-tester-passwords.mjs`.

Google and Apple sign-in work when the matching OAuth secrets are set on the Worker.
Redirect URIs must be registered in each provider console (see PR tester notes).

## What to test (core flows)

1. **Sign in** with email/password (or Google if configured)
2. **Today** loads biometrics and med doses (D1: `biometrics`, `medication_doses`)
3. **Journal** list + new entry (text; photo optional via R2)
4. **Meds** today list + mark taken
5. **Account / profile** shows name and timezone
6. **Reports** open if user has report documents (R2 `reports` bucket)

## Report data loss

If counts, history, or files look wrong:

1. Note account email, route, and screenshot
2. Post in team channel or `/contact`
3. **Rollback:** set Worker secret `DATA_BACKEND=supabase`, redeploy previous build (`bun run build:prod:supabase` + deploy). Supabase project `xxnzmfzsjplrutrgbzxy` stays live unchanged.

## Rollback (one env flip)

```bash
# Worker secret only — no code revert required if build supports both backends
DATA_BACKEND=supabase
bun run build:prod:supabase && bunx wrangler deploy -c wrangler.deploy.jsonc
```
