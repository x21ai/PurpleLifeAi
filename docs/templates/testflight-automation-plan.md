# TestFlight automation plan (portable)

**Attach this file to a Cursor chat and say:**

> Execute this TestFlight plan for [PROJECT_NAME]. Fill placeholders from this repo, then implement.

Proven on **Purple** (`purpledrw`): zero Apple ID login, zero manual provisioning profiles, one human step (generate ASC API key once).

For crash reporting, use one of:
- `docs/templates/luciq-crash-reporting-plan.md` (current Purple mobile default)
- `docs/templates/sentry-crash-reporting-plan.md` (cross-platform alternative)

Android Play Store equivalent: `docs/templates/play-store-automation-plan.md`

---

## Architecture (do not change unless operator says so)

| Decision | Choice |
|----------|--------|
| Signing | **App Store Connect API key + Xcode automatic signing** |
| Upload | **`xcodebuild -exportArchive`** with ASC auth flags (no Fastlane Match, no `.p12`) |
| Apple ID in Xcode | **Never** — auth via `-authenticationKeyPath`, `-authenticationKeyID`, `-authenticationKeyIssuerID` |
| Provisioning | **Automatic** — `-allowProvisioningUpdates` + `CODE_SIGN_STYLE=Automatic` |
| Secrets store | **Doppler** (local/agent Mac) **or** **GitHub Actions Secrets** (CI) |

Reference implementation (Purple):

- `scripts/flutter-ios-testflight.sh` — full build + upload
- `scripts/check-asc-doppler.sh` — secret verification
- `scripts/ios-write-local-signing.sh` — team ID into xcconfig
- `scripts/asc-ensure-app.mjs` — create ASC app record via REST API
- `flutter/ios/ExportOptions.plist` — `app-store-connect` + `upload`
- `docs/testflight-setup.md` — runbook

---

## Project placeholders (agent: fill from target repo)

| Placeholder | Example (Purple) | Target project |
|-------------|------------------|----------------|
| `[PROJECT_NAME]` | Purple for Life | |
| `[BUNDLE_ID]` | `org.purplelife.app` | |
| `[TEAM_ID]` | `C3HY4MF66F` | |
| `[IOS_WORKSPACE]` | `flutter/ios/Runner.xcworkspace` | |
| `[IOS_SCHEME]` | `Runner` | |
| `[FLUTTER_DIR]` | `flutter` | or `.` if single-app |
| `[EXPORT_OPTIONS]` | `flutter/ios/ExportOptions-AppStore.plist` | |
| `[BUILD_NUMBER_SOURCE]` | `flutter/pubspec.yaml` `version: x.y.z+N` | or Xcode `CURRENT_PROJECT_VERSION` |
| `[SECRETS_BACKEND]` | `doppler` or `github` | |
| `[DOPPLER_PROJECT]` | `purple-life` | |
| `[DOPPLER_CONFIG]` | `prd` | |

---

## Phase 0 — Audit target repo (read-only, before writing)

Agent must confirm:

- [ ] iOS app path and scheme name
- [ ] Bundle ID for **Release** (not Debug variant)
- [ ] Whether `ExportOptions.plist` exists and its `method` (must be `app-store-connect` or `app-store` for TestFlight, not `ad-hoc`)
- [ ] Whether signing is already "Automatically manage signing" in Xcode project
- [ ] Existing CI (GitHub Actions? melos? none?)
- [ ] Latest build number in ASC vs local (must increment before upload)

Report findings in chat before implementing if anything blocks (missing bundle ID in Developer portal, ad-hoc-only export plist, etc.).

---

## Phase 1 — One-time human setup (document only; operator does in browser)

Agent **cannot** generate the ASC API key. Document these steps for the operator:

1. **Apple Developer portal:** Register `[BUNDLE_ID]` with required capabilities (Push, HealthKit, etc.).
2. **App Store Connect → Users and Access → Integrations → App Store Connect API:**
   - Generate key (role: **App Manager** or **Admin**)
   - Download `AuthKey_XXXXXX.p8` immediately (one-time)
   - Note **Key ID** (10 chars) and **Issuer ID** (UUID)
3. **Store secrets** (operator picks backend):

**Doppler:**

```bash
doppler secrets set \
  APP_STORE_CONNECT_KEY_ID="YOUR_10_CHAR_KEY_ID" \
  APP_STORE_CONNECT_ISSUER_ID="your-issuer-uuid" \
  DEVELOPMENT_TEAM="[TEAM_ID]" \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]

doppler secrets set APP_STORE_CONNECT_API_KEY="$(cat AuthKey_XXXXX.p8)" \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]
```

