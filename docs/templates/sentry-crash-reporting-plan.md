# Sentry crash reporting plan (portable)

**Attach this file to a Cursor chat and say:**

> Execute this Sentry plan for [PROJECT_NAME]. Fill placeholders from this repo, then implement.

Same zero-intervention pattern as Luciq: secrets in Doppler (or GitHub Secrets), token injected at build time, agent triage via API/MCP. **Do not run Sentry + Luciq + Crashlytics together** without an explicit migration plan.

For TestFlight upload automation, use: `docs/templates/testflight-automation-plan.md`.

---

## Luciq vs Sentry (pick one primary)

| | Luciq | Sentry |
|---|-------|--------|
| **Best for** | In-app shake/screenshot feedback, tester UX | Error tracking, release health, cross-platform (web + mobile + backend) |
| **Flutter package** | `luciq_flutter` | `sentry_flutter` + `sentry_dart_plugin` |
| **Device secret** | `LUCIQ_APP_TOKEN` (SDK app token) | `SENTRY_DSN` (project DSN) |
| **Upload secret** | None (SDK only) | `SENTRY_AUTH_TOKEN` (source maps / dSYM upload in CI) |
| **Symbolication** | Luciq handles | Requires `sentry_dart_plugin` or `sentry-cli upload-dif` |
| **Agent triage** | Luciq MCP | **Sentry MCP** (Cursor) or Sentry REST API |
| **Cost** | Paid (existing eatOS/Purple accounts) | Free tier ~5k errors/mo; paid for volume |
| **HIPAA / health data** | Review vendor BAA | Review vendor BAA; scrub PII in `beforeSend` |

Purple today: **Luciq on Flutter iOS**, Sentry only as an optional **web** hook (`window.Sentry` in `src/lib/observability/client-errors.ts`). Mobile Sentry is not wired yet.

---

## Architecture (do not change unless operator says so)

| Decision | Choice |
|----------|--------|
| Flutter SDK | `sentry_flutter` + `sentry_dart_plugin` (symbol upload) |
| DSN storage | **Doppler** or **GitHub Secrets** (never commit) |
| Build injection | `--dart-define=SENTRY_DSN=...` (+ optional `SENTRY_ENV`, `SENTRY_RELEASE`) |
| Symbol upload | `sentry_dart_plugin` in `pubspec.yaml` + `SENTRY_AUTH_TOKEN` at build |
| Agent triage | **Sentry MCP** in Cursor (authenticate once) or REST API |
| PII | Strip health/journal fields in `beforeSend` / `beforeBreadcrumb` |

---

## Project placeholders (agent: fill from target repo)

| Placeholder | Example | Target project |
|-------------|---------|----------------|
| `[PROJECT_NAME]` | eatOS POS | |
| `[SENTRY_ORG]` | eigital | Sentry org slug |
| `[SENTRY_PROJECT]` | eatos-pos-ios | Sentry project slug |
| `[SENTRY_DSN]` | `https://xxx@o123.ingest.sentry.io/456` | from project settings |
| `[APP_PLATFORM]` | `flutter` / `web` / `both` | |
| `[FLUTTER_DIR]` | `eatOS` or `flutter` | |
| `[MAIN_DART]` | `lib/main.dart` | |
| `[DOPPLER_PROJECT]` | `eatos` | |
| `[DOPPLER_CONFIG]` | `prd` | |
| `[TESTFLIGHT_BUILD_SCRIPT]` | `scripts/ios-testflight.sh` | |
| `[ENVIRONMENT]` | `staging` / `production` | maps to Sentry environment tag |

---

## Phase 0 — Audit (read-only)

- [ ] Existing crash SDK (Luciq, Crashlytics)? **Stop and ask operator** before adding Sentry.
- [ ] Flutter vs web vs both
- [ ] Where release builds run (local script, GHA, melos)
- [ ] Doppler or GitHub Secrets backend

---

## Phase 1 — One-time human setup (operator, browser)

### 1.1 Sentry project

1. Sentry.io → create org (or use existing) → **Create Project** → platform **Flutter**.
2. Copy **DSN** (Settings → Projects → `[SENTRY_PROJECT]` → Client Keys).
3. Create **Auth Token** (Settings → Auth Tokens):
   - Scopes: `project:releases`, `org:read` (add `project:write` if plugin needs it)
   - Store as `SENTRY_AUTH_TOKEN` (never commit)

### 1.2 Store secrets

**Doppler:**

```bash
doppler secrets set \
  SENTRY_DSN="https://xxx@o123.ingest.sentry.io/456" \
  SENTRY_AUTH_TOKEN="sntrys_..." \
  SENTRY_ORG="[SENTRY_ORG]" \
  SENTRY_PROJECT="[SENTRY_PROJECT]" \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]
```

