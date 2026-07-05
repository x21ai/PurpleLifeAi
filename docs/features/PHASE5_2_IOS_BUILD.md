# Phase 5 Stage 2: Flutter iOS device build

**Goal:** `flutter build ios --no-codesign` succeeds when `xcode-select` points at CommandLineTools and full Xcode lives at `Xcode-beta.app`.

## Root cause

1. **`objective_c` native-asset hook:** `hooks_runner` forwards only allowlisted env vars (`PATH`, `HOME`, …), not `DEVELOPER_DIR`. Inside Xcode script phases, `xcrun --sdk iphoneos --show-sdk-path` then fails when `xcode-select` is `/Library/Developer/CommandLineTools`, producing `Bad state: No element` in `objective_c` hook `build.dart`.
2. **Scheme pre-action:** Flutter's `Runner.xcscheme` runs `xcode_backend.sh prepare` (unpack/sign `Flutter.framework`) before the Run Script `build` phase. The stock script had no `DEVELOPER_DIR` / PATH shim.
3. **iCloud Desktop paths:** Repos under iCloud-synced Desktop folders get `com.apple.fileprovider.*` xattrs on copied frameworks; Flutter's `removeExtendedAttributes` only strips `FinderInfo`/`provenance` on the binary, so ad-hoc codesign fails with "resource fork … not allowed". **Workaround:** symlink only `flutter/build/ios` to `/tmp/purpledrw-flutter-build/ios` (see below). Do **not** symlink the entire `flutter/build` directory; that breaks `./scripts/flutter-web-serve.sh` on port 8765.

## Fix (in repo)

| File | Purpose |
|------|---------|
| `flutter/ios/Flutter/Developer.xcconfig` | `DEVELOPER_DIR = /Applications/Xcode-beta.app/Contents/Developer` |
| `flutter/ios/Flutter/Debug.xcconfig`, `Release.xcconfig` | `#include "Developer.xcconfig"` + optional `Developer.local.xcconfig` override |
| `flutter/ios/scripts/xcrun` | PATH shim: sets `DEVELOPER_DIR` then execs real `/usr/bin/xcrun` (hooks only see `PATH`) |
| `flutter/ios/scripts/xcode_backend_prepare.sh` | Scheme pre-action wrapper: PATH shim + `xattr -cr` retry on codesign failure |
| `flutter/ios/scripts/xcode_backend_build.sh` | Run Script wrapper: same for `build` phase |
| `flutter/ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme` | Pre-action calls `xcode_backend_prepare.sh` |
| `flutter/ios/Runner.xcodeproj/project.pbxproj` | Run Script / Thin Binary export `DEVELOPER_DIR` and prepend `ios/scripts` to `PATH` |
| `scripts/flutter-build-dirs.sh` | Shared helpers: real `flutter/build` for web, `/tmp` symlink for `build/ios` only |
| `scripts/flutter-ios-build.sh` | iOS build wrapper (sets up ios symlink + Doppler + `flutter build ios`) |

Override Xcode location locally (optional):

```bash
# flutter/ios/Flutter/Developer.local.xcconfig
DEVELOPER_DIR = /Applications/Xcode.app/Contents/Developer
```

## Verify

### iOS build (iCloud-safe)

From repo root:

```bash
./scripts/flutter-ios-build.sh
# Expect: ✓ Built build/ios/iphoneos/Runner.app
# iOS artifacts live in /tmp/purpledrw-flutter-build/ios via flutter/build/ios symlink
```

Manual equivalent:

```bash
export DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer
export PATH="$(pwd)/flutter/ios/scripts:${PATH}"
source scripts/flutter-build-dirs.sh
prepare_flutter_ios_build_dir

cd flutter
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter build ios --release --no-codesign
```

### Web preview (port 8765, independent of iOS)

```bash
./scripts/flutter-web-serve.sh --rebuild
# Serves flutter/build/web at http://localhost:8765
```

Both can run in any order. Web uses a real `flutter/build/web` directory; iOS uses `flutter/build/ios` → `/tmp/purpledrw-flutter-build/ios` only.

If an old top-level `flutter/build` → `/tmp/...` symlink is still present, `flutter-web-serve.sh` migrates `web/` back into the repo automatically.

USB device (optional):

```bash
flutter devices   # note iPhone device id
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter run -d <device-id> --release
```

## Diagnostics

```bash
xcode-select -p
# If CommandLineTools: native hooks need ios/scripts/xcrun on PATH or DEVELOPER_DIR in shell

xcrun --sdk iphoneos --show-sdk-path
# Without DEVELOPER_DIR + CLT: fails

DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer \
  xcrun --sdk iphoneos --show-sdk-path
# Should print iPhoneOS*.sdk path

# xattr on build output (iCloud issue)
xattr -lr flutter/build/ios/Release-iphoneos/Flutter.framework | head
```

## Notes

- Capacitor `ios/` is unchanged; this track is Flutter-only (`flutter/ios/`).
- `flutter_secure_storage` and `health` still use CocoaPods (SPM warning is expected until plugin updates).
- Do not commit `Developer.local.xcconfig` or `flutter/build/ios` symlink.
- Never symlink the entire `flutter/build` directory (breaks web preview).