**GitHub Actions** (repo → Settings → Secrets):

| Secret | Value |
|--------|-------|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer UUID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | `base64 -i AuthKey_XXXXXX.p8` |
| `IOS_TEAM_ID` | `[TEAM_ID]` |

4. Tell agent: *"ASC keys are stored. Continue TestFlight implementation."*

---

## Phase 2 — Files to create (agent implements)

### 2.1 Export options — `[EXPORT_OPTIONS]`

Create if missing or replace ad-hoc config:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>destination</key>
  <string>upload</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>[TEAM_ID]</string>
  <key>uploadSymbols</key>
  <true/>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
</dict>
</plist>
```

Keep a separate ad-hoc plist for local device testing if the project already uses one.

### 2.2 Secret check — `scripts/check-asc-secrets.sh`

Verify before every upload:

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY` (or base64 variant in CI)
- `DEVELOPMENT_TEAM` / `IOS_TEAM_ID`

Exit non-zero with copy-paste fix instructions if any missing.

Copy pattern from Purple: `scripts/check-asc-doppler.sh`.

### 2.3 Local signing helper — `scripts/ios-write-local-signing.sh`

Writes generated xcconfig (do not commit):

```
DEVELOPMENT_TEAM = [TEAM_ID]
```

Target paths (adapt to project):

- `ios/LocalSigning.xcconfig`
- `[FLUTTER_DIR]/ios/Flutter/LocalSigning.xcconfig` (Flutter)

Read team from Doppler or env `DEVELOPMENT_TEAM`.

### 2.4 Upload script — `scripts/ios-testflight.sh`

**Required behavior** (match Purple `scripts/flutter-ios-testflight.sh`):

1. `set -euo pipefail`
2. Find full Xcode (`xcode-select -p`, fallback `/Applications/Xcode.app`, `Xcode-beta.app`) — Command Line Tools alone cannot archive iOS
3. Load ASC secrets → write `.p8` to temp file (`mktemp`, `chmod 600`, `trap` cleanup on exit)
4. Build auth args:
   ```bash
   ASC_AUTH_ARGS=(
     -authenticationKeyPath "${ASC_KEY_FILE}"
     -authenticationKeyID "${ASC_KEY_ID}"
     -authenticationKeyIssuerID "${ASC_ISSUER_ID}"
   )
   ```
5. Optional gates: `flutter analyze`, `flutter test` (if Flutter)
6. Run secret check script
7. Run local signing helper
8. Read build number from `[BUILD_NUMBER_SOURCE]`; fail if missing or not incremented vs last ASC upload
9. Optional: `node scripts/asc-ensure-app.mjs` (Phase 2.5)
10. **Build:**
    ```bash
    flutter pub get   # if Flutter
    flutter build ios --release --no-codesign --build-number="$BUILD_NUMBER"
    ```
11. **Archive:**
    ```bash
    xcodebuild \
      -workspace "[IOS_WORKSPACE]" \
      -scheme "[IOS_SCHEME]" \
      -configuration Release \
      -sdk iphoneos \
      -archivePath "$ARCHIVE_PATH" \
      DEVELOPMENT_TEAM="[TEAM_ID]" \
      CODE_SIGN_STYLE=Automatic \
      -allowProvisioningUpdates \
      "${ASC_AUTH_ARGS[@]}" \
      archive
    ```
12. **Upload:**
    ```bash
    xcodebuild \
      -exportArchive \
      -archivePath "$ARCHIVE_PATH" \
      -exportPath "$EXPORT_DIR" \
      -exportOptionsPlist "[EXPORT_OPTIONS]" \
      DEVELOPMENT_TEAM="[TEAM_ID]" \
      -allowProvisioningUpdates \
      "${ASC_AUTH_ARGS[@]}"
    ```
13. Log success + "processing takes 5–15 minutes"
14. Optional: query ASC for build status (`asc-list-builds.mjs`)

Wire in `package.json`:

```json
{
  "scripts": {
    "ios:check-asc": "bash scripts/check-asc-secrets.sh",
    "ios:local-signing": "bash scripts/ios-write-local-signing.sh",
    "ios:testflight": "bash scripts/ios-testflight.sh",
    "ios:check-asc-builds": "doppler run --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG] -- node scripts/asc-list-builds.mjs"
  }
}
```

For melos monorepos, add a convenience script mirroring existing IPA build targets.

