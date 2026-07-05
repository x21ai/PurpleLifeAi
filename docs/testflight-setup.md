# TestFlight setup (Purple iOS)

Ship the **Flutter** native app (`flutter/`, bundle `org.purplelife.app`) to
**TestFlight** so beta users can install Purple without USB/Xcode.

**Primary path:** `bun run ios:testflight` → `scripts/flutter-ios-testflight.sh`

**Deprecated (Capacitor WebView rollback only):** `bun run ios:testflight:capacitor`
→ `scripts/native-ios-testflight.sh`

## What is automated

From a Mac with full Xcode:

```bash
bun run ios:testflight
```

This runs `scripts/flutter-ios-testflight.sh`, which:

1. `flutter analyze lib/` and `flutter test`
2. `bun run ios:check-asc` (Doppler `purple-life` / `prd` ASC API key + team)
3. `bun run ios:local-signing` (writes `LocalSigning.xcconfig` for Flutter + Capacitor)
4. Reads build number from `flutter/pubspec.yaml` (`version: x.y.z+N`)
5. Ensures an App Store Connect app record exists (`scripts/asc-ensure-app.mjs`)
6. `flutter build ipa --release` (signed archive under `flutter/build/ios/archive/`)
7. Exports and uploads to App Store Connect (`flutter/ios/ExportOptions.plist`, method `app-store-connect`)

