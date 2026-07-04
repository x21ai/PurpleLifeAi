# Purple Flutter app

Multi-platform client for Purple Life (iOS, Android, web, macOS, Windows).
Production Supabase custom domain: `https://auth.purplelife.org`.
Native bundle ID: `org.purplelife.app` (matches Capacitor shell).

## Prerequisites

- Flutter SDK stable (3.24+, tested with 3.44)
- Xcode (iOS/macOS)
- Android Studio + SDK (Android)
- Visual Studio 2022 with Desktop development (Windows, optional)

```bash
flutter doctor
```

## First-time setup

```bash
cd flutter
flutter pub get
```

Enable desktop and web targets (one-time per machine):

```bash
flutter config --enable-ios
flutter config --enable-android
flutter config --enable-web
flutter config --enable-macos-desktop
flutter config --enable-windows-desktop
```

## Secrets (no committed keys)

Pass publishable Supabase values at run/build time via `--dart-define`:

```bash
flutter run \
  --dart-define=SUPABASE_ANON_KEY=your_publishable_key
```

Optional overrides (defaults match production):

| Define | Default |
|--------|---------|
| `SUPABASE_URL` | `https://auth.purplelife.org` |
| `SITE_URL` | `https://www.purplelife.org` |
| `WORKER_API_BASE_URL` | `https://www.purplelife.org/api` |

Load keys from Doppler (`cursor-cloudflare` / `prd_cloudlfare`): `VITE_SUPABASE_PUBLISHABLE_KEY` maps to `SUPABASE_ANON_KEY`.

## Run (development)

| Platform | Command |
|----------|---------|
| iOS Simulator | `flutter run -d ios` |
| Android emulator | `flutter run -d android` |
| Chrome (web) | `flutter run -d chrome` |
| macOS | `flutter run -d macos` |
| Windows | `flutter run -d windows` |

List devices: `flutter devices`

## Build (release)

```bash
cd flutter
flutter analyze
flutter test

flutter build apk --release
flutter build appbundle --release
flutter build ios --release
flutter build web --release
flutter build macos --release
flutter build windows --release
```

## Project layout (Phase 0)

```
flutter/lib/
  main.dart           # Entry + ProviderScope
  app.dart            # MaterialApp root (scaffold)
  core/
    config/           # AppConfig, dart-define env
    constants/        # Bundle IDs, app name
  design/             # Agent 2: tokens, theme, glass
  shell/              # Agent 4: router, nav, auth gate
  features/           # Agent 5: today, vitals, journal, ...
```

## Quality gates

```bash
cd flutter
flutter analyze
flutter test
```

## Related docs

- Web counterpart: `docs/native-app-setup.md`
- Sync runbook: `docs/LOVABLE-FLUTTER-SYNC.md` (when present)