**GitHub Actions:**

| Secret | Value |
|--------|-------|
| `SENTRY_DSN` | Project DSN |
| `SENTRY_AUTH_TOKEN` | Auth token for symbol upload |
| `SENTRY_ORG` | Org slug |
| `SENTRY_PROJECT` | Project slug |

### 1.3 Tell agent

> Sentry secrets are in Doppler [or GitHub]. Continue Sentry implementation.

---

## Phase 2 — Flutter SDK (agent implements)

### 2.1 Dependencies — `[FLUTTER_DIR]/pubspec.yaml`

```yaml
dependencies:
  sentry_flutter: ^8.0.0   # use latest stable compatible with your Flutter SDK

dev_dependencies:
  sentry_dart_plugin: ^2.0.0

sentry:
  upload_debug_symbols: true
  upload_source_maps: true
  project: "[SENTRY_PROJECT]"
  org: "[SENTRY_ORG]"
  # auth_token: read from SENTRY_AUTH_TOKEN env at build time (do not hardcode)
```

Run `flutter pub get`.

### 2.2 Initialize — `[MAIN_DART]`

Use environment injection (same pattern as Luciq):

```dart
import 'package:sentry_flutter/sentry_flutter.dart';

const sentryDsn = String.fromEnvironment('SENTRY_DSN');
const sentryEnv = String.fromEnvironment('SENTRY_ENV', defaultValue: 'production');

Future<void> main() async {
  if (sentryDsn.isEmpty) {
    runApp(const MyApp());
    return;
  }

  await SentryFlutter.init(
    (options) {
      options.dsn = sentryDsn;
      options.environment = sentryEnv;
      options.tracesSampleRate = 0.2; // adjust; 0.0 to disable performance
      options.attachScreenshot = true;
      options.beforeSend = (event, hint) {
        // Strip PHI / PII before upload (required for health apps)
        return _scrubHealthFields(event);
      };
    },
    appRunner: () => runApp(const MyApp()),
  );
}

SentryEvent? _scrubHealthFields(SentryEvent event) {
  // Remove or redact sensitive contexts/extra keys
  return event;
}
```

Wrap `runApp` inside `SentryFlutter.init` so uncaught Dart errors are captured.

### 2.3 Build injection — update `[TESTFLIGHT_BUILD_SCRIPT]`

```bash
SENTRY_DSN=""
SENTRY_ENV="[ENVIRONMENT]"
SENTRY_RELEASE="${BUILD_NAME}+${BUILD_NUMBER}"   # e.g. 1.0.0+42

SENTRY_DSN="$(doppler secrets get SENTRY_DSN \
  --project "[DOPPLER_PROJECT]" --config "[DOPPLER_CONFIG]" --plain 2>/dev/null || true)"

export SENTRY_AUTH_TOKEN="$(doppler secrets get SENTRY_AUTH_TOKEN \
  --project "[DOPPLER_PROJECT]" --config "[DOPPLER_CONFIG]" --plain 2>/dev/null || true)"

flutter build ios --release --no-codesign \
  --build-number="$BUILD_NUMBER" \
  --build-name="$BUILD_NAME" \
  --dart-define=SENTRY_DSN="$SENTRY_DSN" \
  --dart-define=SENTRY_ENV="$SENTRY_ENV" \
  --dart-define=SENTRY_RELEASE="$SENTRY_RELEASE"
```

After `flutter build`, run symbol upload (if plugin does not auto-run):

```bash
dart run sentry_dart_plugin
# or: sentry-cli upload-dif --include-sources ...
```

Requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in env during build.

### 2.4 iOS dSYM

- Enable **Debug Information Format → DWARF with dSYM** for Release in Xcode.
- `sentry_dart_plugin` uploads Flutter symbols + iOS dSYM when auth token is present.
- Without symbol upload, stacks show obfuscated addresses only.

### 2.5 Web (TanStack / React) — optional same project or separate

Purple pattern (already in repo): fail-open forward to `window.Sentry` from `captureClientError`.

Full web init (separate `[SENTRY_PROJECT]` or same org):

```typescript
// src/main or __root.tsx — init only when DSN present at build
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // scrub PHI
      return event;
    },
  });
}
```

Bake `VITE_SENTRY_DSN` via Doppler at `bun run build:prod` (same as other `VITE_*`).

### 2.6 Backend / Worker (optional)

Cloudflare Worker: `@sentry/cloudflare` or manual fetch to Sentry envelope API. Store DSN in Worker secrets via Doppler → wrangler.

---