### 2.5 ASC app bootstrap (optional, recommended)

Copy from Purple and customize constants:

- `scripts/asc-ensure-app.mjs` — REST: create app if missing
- `scripts/asc-list-builds.mjs` — query build status after upload
- `scripts/lib/asc-jwt.mjs` — JWT for ASC API (**must use `dsaEncoding: ieee-p1363`**)

Requires bundle ID already registered in Developer portal.

### 2.6 GitHub Actions workflow (only if `[SECRETS_BACKEND]` = `github`)

File: `.github/workflows/ios-testflight.yml`

- Runner: `macos-latest` (or `macos-14` for Xcode 15+)
- Trigger: `workflow_dispatch` + optional tag `ios-v*`
- Steps:
  1. Checkout
  2. Setup Flutter (match existing Android workflow version)
  3. Decode `APP_STORE_CONNECT_API_KEY_BASE64` → temp `.p8`
  4. Export env: `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `DEVELOPMENT_TEAM`
  5. Run same build/archive/export as `scripts/ios-testflight.sh` (inline or call script)
  6. No Apple ID login, no Fastlane Match

**Do not add Fastlane** unless the project already depends on it for other lanes. Upload-only via xcodebuild is sufficient.

---

## Phase 3 — Verification (agent runs before claiming done)

| Step | Command | Pass |
|------|---------|------|
| Secrets | `bun run ios:check-asc` | All secrets OK |
| Analyze/test | `flutter analyze && flutter test` | No failures (if Flutter) |
| Upload | `bun run ios:testflight` | Exit 0, no auth/signing errors |
| ASC state | ASC UI or `ios:check-asc-builds` | Build `VALID` (may take 5–15 min) |

Agent must **not** ask operator to test TestFlight until upload script completes without error.

---

## What stays manual (by Apple policy)

- Generating ASC API key (browser, one-time)
- Adding TestFlight internal/external testers
- Beta App Review for external testers
- App Privacy questionnaire, store screenshots

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| ASC API 401 | JWT signing: use `dsaEncoding: ieee-p1363` in `asc-jwt.mjs` |
| No signing certificate | Ensure ASC auth args on **both** archive and export; add `-allowProvisioningUpdates` |
| Duplicate build number | Increment `+N` in pubspec or `CURRENT_PROJECT_VERSION` |
| App record not found | Run `asc-ensure-app.mjs` or create app in ASC with `[BUNDLE_ID]` |
| Export fails (ad-hoc) | Use App Store export plist, not ad-hoc |
| `aps-environment: development` | Separate Release entitlements with `production` for TestFlight push |
| Xcode not found | Full Xcode.app required, not Command Line Tools only |
| SPM / private packages on CI | May need `~/.netrc` secret (e.g. Adyen) — test first macOS run |

---

## Implementation checklist (agent todos)

- [ ] **audit** — Read repo; fill placeholder table; report blockers
- [ ] **export-plist** — Add `[EXPORT_OPTIONS]` (`app-store-connect` + `upload`)
- [ ] **check-asc** — Add `scripts/check-asc-secrets.sh` + package script
- [ ] **local-signing** — Add `scripts/ios-write-local-signing.sh`
- [ ] **upload-script** — Add `scripts/ios-testflight.sh` (xcodebuild pattern, no Apple ID)
- [ ] **asc-ensure** — Copy `asc-ensure-app.mjs` + `asc-jwt.mjs` + `asc-list-builds.mjs` (optional)
- [ ] **package-scripts** — Wire `ios:check-asc`, `ios:local-signing`, `ios:testflight`
- [ ] **gha** — Add `.github/workflows/ios-testflight.yml` if CI backend is GitHub
- [ ] **docs** — Add project runbook (secret names, bundle ID, team, build number source)
- [ ] **verify** — Run check-asc; run testflight if secrets present; report PASS/FAIL

---

## Operator trigger phrase

After filling placeholders and storing ASC secrets:

> ASC keys are in [Doppler `[PROJECT]/[CONFIG]` | GitHub Secrets]. Execute the TestFlight automation plan. Implement Phase 2. Secrets backend is `[doppler|github]`. Run verification.

---

## Source reference (Purple)

- Runbook: `docs/testflight-setup.md`
- Upload: `scripts/flutter-ios-testflight.sh`
- ASC helpers: `scripts/asc-ensure-app.mjs`, `scripts/asc-list-builds.mjs`, `scripts/lib/asc-jwt.mjs`
