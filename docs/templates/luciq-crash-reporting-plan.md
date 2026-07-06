# Luciq crash reporting plan (portable)

**Attach this file to a Cursor chat and say:**

> Execute this Luciq plan for [PROJECT_NAME]. Fill placeholders from this repo, then implement.

Proven on **Purple** (`purpledrw`): SDK crashes on device, agent triage via Doppler + Cursor MCP, zero tokens committed to repo.

For TestFlight upload automation, use: `docs/templates/testflight-automation-plan.md`.

Alternative crash SDK: `docs/templates/sentry-crash-reporting-plan.md` (do not run both without migration).

---

## What Luciq covers

| Layer | Purpose |
|-------|---------|
| **SDK on device** | Capture Dart + native crashes, shake-to-report, session context |
| **Build injection** | `--dart-define=LUCIQ_APP_TOKEN=...` at compile time |
| **Agent triage** | Cursor MCP queries crash stacks after TestFlight uploads |
| **ASC gap** | ASC crash API often empty for screenshot-only tester reports; Luciq fills that |

Crashes upload on the **next app launch**, not at crash time.

---

## Architecture (do not change unless operator says so)

| Decision | Choice |
|----------|--------|
| Flutter SDK | `luciq_flutter` package |
| Token storage | **Doppler** (never commit tokens) |
| Build injection | `--dart-define=LUCIQ_APP_TOKEN=...` in iOS/Android build scripts |
| Agent dashboard access | **Luciq MCP** (`https://api.luciq.ai/api/mcp`) — not legacy REST API |
| MCP token source | Team Doppler → sync to project Doppler |

Reference implementation (Purple):

- `scripts/luciq-sync-doppler-secrets.sh` — copy OAuth token to project Doppler
- `scripts/install-luciq-mcp-cursor.sh` — wire Cursor MCP locally
- `scripts/luciq-fetch-reports.mjs` — verify creds (`ios:check-luciq`)
- `scripts/check-testflight-feedback.mjs` — ASC + Luciq combined check
- `flutter/lib/main.dart` — SDK init
- `mem/observability/crash-reporting.md` — policy and alternatives

---

## Project placeholders (agent: fill from target repo)

| Placeholder | Example (Purple) | Target project |
|-------------|------------------|----------------|
| `[PROJECT_NAME]` | Purple for Life | |
| `[APP_PLATFORM]` | `flutter` or `native-ios` or `both` | |
| `[FLUTTER_DIR]` | `flutter` | |
| `[MAIN_DART]` | `flutter/lib/main.dart` | |
| `[IOS_APPDELEGATE]` | `ios/App/AppDelegate.swift` | native only |
| `[LUCIQ_DASHBOARD_PROJECT]` | Flutter - Purple - Beta | Luciq dashboard app name |
| `[DOPPLER_PROJECT]` | `purple-life` | project runtime secrets |
| `[DOPPLER_CONFIG]` | `prd` | |
| `[LUCIQ_SOURCE_DOPPLER_PROJECT]` | `servers-teamkeys` | team keys (MCP OAuth token) |
| `[LUCIQ_SOURCE_DOPPLER_CONFIG]` | `dev` | |
| `[LUCIQ_ACCOUNT_EMAIL]` | `pmt@eatos.com` | Luciq account for MCP headers |
| `[TESTFLIGHT_BUILD_SCRIPT]` | `scripts/ios-testflight.sh` | where to inject dart-define |

---

## Phase 0 — Audit target repo (read-only, before writing)

Agent must confirm:

- [ ] Flutter vs native iOS vs both
- [ ] Existing crash SDK (Sentry, Crashlytics, etc.) — do not duplicate without operator approval
- [ ] Where iOS release builds are produced (TestFlight script, melos, GHA)
- [ ] Doppler project/config names (or plan to use GitHub Secrets for SDK token only)
- [ ] Whether `luciq_flutter` is already in `pubspec.yaml`

Report findings before implementing. If another crash SDK is active, ask operator before adding Luciq.

---

## Phase 1 — One-time human setup (operator, browser)

Agent **cannot** create Luciq apps or copy dashboard tokens from the Luciq UI automatically.

### 1.1 Luciq dashboard