After upload, processing takes about **5–15 minutes**. Then add testers in
[App Store Connect](https://appstoreconnect.apple.com) → **TestFlight**.

### Capacitor rollback (deprecated)

Do **not** use unless you must ship the old WebView shell (`ios/App/` loads
`https://www.purplelife.org`):

```bash
bun run ios:testflight:capacitor
```

Runs `scripts/native-ios-testflight.sh` (`native:sync`, `check:native-shell`,
Capacitor `xcodebuild archive`). Script prints a deprecation warning on start.

## App Store Connect record (2026-07-03)

| Field | Value |
|-------|--------|
| App name | **Purple for Life** |
| Bundle ID | `org.purplelife.app` |
| Apple ID | `6787298041` |
| Team | `C3HY4MF66F` (ideaTree Inc.) |
| ASC URL | https://appstoreconnect.apple.com/apps/6787298041 |

Capture screenshot candidates (1284×2778) for ASC upload:

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c \
  'TEST_USER_EMAIL=$E2E_TEST_USER_EMAIL TEST_USER_PASSWORD=$E2E_TEST_USER_PASSWORD node scripts/capture-asc-screenshots.mjs'
```

Output: `test-results/asc-screenshots/` (sign-in, today, settings, vitals).

## Latest validated upload (2026-07-04)

| Item | Status |
|------|--------|
| Command | `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:check-asc && bun run ios:testflight` |
| Uploaded build | **1.0 (7)** (`org.purplelife.app`, Apple ID `6787298041`) |
| ASC build ID | `3eff060e-3092-4816-b10e-955c63205598` |
| ASC processing state | `VALID` |
| ASC internal state | `IN_BETA_TESTING` |
| ASC external state | `READY_FOR_BETA_SUBMISSION` |

Crash/upload hardening confirmed on this line:

- `capacitor-shell/index.html` remains committed and guarded by `check:native-shell` to prevent the prior launch crash from missing shell assets.
- Luciq launch-crash reporting integration remains enabled in the iOS project.
- `scripts/native-ios-testflight.sh` continues to use App Store Connect API key auth (`-authenticationKeyPath`, `-authenticationKeyID`, `-authenticationKeyIssuerID`) so no manual Xcode Apple ID login is required.

## One-time: App Store Connect API key (Doppler)

**Owner one-time (~5 min, cannot be automated):** Apple requires a human with Admin or
App Manager access to generate the API key in the browser. After that, the agent runs
everything via `bun run ios:testflight`.

### Step A: Generate key in App Store Connect

1. Open https://appstoreconnect.apple.com (team **C3HY4MF66F**).
2. **Users and Access** → **Integrations** → **App Store Connect API**.
3. **Generate API Key** (name: `Purple TestFlight`, access: **App Manager** or **Admin**).
4. **Download** `AuthKey_XXXXXXXXXX.p8` immediately (one-time download).
5. Note **Key ID** (10 chars) and **Issuer ID** (UUID at top of Integrations page).

### Step B: Store in Doppler (agent reads these; never paste in chat)


| Secret | Value |
|--------|--------|
| `APP_STORE_CONNECT_KEY_ID` | 10-character Key ID from App Store Connect |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer UUID (Users and Access → Integrations) |
| `APP_STORE_CONNECT_API_KEY` | Full contents of the downloaded `.p8` file |

Create the key: App Store Connect → **Users and Access** → **Integrations** →
**App Store Connect API** → **Generate API Key** (role: **App Manager** or
**Admin**).

```bash
doppler secrets set APP_STORE_CONNECT_KEY_ID="..." \
  APP_STORE_CONNECT_ISSUER_ID="..." \
  --project purple-life --config prd

doppler secrets set APP_STORE_CONNECT_API_KEY="$(cat AuthKey_XXXXX.p8)" \
  --project purple-life --config prd
```

`DEVELOPMENT_TEAM` (`C3HY4MF66F`) is already in the same Doppler project.

Verify before asking the agent to upload:

```bash
bash scripts/check-asc-doppler.sh
```

Then tell the agent: *"ASC keys are in Doppler purple-life/prd. Run ios:testflight."*

## One-time: Bundle ID and HealthKit

The bundle ID **`org.purplelife.app`** must exist in the
[Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list)
with **HealthKit** enabled. The repo already ships:

- `ios/App/App/App.entitlements` (HealthKit)
- `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` in `Info.plist`

If the bundle ID is missing, register it under **Identifiers** → **App IDs**,
enable HealthKit, then re-run `bun run ios:testflight`.

**App icon:** iOS `AppIcon.appiconset` and Android `mipmap-*` use the brand asset
`public/icon-512.png` (white **p** on purple `#5b2c82`). Regenerate after icon
changes:

```bash
sips -z 1024 1024 public/icon-512.png --out ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
# Android: re-run the mipmap resize loop in docs/testflight-setup.md or cap sync tooling
```

## TestFlight testers (after first upload processes)

After the agent uploads a build (or you upload manually), wait **5–15 minutes**, then in App Store Connect:

1. **My Apps** → **Purple** → **TestFlight**
2. **Internal testing:** add up to 100 team members (no Beta App Review)
3. **External testing:** create a group, submit for Beta App Review (first external build only), share public link or email invites

The agent cannot add testers in App Store Connect UI; that step stays with the account holder.

## Version and build numbers

**Flutter (primary):**

- Marketing version + build: `version:` in `flutter/pubspec.yaml` (e.g. `1.0.0+10`)
- Build number (`+N`) must exceed the latest ASC upload; increment before each TestFlight upload

**Capacitor (deprecated rollback):**

- Marketing version: `MARKETING_VERSION` in `ios/App/App.xcodeproj` (currently `1.0`)
- Build number: `CURRENT_PROJECT_VERSION` (increment for each TestFlight upload)

## Verify locally before upload

```bash
bun run ios:local-signing
export DEVELOPER_DIR="/Applications/Xcode-beta.app/Contents/Developer"  # or Xcode.app
TEAM=$(grep DEVELOPMENT_TEAM ios/LocalSigning.xcconfig | awk '{print $3}')
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -sdk iphoneos -archivePath /tmp/Purple.xcarchive \
  DEVELOPMENT_TEAM="$TEAM" -allowProvisioningUpdates archive
```

## App Store guideline 4.2 (thin WebView)

Purple loads `https://www.purplelife.org` in a WebView. For review, document native
value-add: **HealthKit direct sync**, **local med reminders**, **native OAuth**,
and **push** (when APNs is wired). See `docs/native-app-setup.md`.

## Troubleshooting

| Error | Fix |
|-------|-----|
| App record not found on App Store Connect | Run `asc-ensure-app.mjs` (needs API key), or create app manually in ASC with bundle ID `org.purplelife.app` |
| ASC API 401 on `asc-ensure-app.mjs` | Use `dsaEncoding: ieee-p1363` in `scripts/lib/asc-jwt.mjs` (not `createSign` DER output) |
| Missing API credentials | Add the three `APP_STORE_CONNECT_*` secrets to Doppler |
| No signing certificate | `scripts/native-ios-testflight.sh` passes App Store Connect API key to `xcodebuild` (`-authenticationKeyPath` etc.) so no Apple ID login in Xcode GUI is required when Doppler has the three `APP_STORE_CONNECT_*` secrets |
| Duplicate build number | Increment `CURRENT_PROJECT_VERSION` in the Xcode project |
| HealthKit entitlement | Confirm App ID has HealthKit in Developer portal |

## Agent run log (2026-07-03, Xcode-beta 27.0)

Environment: `DEVELOPER_DIR` → `/Applications/Xcode-beta.app`, team `C3HY4MF66F` from Doppler `purple-life/prd`.

| Step | Result |
|------|--------|
| `bun run ios:check-asc` | **Pass** (all three `APP_STORE_CONNECT_*` + `DEVELOPMENT_TEAM`) |
| ASC app record | **Exists** (owner created **Purple for Life**, Apple ID `6787298041`, bundle `org.purplelife.app`) |
| First `bun run ios:testflight` | **Fail** export: missing `NSHealthUpdateUsageDescription` in `Info.plist` |
| `ios/App/App/Info.plist` | **Fixed** (added `NSHealthUpdateUsageDescription`) |
| Second `bun run ios:testflight` | **Pass** upload build **1.0 (1)** to TestFlight (processing 5–15 min) |
| ASC metadata (co-browse) | Subtitle, category (Health & Fitness), content rights, promotional text, description, keywords, review notes, demo creds (Doppler E2E), manual release |
| ASC metadata (evening co-browse) | Support URL `https://www.purplelife.org/contact`, Copyright `ideaTree Inc. 2026`, age ratings complete (4+ global), build **1.0 (1)** attached to version 1.0 |
| ASC still required | Upload 4 iPhone 6.5" screenshots from `test-results/asc-screenshots/` (browser cannot file-upload), App Privacy questionnaire (Admin), **Add for Review** |

**After build processes:** App Store Connect → **Purple for Life** → **TestFlight** → internal testers; version page → select build → **Add for Review** when metadata complete.
