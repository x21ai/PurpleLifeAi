# TestFlight setup (Purple iOS)

Ship the Capacitor iOS shell (`org.purplelife.app`) to **TestFlight** so beta
users can install Purple without USB/Xcode.

## What is automated

From a Mac with full Xcode:

```bash
bun run ios:testflight
```

This runs `scripts/native-ios-testflight.sh`, which:

1. `bun run native:sync`
2. Resolves `DEVELOPMENT_TEAM` from Doppler `purple-life` / `prd`
3. Ensures an App Store Connect app record exists (`scripts/asc-ensure-app.mjs`)
4. Archives a **Release** build (`xcodebuild archive`)
5. Exports and uploads to App Store Connect (`ios/ExportOptions.plist`, method `app-store-connect`)

After upload, processing takes about **5–15 minutes**. Then add testers in
[App Store Connect](https://appstoreconnect.apple.com) → **TestFlight**.

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

- Marketing version: `MARKETING_VERSION` in `ios/App/App.xcodeproj` (currently `1.0`)
- Build number: `CURRENT_PROJECT_VERSION` (increment for each TestFlight upload)

Bump `CURRENT_PROJECT_VERSION` before each upload when Apple rejects duplicate builds.

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
| No signing certificate | Ensure Apple ID is on the developer team; archive uses automatic signing with `-allowProvisioningUpdates` |
| Duplicate build number | Increment `CURRENT_PROJECT_VERSION` in the Xcode project |
| HealthKit entitlement | Confirm App ID has HealthKit in Developer portal |

## Agent run log (2026-07-03, Xcode-beta 27.0)

Environment: `DEVELOPER_DIR` → `/Applications/Xcode-beta.app`, team `C3HY4MF66F` from Doppler `purple-life/prd`.

| Step | Result |
|------|--------|
| `bun run ios:check-asc` | **Pass** (all three `APP_STORE_CONNECT_*` + `DEVELOPMENT_TEAM`) |
| `bun run ios:testflight` (first run) | **Fail** at `asc-ensure-app.mjs`: ASC **401** (JWT ES256 DER signatures; fixed in repo) |
| `scripts/lib/asc-jwt.mjs` | **Fixed** (`crypto.sign` with `dsaEncoding: ieee-p1363`) |
| `scripts/asc-ensure-app.mjs` (after JWT fix) | **Fail** ASC **403**: API key cannot **CREATE** app (use **Admin** in ASC UI or Admin API key) |
| ASC lookup `org.purplelife.app` | **No app record** (bundle ID exists, Apple team seed `C3HY4MF66F`) |
| Capacitor sync + local signing | **OK** (testflight script through signing step) |
| `xcodebuild archive` Release | **OK** → `build/ios/Purple.xcarchive` (marketing **1.0**, build **1**) |
| `xcodebuild -exportArchive` | **Failed**: app record `org.purplelife.app` not found on App Store Connect |
| TestFlight upload | **Not completed** (export did not upload IPA) |

**Unblock TestFlight (owner in App Store Connect):**

1. **My Apps** → **+** → New App: name **Purple**, bundle ID `org.purplelife.app`, SKU e.g. `purple-life-ios-001`, primary locale **en-US** (requires **Admin**; current API key reads ASC but cannot create apps).
2. Optional: new API key with **Admin** access so `asc-ensure-app.mjs` can create the record.
3. Re-run: `bun run ios:testflight` (increment `CURRENT_PROJECT_VERSION` if duplicate build **1**).

After Apple processes the build (5–15 minutes): **TestFlight** → internal testers, then external group + Beta App Review if needed.
