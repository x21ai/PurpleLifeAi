# Google Play Store automation plan (portable)

**Attach this file to a Cursor chat and say:**

> Execute this Play Store plan for [PROJECT_NAME]. Fill placeholders from this repo, then implement.

Android counterpart to iOS TestFlight automation. Same philosophy: **one human setup in browser**, then **zero Play Console login** for uploads via **Google Play Developer API + service account**.

iOS equivalent: `docs/templates/testflight-automation-plan.md`

Crash reporting (optional, attach separately):

- `docs/templates/luciq-crash-reporting-plan.md`
- `docs/templates/sentry-crash-reporting-plan.md`

---

## iOS TestFlight vs Google Play (mapping)

| | iOS (Purple) | Android (this plan) |
|---|--------------|---------------------|
| **Beta channel** | TestFlight internal/external | Play **internal testing** / closed testing |
| **API auth** | App Store Connect API key (`.p8`) | **Service account JSON** (Play Developer API) |
| **Signing** | Xcode automatic + ASC key on xcodebuild | **Upload keystore** + **Play App Signing** (Google re-signs) |
| **Artifact** | IPA (archive + export) | **AAB** (App Bundle), not APK for store |
| **Build command** | `flutter build ios` + xcodebuild archive | `flutter build appbundle --release` |
| **Upload tool** | `xcodebuild -exportArchive` | **fastlane supply** or **upload-google-play** action (recommended) |
| **Version bump** | `pubspec.yaml` `+N` or `CURRENT_PROJECT_VERSION` | `pubspec.yaml` `+N` → `versionCode` |
| **Secrets store** | Doppler or GitHub Secrets | Doppler or GitHub Secrets |

**Purple today:** Flutter Android (`flutter/android/app/build.gradle.kts`) still signs Release with **debug keys** — Play automation not implemented yet. This plan is the target state.

---

## Architecture (do not change unless operator says so)

| Decision | Choice |
|----------|--------|
| Artifact | **AAB** (`flutter build appbundle`) |
| Upload track | **`internal`** first (up to 100 testers, no review) |
| API auth | **Google Play Developer API** via **service account JSON** |
| App signing | **Play App Signing** enabled (Google holds app signing key; you keep upload key) |
| Upload tool | **fastlane supply** (minimal Fastfile) **or** GitHub Action `r0adkll/upload-google-play` |
| Keystore | Upload keystore generated once; stored as secret (base64), never committed |
| Play Console login | **Never** for CI/agent uploads |

---

## Project placeholders (agent: fill from target repo)

| Placeholder | Example (Purple / eatOS) | Target project |
|-------------|--------------------------|----------------|
| `[PROJECT_NAME]` | Purple for Life / eatOS POS | |
| `[APPLICATION_ID]` | `org.purplelife.app` / `com.eatos.pos` | |
| `[FLUTTER_DIR]` | `flutter` / `eatOS` | |
| `[ANDROID_APP_DIR]` | `flutter/android/app` | |
| `[BUILD_GRADLE]` | `flutter/android/app/build.gradle.kts` | |
| `[PACKAGE_NAME]` | same as `[APPLICATION_ID]` | for Play Console |
| `[PLAY_TRACK]` | `internal` | `internal` \| `alpha` \| `beta` \| `production` |
| `[BUILD_NUMBER_SOURCE]` | `pubspec.yaml` `version: x.y.z+N` | `+N` → `versionCode` |
| `[SECRETS_BACKEND]` | `doppler` or `github` | |
| `[DOPPLER_PROJECT]` | `purple-life` / `eatos` | |
| `[DOPPLER_CONFIG]` | `prd` | |
| `[GCP_SERVICE_ACCOUNT]` | `play-upload@project.iam.gserviceaccount.com` | |

---

## Phase 0 — Audit target repo (read-only)

Agent must confirm:

- [ ] Flutter Android path and `applicationId`
- [ ] Release signing: debug keystore (must fix) vs upload keystore configured
- [ ] `versionCode` source (`pubspec.yaml` `+N` or hardcoded in Gradle)
- [ ] Existing APK-only CI (eatOS `build_apk.yml`) — Play needs **AAB**, not APK
- [ ] `google-services.json` present if FCM (separate from upload signing)
- [ ] Health Connect / sensitive permissions declared for Play policy
- [ ] Play Console app created (or plan API create — usually manual first time)

Report blockers before implementing.

---

## Phase 1 — One-time human setup (operator, browser)

Agent **cannot** create the Play Developer account or first app listing alone.

### 1.1 Google Play Developer account

- One-time $25 registration: https://play.google.com/console
- Create app **`[PROJECT_NAME]`** with package **`[APPLICATION_ID]`**

### 1.2 Enable Play App Signing (recommended)

Play Console → **Release → Setup → App signing**:

- Enroll in **Play App Signing** (Google manages app signing key)
- Download or note **upload key** requirements (you generate upload keystore)

### 1.3 Generate upload keystore (one-time)

