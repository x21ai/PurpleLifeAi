# Native iOS: full Xcode vs Command Line Tools

## Why CLT is not enough

Apple **Command Line Tools (CLT)** provide a standalone compiler toolchain (`clang`, `git`, etc.) under `/Library/Developer/CommandLineTools`. They do **not** include:

- The **iOS SDK** (`iphonesimulator`, `iphoneos`)
- **Simulator.app** and simulator runtimes
- **`xcodebuild`** wired to an Xcode.app developer dir with platform frameworks
- Capacitor/CocoaPods/SPM iOS project signing and archive flows

Capacitor iOS builds use `xcodebuild` against `ios/App/App.xcodeproj` with SDK `iphonesimulator` or `iphoneos`. That requires **Xcode.app** at `/Applications/Xcode.app` and `xcode-select` pointing to `Xcode.app/Contents/Developer`.

CLT alone cannot produce a Purple iOS simulator or device binary.

## Automation

- Script: `scripts/native-ios-build.sh` (sync + `xcodebuild` Debug simulator).
- Incomplete App Store download appears as `/Applications/Xcode.appdownload`; wait until `Xcode.app` exists. `mas` cannot finish a partial GUI download reliably; use App Store or `xcodebuild` after install completes.

## One-time gates on a fresh Mac

1. Install Xcode from App Store (full app, not CLT only).
2. `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` if needed.
3. Accept license: `sudo xcodebuild -license accept` (interactive terminal with admin password).
4. First launch may require `sudo xcodebuild -runFirstLaunch`.

## Verify

```bash
xcode-select -p
# expect: /Applications/Xcode.app/Contents/Developer

xcodebuild -version
scripts/native-ios-build.sh
```