## Phase 3 — Agent automation scripts (agent implements)

### 3.1 `scripts/check-sentry-secrets.sh`

Verify `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` exist. Never print values.

```json
"sentry:check-secrets": "bash scripts/check-sentry-secrets.sh"
```

### 3.2 `scripts/sentry-list-issues.mjs`

Query Sentry REST API for recent unresolved issues (uses `SENTRY_AUTH_TOKEN` from Doppler):

```
GET https://sentry.io/api/0/projects/{org}/{project}/issues/?query=is:unresolved
```

Wire:

```json
"sentry:list-issues": "doppler run --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG] -- node scripts/sentry-list-issues.mjs"
```

### 3.3 Cursor Sentry MCP (agent triage)

1. Enable **Sentry MCP** in Cursor (Settings → MCP → Sentry).
2. Authenticate when prompted (OAuth to Sentry org).
3. Agent queries issues, stack traces, releases without pasting tokens into repo.

Prefer MCP over custom REST scripts when available.

### 3.4 Combined post-TestFlight check (optional)

Extend TestFlight feedback script or add `scripts/check-tf-observability.sh`:

```bash
bun run ios:check-asc-builds    # ASC VALID
bun run sentry:list-issues      # recent unresolved
# or use Sentry MCP in Cursor
```

---

## Phase 4 — Verification

| Step | Command / action | Pass |
|------|------------------|------|
| Secrets | `bun run sentry:check-secrets` | All present |
| Build log | TestFlight script | DSN loaded, symbol upload OK |
| Test error | `Sentry.captureException(Exception('sentry smoke test'))` in debug build | Issue in Sentry dashboard |
| Native crash | TF build, force crash, relaunch | Issue with symbolicated stack (after dSYM upload) |
| Agent | Sentry MCP or `sentry:list-issues` | Can list project issues |
| PII scrub | Inspect event payload in Sentry | No raw health/journal text |

Crashes may appear within seconds (unlike Luciq next-launch behavior).

---

## Migration from Luciq (if replacing)

1. Operator approves single-vendor policy.
2. Remove `luciq_flutter` init and `--dart-define=LUCIQ_APP_TOKEN` from build scripts.
3. Add Sentry per this plan.
4. One TestFlight build with Sentry only; confirm crashes in Sentry before removing Luciq dashboard access.

Do **not** ship both SDKs to production without approval (duplicate reports, double battery/network).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Obfuscated stacks | Run `sentry_dart_plugin` / upload dSYM; check `SENTRY_AUTH_TOKEN` scopes |
| No events | Empty `SENTRY_DSN` dart-define; verify DSN in build log (not value, just "loaded") |
| 403 on symbol upload | Auth token needs `project:releases` |
| Events blocked | Ad blocker on web; iOS needs network permission |
| PHI in Sentry | Fix `beforeSend`; delete issue; rotate if leaked |
| Duplicate with Luciq | Migration incomplete; remove one SDK |

---

## Implementation checklist (agent todos)

- [ ] **audit** — Confirm no conflicting crash SDK; pick web/mobile scope
- [ ] **sentry-project** — Document org/project slugs (operator creates in UI)
- [ ] **pubspec** — `sentry_flutter` + `sentry_dart_plugin` + `sentry:` config block
- [ ] **init** — `SentryFlutter.init` in `main.dart` with `beforeSend` scrubber
- [ ] **build-inject** — `--dart-define=SENTRY_DSN` + env for auth token in TestFlight script
- [ ] **symbol-upload** — Plugin or sentry-cli step in CI/local build
- [ ] **check-secrets** — `scripts/check-sentry-secrets.sh`
- [ ] **list-issues** — Optional REST script for agent
- [ ] **mcp** — Document Sentry MCP auth for Cursor
- [ ] **web** — Optional `@sentry/react` + `VITE_SENTRY_DSN` (if web in scope)
- [ ] **docs** — Runbook: secret names, verify commands, PII policy
- [ ] **verify** — Smoke test exception + symbolicated stack on TF build

---

## Operator trigger phrase

> Sentry secrets are in Doppler `[DOPPLER_PROJECT]/[DOPPLER_CONFIG]`. Execute the Sentry crash reporting plan. Org `[SENTRY_ORG]`, project `[SENTRY_PROJECT]`, platform `[flutter|web|both]`. Replace Luciq: `[yes|no]`. Run verification.

---

## Source reference (Purple)

- Policy comparison: `mem/observability/crash-reporting.md`
- Web fail-open hook: `src/lib/observability/client-errors.ts` (forwards to `window.Sentry` when present)
- Luciq counterpart: `docs/templates/luciq-crash-reporting-plan.md`
