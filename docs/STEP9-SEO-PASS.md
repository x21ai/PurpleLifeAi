# Step 9: SEO marketing pass (TanStack www)

**Scope:** Public marketing routes on the current TanStack UI at `https://www.purplelife.org`.
**Note:** This pass does not change app routes under `/_app/`. Ploy www flip is PR #47 (owner GO 2026-09-24; deploy after merge).

## Live audit (2026-09-20, pre-deploy)

Baseline captured against production before this PR ships.

| Route | Title | Meta description | OG title/url | Canonical | Notes |
|-------|-------|------------------|--------------|-----------|-------|
| `/` | Yes | Yes | Yes / Yes | Yes | JSON-LD Organization + WebSite + SoftwareApplication |
| `/about` | Yes | Yes | Yes / Yes | Yes | JSON-LD AboutPage |
| `/features` | Yes | Yes | Yes / Yes | Yes | |
| `/pricing` | Yes | Yes | Yes / Yes | Yes | JSON-LD Product + AggregateOffer |
| `/contact` | Yes | Yes | Yes / Yes | Yes | |
| `/trust` | Yes | Yes | Yes / Yes | Yes | In footer; was missing from sitemap |
| `/privacy` | Yes | Yes | Root fallback OG | **Missing** | Fixed in PR |
| `/terms` | Yes | Yes | Partial OG | **Missing** | Fixed in PR |
| `/charter` | Yes (duped about) | Yes | Root fallback OG | **Missing** | Title differentiated in PR |
| `/community` | Yes | Yes | Yes / Yes | Yes | |
| `/community/resources` | Yes | Yes | Root fallback OG | **Missing** | Fixed in PR |
| `/community/:postId` | Client-only | — | — | — | UGC; now `noindex,nofollow` |
| `/sign-in`, `/_app/*` | Minimal | — | — | — | Blocked in `robots.txt`; unchanged |

### robots.txt (live gaps)

- Sitemap URL used apex `https://purplelife.org/sitemap.xml` while canonicals use `www`.
- Missing `Disallow` for `/admin/`, `/friend/`, `/messages`, `/users`.
- `/feedback` was listed in sitemap but redirects to `/admin/feedback`.

### sitemap.xml (live gaps)

Present: `/`, `/about`, `/features`, `/pricing`, `/contact`, `/community`, `/community/resources`, `/feedback`.

Missing indexable marketing pages: `/trust`, `/charter`, `/privacy`, `/terms`.

### Shared head (root)

`src/routes/__root.tsx` sets global OG image (`/og-cover.jpg`), Twitter card, theme-color, and PWA icons. Child routes override title/description/OG url. **Gap:** per-page Twitter title/description inherited root defaults on several routes; fixed via `marketingHead()`.

## Changes in this PR

1. **`src/lib/marketing-seo.ts`** — shared helper for title, description, OG, Twitter, and canonical on marketing routes (`MARKETING_SITE_ORIGIN = https://www.purplelife.org`).
2. **Marketing routes** — `index`, `about`, `features`, `pricing`, `contact`, `trust`, `privacy`, `terms`, `charter`, `community`, `community/resources` use `marketingHead()`.
3. **`public/robots.txt`** — sitemap on `www`; block admin, friend, messages, users paths.
4. **`public/sitemap.xml`** — add trust/charter/privacy/terms; remove `/feedback` redirect.
5. **`community.$postId`** — `noindex,nofollow` for UGC detail pages (not in sitemap).
6. **`__root.tsx`** — default `og:url` for homepage fallback.

App routes (`/_app/*`), auth flows, and OAuth callbacks are **untouched**.

## Verify locally (after merge, before deploy)

```bash
bun run check:em-dash
bunx tsc --noEmit
bun run build
```

Spot-check SSR head on marketing routes (dev or built worker):

```bash
bun run dev   # http://localhost:8080
curl -s http://localhost:8080/trust | tr '>' '\n' | grep -E 'title|description|og:|canonical|twitter:'
curl -s http://localhost:8080/privacy | tr '>' '\n' | grep -E 'title|description|og:|canonical|twitter:'
curl -s http://localhost:8080/robots.txt
curl -s http://localhost:8080/sitemap.xml
```

Production smoke (operator, **after deploy only**):

```bash
curl -s https://www.purplelife.org/robots.txt
curl -s https://www.purplelife.org/sitemap.xml
for p in / /trust /privacy /terms /charter; do
  echo "=== $p ==="
  curl -s "https://www.purplelife.org$p" | tr '>' '\n' | grep -E 'canonical|og:url|twitter:title' | head -5
done
```

## Deploy note (operator)

**Do not deploy** as part of this agent run. When ready:

1. Merge PR to `main` (not #47 / no Ploy www flip).
2. Run full gates per `docs/SYNC-AND-RELEASE.md`.
3. `bun run build:prod` then manual `workflow_dispatch` deploy.
4. Re-run production smoke commands above.
5. Optional: resubmit sitemap in Google Search Console (`https://www.purplelife.org/sitemap.xml`).

## Out of scope / follow-ups

- Per-post dynamic OG titles for community threads (requires SSR title from post data).
- `hreflang` (English-only today).
- Structured data for `/features` or `/trust` (optional future pass).
- Apex → www redirect policy (DNS/Worker; canonicals already prefer `www`).