1. Log in to Luciq dashboard (https://luciq.ai or existing Instabug account).
2. Create app (or select existing): **`[LUCIQ_DASHBOARD_PROJECT]`**
3. Copy **SDK app token** (app settings → SDK integration).
4. Copy **API / OAuth token** for MCP (team settings or API keys — same token Purple uses as `LUCIQ_OAUTH_TOKEN`).

### 1.2 Store secrets in Doppler

**Project runtime** (`[DOPPLER_PROJECT]` / `[DOPPLER_CONFIG]`):

```bash
doppler secrets set \
  LUCIQ_APP_TOKEN="your-sdk-app-token" \
  LUCIQ_ACCOUNT_EMAIL="[LUCIQ_ACCOUNT_EMAIL]" \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]
```

**Team source** (if using sync pattern):

```bash
doppler secrets set LUCIQ_OAUTH_TOKEN="your-mcp-api-token" \
  --project [LUCIQ_SOURCE_DOPPLER_PROJECT] --config [LUCIQ_SOURCE_DOPPLER_CONFIG]
```

Then sync to project:

```bash
bun run luciq:sync-secrets
```

**GitHub Actions only** (if no Doppler on CI):

| Secret | Value |
|--------|-------|
| `LUCIQ_APP_TOKEN` | SDK app token |
| `LUCIQ_ACCOUNT_EMAIL` | Luciq account email |
| `LUCIQ_API_TOKEN` | MCP/API token |

Never commit token values to the repo.

### 1.3 Tell agent

> Luciq tokens are in Doppler [or GitHub Secrets]. Continue Luciq implementation.

---

## Phase 2 — SDK integration (agent implements)

### 2.1 Flutter dependency

In `[FLUTTER_DIR]/pubspec.yaml`:

```yaml
dependencies:
  luciq_flutter: ^19.8.0   # match Purple or latest stable
```

Run `flutter pub get`.

### 2.2 Initialize in app

In `[MAIN_DART]`, before `runApp`:

```dart
import 'package:luciq_flutter/luciq_flutter.dart';

const luciqToken = String.fromEnvironment('LUCIQ_APP_TOKEN');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (luciqToken.isNotEmpty) {
    await Luciq.init(
      token: luciqToken,
      invocationEvents: [InvocationEvent.shake, InvocationEvent.screenshot],
    );
  }
  runApp(const MyApp());
}
```

Adapt invocation events to project needs. Do not hardcode the token in source.

### 2.3 Native iOS only (if not using Flutter plugin)

If `[APP_PLATFORM]` is native Capacitor/Swift without Flutter:

- Add Luciq iOS SDK via SPM: `https://github.com/luciqai/luciq-ios-sdk`
- Init in `[IOS_APPDELEGATE]` with token from build setting or Info.plist (injected at build time, not committed)

Copy pattern from Purple: `ios/App/App/AppDelegate.swift`.

### 2.4 Inject token at build time

Update `[TESTFLIGHT_BUILD_SCRIPT]` (and local device build script if applicable):

```bash
LUCIQ_TOKEN=""
if LUCIQ_TOKEN="$(doppler secrets get LUCIQ_APP_TOKEN \
  --project "[DOPPLER_PROJECT]" --config "[DOPPLER_CONFIG]" --plain 2>/dev/null)"; then
  log "Luciq SDK token loaded"
else
  log "WARN: LUCIQ_APP_TOKEN missing; build ships without Luciq"
fi

flutter build ios --release --no-codesign \
  --dart-define=LUCIQ_APP_TOKEN="${LUCIQ_TOKEN}" \
  ...other dart-defines...
```

For GitHub Actions, pass `secrets.LUCIQ_APP_TOKEN` the same way.

### 2.5 Android (optional)

If project ships Android betas:

```bash
flutter build appbundle --release \
  --dart-define=LUCIQ_APP_TOKEN="${LUCIQ_TOKEN}"
```

Same token, same dashboard project (or separate Luciq app per platform if operator prefers).

---

## Phase 3 — Agent automation scripts (agent implements)

Copy from Purple and adapt Doppler project names.

### 3.1 `scripts/luciq-sync-doppler-secrets.sh`

Copies `LUCIQ_OAUTH_TOKEN` from team Doppler → `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` on project Doppler. Never prints secret values.

Wire:

```json
"luciq:sync-secrets": "bash scripts/luciq-sync-doppler-secrets.sh"
```

### 3.2 `scripts/install-luciq-mcp-cursor.sh`

Merges Luciq HTTP MCP into `~/.cursor/mcp.json`:

- URL: `https://api.luciq.ai/api/mcp`
- Headers: `Email`, `Token` (from Doppler)

Wire:

```json
"luciq:install-mcp": "bash scripts/install-luciq-mcp-cursor.sh"
```

Operator must **restart Cursor** after install.

### 3.3 `scripts/luciq-fetch-reports.mjs` (or `check-luciq.sh`)

Verify creds without printing tokens. Output JSON:

```json
{
  "dashboardApiConfigured": true,
  "status": "mcp",
  "project": "[LUCIQ_DASHBOARD_PROJECT]"
}
```

Note: MCP OAuth token often returns 401 on legacy REST `dashboard-api.instabug.com`. That is expected; use MCP for stacks.

Wire:

```json
"ios:check-luciq": "doppler run --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG] -- node scripts/luciq-fetch-reports.mjs"
```

### 3.4 Optional: combined TestFlight feedback check

`scripts/check-testflight-feedback.mjs` — ASC screenshot/crash submissions + Luciq cred hint.

Wire:

```json
"ios:check-tf-feedback": "doppler run --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG] -- node scripts/check-testflight-feedback.mjs"
```

---

## Phase 4 — Verification (agent runs before claiming done)

| Step | Command | Pass |
|------|---------|------|
| Sync secrets | `bun run luciq:sync-secrets` | Exit 0 |
| Creds check | `bun run ios:check-luciq -- --json` | `dashboardApiConfigured: true` |
| MCP install | `bun run luciq:install-mcp` | Entry in `~/.cursor/mcp.json` (restart Cursor) |
| Build includes token | Inspect testflight script logs | "Luciq SDK token loaded" |
| Device crash | Install TF build, force crash, relaunch app | Crash appears in Luciq dashboard (manual or MCP query) |

Agent can verify creds and build wiring without a physical device. Full crash capture requires a TestFlight or device install.

---

## Agent runbook (after each TestFlight upload)

Run in order:

```bash
bun run luciq:sync-secrets          # if MCP token may have rotated
bun run ios:check-luciq -- --json   # creds OK
bun run ios:check-tf-feedback       # ASC + Luciq hint (if script exists)
```

In Cursor with Luciq MCP connected, query **`[LUCIQ_DASHBOARD_PROJECT]`** for recent crashes (tools: `list_crashes`, `list_occurrences_tokens`, etc.).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty Luciq dashboard after crash | Crashes send on **next launch**; tester must reopen app |
| `LUCIQ_APP_TOKEN missing` in build log | Add secret to Doppler; rebuild |
| MCP 401 / `status: mcp` only | Expected for legacy REST; use Luciq MCP in Cursor, not REST |
| Duplicate crash SDKs | Do not run Luciq + Sentry + Crashlytics without migration plan |
| Token in repo | Remove immediately; rotate token in Luciq dashboard |
| Flutter init silent no-op | `String.fromEnvironment` empty means dart-define not passed at build |

---

## What stays manual

- Creating Luciq app and copying SDK token (dashboard UI)
- First MCP install + Cursor restart per machine
- Confirming crash appears in dashboard (requires device/TestFlight)

---

## Implementation checklist (agent todos)

- [ ] **audit** — Platform (Flutter/native), existing crash SDKs, build script paths
- [ ] **pubspec** — Add `luciq_flutter` if Flutter
- [ ] **init** — SDK init in `main.dart` or AppDelegate (token from environment only)
- [ ] **build-inject** — `--dart-define=LUCIQ_APP_TOKEN` in TestFlight + device build scripts
- [ ] **sync-script** — `scripts/luciq-sync-doppler-secrets.sh` + `luciq:sync-secrets`
- [ ] **mcp-script** — `scripts/install-luciq-mcp-cursor.sh` + `luciq:install-mcp`
- [ ] **check-script** — `scripts/luciq-fetch-reports.mjs` + `ios:check-luciq`
- [ ] **tf-feedback** — Optional combined ASC + Luciq check script
- [ ] **docs** — Project runbook section: dashboard name, secret names, verify commands
- [ ] **verify** — Run sync + check-luciq; confirm build script loads token

---

## Operator trigger phrase

After storing Luciq tokens:

> Luciq tokens are in Doppler `[DOPPLER_PROJECT]/[DOPPLER_CONFIG]`. Execute the Luciq crash reporting plan. Platform is `[flutter|native|both]`. Dashboard project is `[LUCIQ_DASHBOARD_PROJECT]`. Wire into `[TESTFLIGHT_BUILD_SCRIPT]`. Run verification.

---

## Source reference (Purple)

- Runbook: `docs/testflight-setup.md` (Crash reporting section)
- Policy: `mem/observability/crash-reporting.md`
- Agent rule: `.cursor/rules/flutter-testflight-observability.mdc`
- Scripts: `scripts/luciq-sync-doppler-secrets.sh`, `scripts/install-luciq-mcp-cursor.sh`, `scripts/luciq-fetch-reports.mjs`