```bash
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype JKS
```

Store passwords securely. **Never commit** the `.jks` file.

### 1.4 Play Developer API + service account

1. Play Console → **Setup → API access**
2. Link or create a **Google Cloud project**
3. **Create service account** (or use existing)
4. Grant service account role in Play Console: **Release manager** (or Admin)
5. GCP → IAM → Service account → **Keys → Add key → JSON** → download once

Required API: **Google Play Android Developer API** (enable in GCP if not auto-enabled).

### 1.5 Store secrets

**Doppler:**

```bash
# Service account JSON (full file contents)
doppler secrets set PLAY_STORE_SERVICE_ACCOUNT_JSON="$(cat play-upload-xxxxx.json)" \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]

# Upload keystore as base64
doppler secrets set ANDROID_UPLOAD_KEYSTORE_BASE64="$(base64 -i upload-keystore.jks)" \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]

doppler secrets set \
  ANDROID_KEYSTORE_PASSWORD="..." \
  ANDROID_KEY_ALIAS="upload" \
  ANDROID_KEY_PASSWORD="..." \
  --project [DOPPLER_PROJECT] --config [DOPPLER_CONFIG]
```

**GitHub Actions:**

| Secret | Value |
|--------|-------|
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | Full JSON (or base64 of JSON) |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | `base64 -i upload-keystore.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | e.g. `upload` |
| `ANDROID_KEY_PASSWORD` | Key password |

### 1.6 Tell agent

> Play Store secrets are in Doppler [or GitHub]. Continue Play Store implementation.

---

## Phase 2 — Signing config (agent implements)

### 2.1 Gitignore

Ensure gitignored:

```
android/key.properties
android/app/upload-keystore.jks
**/key.properties
```

### 2.2 `scripts/android-write-signing.sh`

Write at build time (never commit):

**`[FLUTTER_DIR]/android/key.properties`:**

```properties
storePassword=...
keyPassword=...
keyAlias=upload
storeFile=upload-keystore.jks
```

Decode keystore from Doppler:

```bash
doppler secrets get ANDROID_UPLOAD_KEYSTORE_BASE64 ... --plain | base64 -d \
  > "${FLUTTER_DIR}/android/app/upload-keystore.jks"
chmod 600 "${FLUTTER_DIR}/android/app/upload-keystore.jks"
```

Copy pattern from Purple: `scripts/ios-write-local-signing.sh`.

### 2.3 Update `[BUILD_GRADLE]`

Replace debug signing on Release (Purple currently has this TODO):

```kotlin
// Load key.properties if present (CI/local release builds)
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = java.util.Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(keystorePropertiesFile.inputStream())
}

