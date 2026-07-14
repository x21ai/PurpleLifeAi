# Doppler: Purple Life native secrets (x21)

**2026-07-14:** Purple Life iOS / Luciq / ASC secrets moved from Doppler project
`purple-life` to **`x21`** (config **`prd`**). Secret names use the **`PURPLE_LIFE_`**
prefix.

## Location

| Scope | Doppler project | Config |
|-------|---------------|--------|
| Purple native iOS (ASC, team, Luciq SDK) | `x21` | `prd` |
| Web / Worker / Supabase (unchanged) | `cursor-cloudflare` | `prd_cloudlfare` |
| Luciq MCP source token (unchanged) | `servers-teamkeys` | `dev` |

## Secret names (x21/prd)

| Secret | Purpose |
|--------|---------|
| `PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID` | ASC API Key ID |
| `PURPLE_LIFE_APP_STORE_CONNECT_ISSUER_ID` | ASC issuer UUID |
| `PURPLE_LIFE_APP_STORE_CONNECT_API_KEY` | Full `.p8` PEM contents |
| `PURPLE_LIFE_DEVELOPMENT_TEAM` | Apple team ID (`C3HY4MF66F`) |
| `PURPLE_LIFE_LUCIQ_APP_TOKEN` | Luciq SDK (TestFlight `--dart-define`) |
| `PURPLE_LIFE_LUCIQ_API_TOKEN` | Luciq dashboard/MCP runtime copy |
| `PURPLE_LIFE_LUCIQ_ACCOUNT_EMAIL` | Luciq account email |

## Repo helpers

| Path | Role |
|------|------|
| `scripts/lib/doppler-purple-life.sh` | Bash: project defaults + `purple_get_*` resolvers |
| `scripts/lib/purple-life-secrets.mjs` | Node: `readAscCredentials()`, `readLuciqSecrets()` |
| `scripts/doppler-run-purple-life.sh` | `doppler run --project x21 --config prd -- …` |

Scripts accept legacy unprefixed names in **x21/prd only** if present. The old
`purple-life` Doppler project was **deleted 2026-07-14**; verified all iOS paths
work without it.

## Commands

```bash
bun run ios:check-asc          # verify x21/prd PURPLE_LIFE_* ASC + team
bun run ios:check-luciq -- --json
bun run luciq:sync-secrets     # servers-teamkeys/dev → x21/prd
bun run ios:testflight         # uses x21/prd by default
```

## Migration note

Historical docs and HANDOFF log entries may still say `purple-life`/`prd` with
unprefixed secret names. Operational truth is **`x21`/`prd`** + **`PURPLE_LIFE_*`**
as of 2026-07-14.
