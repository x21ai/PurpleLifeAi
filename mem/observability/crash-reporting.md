# Mobile crash reporting (Luciq vs alternatives)

Purple TestFlight builds use **Luciq** (formerly Instabug) for native crash capture,
session context, and shake-to-report. Token: Doppler `purple-life` / `prd`
`LUCIQ_APP_TOKEN` (SDK app token, never committed). Dashboard project:
**Flutter - Purple - Beta**.

## Do we need Luciq?

**For TestFlight beta, yes (for now).** Apple ASC crash submissions often show
**zero logs** when testers only send screenshot feedback (`tf-crash-report` in
`docs/OPEN-ISSUES.md`). Luciq captures Dart + native crashes with stack traces,
device context, and optional user reports on the next launch.

**For production at scale**, re-evaluate cost vs. needs. Luciq bundles crash +
APM + in-app feedback + session replay; Purple currently uses a subset (crashes +
shake report).

## Free / lower-cost alternatives

| Option | Cost | Pros | Cons for Purple |
|--------|------|------|-----------------|
| **Luciq** (current) | Paid (existing account) | Already wired Capacitor + Flutter iOS; shake reports; MCP for agents | Paid; API token for dashboard queries is separate from SDK token |
| **Sentry** (free tier) | Free tier ~5k errors/mo | Good Flutter/Dart SDK; source maps; self-host option | Not integrated yet; web policy avoids third-party trackers unless approved; no in-app shake UI out of the box |
| **Firebase Crashlytics** | Free | Mature iOS/Android; Google console | Requires Firebase project + FlutterFire; another vendor; no built-in tester feedback UI |
| **ASC crash API** | Free (with ASC API key) | Same pipeline as TestFlight feedback script | Often **empty** for screenshot-only reports; symbolicated logs lag; no Dart stacks |
| **Xcode Organizer / ASC Crashes** | Free | No SDK | Requires manual Xcode login; sparse for Flutter; not agent-scriptable without ASC API |

**Honest recommendation:** Keep Luciq for TF16+ while triaging `tf-crash-report`.
Add Sentry later only if Luciq cost bites or we need cross-platform (web Worker
already forwards to Sentry when `window.Sentry` exists, but product policy limits
third-party analytics). Do **not** run Luciq + Sentry + Crashlytics together without
a deliberate migration (noise and duplicate PII).

## Agent runbook (after TestFlight upload)

```bash
bun run luciq:sync-secrets      # once: copy MCP token servers-teamkeys/dev -> purple-life/prd
bun run luciq:install-mcp       # once per machine: ~/.cursor/mcp.json, restart Cursor
bun run ios:check-tf-feedback   # ASC screenshots/crashes + Luciq cred check
bun run ios:check-asc-builds    # confirm VALID build number
```

### Doppler map

| Role | Project / config | Secrets |
|------|------------------|---------|
| Source (team keys) | `servers-teamkeys` / `dev` | `LUCIQ_OAUTH_TOKEN` |
| Purple runtime | `purple-life` / `prd` | `LUCIQ_APP_TOKEN` (SDK), `LUCIQ_API_TOKEN`, `LUCIQ_ACCOUNT_EMAIL` |

### Cursor MCP (crash triage)

1. `bun run luciq:install-mcp` writes `https://api.luciq.ai/api/mcp` with Email + Token headers to `~/.cursor/mcp.json` (never commit tokens to repo).
2. Restart Cursor; verify Luciq MCP connected.
3. Query **Flutter - Purple - Beta** crashes for build 18+ (MCP tools: `list_crashes`, `list_occurrences_tokens`, etc.).

Legacy REST `ios:check-luciq` may return `status: "mcp"` (401 on dashboard-api) when using MCP OAuth token; that is expected.

See `docs/testflight-setup.md` § Crash reporting and
`.cursor/rules/flutter-testflight-observability.mdc`.