android {
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // minifyEnabled / shrinkResources per project policy
        }
    }
}
```

Adjust `storeFile` path relative to `app/` module (often `file("upload-keystore.jks")`).

---

## Phase 3 — Build script (agent implements)

### 3.1 Secret check — `scripts/check-play-secrets.sh`

Verify:

- `PLAY_STORE_SERVICE_ACCOUNT_JSON`
- `ANDROID_UPLOAD_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`

Exit non-zero with fix instructions if missing.

### 3.2 Upload script — `scripts/android-play-upload.sh`

**Required behavior:**

1. `set -euo pipefail`
2. Run `check-play-secrets.sh`
3. Run `android-write-signing.sh`
4. Read `versionCode` from `[BUILD_NUMBER_SOURCE]` (`+N` in pubspec); fail if not incremented vs last Play upload
5. Optional: `flutter analyze`, `flutter test`
6. **Build AAB:**
   ```bash
   cd "[FLUTTER_DIR]"
   flutter pub get
   flutter build appbundle --release \
     --build-number="$VERSION_CODE" \
     --build-name="$VERSION_NAME" \
     --dart-define=LUCIQ_APP_TOKEN="$LUCIQ_TOKEN" \
     --dart-define=SENTRY_DSN="$SENTRY_DSN"
   ```
   Omit dart-defines if crash SDK not used.
7. AAB path: `[FLUTTER_DIR]/build/app/outputs/bundle/release/app-release.aab`
8. Write service account JSON to temp file (`mktemp`, `chmod 600`, `trap` cleanup)
9. **Upload** (pick one approach):

**Option A — fastlane supply (recommended, minimal):**

`[FLUTTER_DIR]/android/fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Upload AAB to Play internal testing"
  lane :upload_internal do
    upload_to_play_store(
      track: "internal",
      aab: "../build/app/outputs/bundle/release/app-release.aab",
      json_key: ENV["PLAY_STORE_JSON_KEY_PATH"],
      package_name: "[APPLICATION_ID]",
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end
```

```bash
export PLAY_STORE_JSON_KEY_PATH="$(mktemp).json"
# write JSON from Doppler → file
cd "[FLUTTER_DIR]/android" && fastlane upload_internal
```

**Option B — GitHub Action only (no local fastlane):**

Use `r0adkll/upload-google-play@v1` in workflow with `serviceAccountJsonPlainText`.

10. Log success + "Play processing may take a few minutes"
11. Optional: query Play API for latest release version code

### 3.3 Package scripts

```json
{
  "scripts": {
    "android:check-play": "bash scripts/check-play-secrets.sh",
    "android:signing": "bash scripts/android-write-signing.sh",
    "android:play-upload": "bash scripts/android-play-upload.sh"
  }
}
```

Melos monorepos: add per-app targets (e.g. `upload_pos_play_internal`).

---

## Phase 4 — GitHub Actions (if `[SECRETS_BACKEND]` = `github`)

File: `.github/workflows/android-play-upload.yml`

- Runner: `ubuntu-latest` (Android builds do not need macOS)
- Trigger: `workflow_dispatch` + optional tag `android-v*`
- JDK 17, Flutter (match existing APK workflow version)
- Steps:
  1. Checkout
  2. Decode keystore + write `key.properties`
  3. Write service account JSON to temp path
  4. `flutter build appbundle --release ...`
  5. Upload with `r0adkll/upload-google-play@v1`:
     ```yaml
     - uses: r0adkll/upload-google-play@v1
       with:
         serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT_JSON }}
         packageName: [APPLICATION_ID]
         releaseFiles: [FLUTTER_DIR]/build/app/outputs/bundle/release/app-release.aab
         track: internal
         status: completed
     ```
  6. No Play Console browser login

eatOS note: existing `build_apk.yml` builds APK for sideload; **add separate workflow** for AAB + Play — do not replace APK workflow unless operator asks.

---

## Phase 5 — Verification (agent runs before claiming done)

| Step | Command | Pass |
|------|---------|------|
| Secrets | `bun run android:check-play` | All present |
| Signing | `android:signing` | `key.properties` + `.jks` written |
| Build | `flutter build appbundle --release` | AAB exists, signed with upload key |
| Upload | `bun run android:play-upload` | Exit 0, no 403 from Play API |
| Play Console | Release → Testing → Internal | New version code visible |
| Install | Internal tester opt-in link | App installs from Play |

Agent must not ask operator to manually upload AAB unless API upload failed with actionable error.

---

## What stays manual (Google policy)

- Play Developer account registration ($25)
- First app creation and store listing (title, category, content rating questionnaire)
- Data safety form, health app declarations, screenshot assets for production
- Adding internal testers (email list or Google Group) — first time
- Promoting internal → production (human approval recommended)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `403 Forbidden` on upload | Service account lacks Play Console permission; re-grant **Release manager** |
| `404 Package not found` | Create app in Play Console with exact `[APPLICATION_ID]` first |
| `Version code X has already been used` | Increment `+N` in pubspec |
| AAB signed with debug key | Fix Release `signingConfig` in Gradle; run `android:signing` |
| `google-services.json` missing | FCM only — add from Firebase console (separate from upload API) |
| API not enabled | Enable **Google Play Android Developer API** in GCP |
| Wrong keystore | Must be **upload** key registered with Play App Signing |
| APK uploaded | Play requires **AAB** for new apps (since Aug 2021) |

---

## Implementation checklist (agent todos)

- [ ] **audit** — applicationId, signing state, CI layout, versionCode source
- [ ] **gitignore** — keystore + key.properties
- [ ] **android-write-signing** — script to decode secrets → signing files
- [ ] **gradle-signing** — Release uses upload keystore, not debug
- [ ] **check-play-secrets** — verification script + package entry
- [ ] **build-upload-script** — `android-play-upload.sh` (AAB + API upload)
- [ ] **fastlane** — minimal Fastfile for supply OR document GHA action only
- [ ] **gha** — `android-play-upload.yml` if GitHub backend
- [ ] **melos** — optional convenience script per app (monorepo)
- [ ] **docs** — runbook: secret names, track, package name, verify commands
- [ ] **verify** — check-play + build AAB; upload if secrets present; report PASS/FAIL

---

## Operator trigger phrase

> Play Store secrets are in [Doppler `[PROJECT]/[CONFIG]` | GitHub Secrets]. Execute the Play Store automation plan. Package `[APPLICATION_ID]`, track `internal`, Flutter path `[FLUTTER_DIR]`. Secrets backend is `[doppler|github]`. Run verification.

---

## Multi-app monorepo (eatOS pattern)

Repeat per app with different `[APPLICATION_ID]` and Gradle path:

| App | Package | Flutter path |
|-----|---------|--------------|
| POS | `com.eatos.pos` | `eatOS/` |
| Handheld | `com.eatos.portraitFlutter` | `portrait_flutter/` |
| Kiosk | `com.eatos.kiosk` | kiosk app path |

One service account can upload all apps if granted access to each in Play Console.

---

## Source reference

- Purple Android Gradle (needs signing fix): `flutter/android/app/build.gradle.kts`
- iOS counterpart: `docs/templates/testflight-automation-plan.md`, `docs/testflight-setup.md`
- Native overview: `docs/native-app-setup.md` §7
