# Phase 5: Flutter replaces Capacitor (orchestrator)

**Goal:** Ship `org.purplelife.app` as a **Flutter binary** (not WebView → www.purplelife.org), with test gates at each stage so the operator can sign off and move to the next project.

**Current baseline (2026-07-04):** Phase 1 Flutter shell done; Phase 2 data fixes in progress on `lovable/redesign`; Capacitor TestFlight loads prod TanStack web; Flutter iOS device build blocked by Xcode native-assets hook.

## Architecture after cutover

| Surface | Before | After Phase 5 |
|---------|--------|----------------|
| iOS/Android store | Capacitor WebView → `www.purplelife.org` | Flutter app (same bundle `org.purplelife.app`) |
| Marketing `/`, `/pricing` | TanStack on Worker | **Unchanged** (TanStack SSR) |
| Signed-in app | TanStack `_app/*` on web; Capacitor on phone | Flutter on phone; web stays TanStack until optional Flutter web host |
| Supabase / Worker API | Shared | Shared |

## Staged waves (test before next stage)

| Stage | Deliverable | Test gate (operator or agent) | Owner |
|-------|-------------|-------------------------------|-------|
| **0** | Gap matrix + Go/No-Go | `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` reviewed | Read agents |
| **1** | Data loads on Flutter web | `./scripts/flutter-web-serve.sh --rebuild`; sign in `pmt@eigital.com`; Today/Meds/Vitals show real data; `flutter test` pass | Parent |
| **2** | Flutter iOS/Android compile + USB run | `DEVELOPER_DIR=Xcode-beta flutter build ios`; `flutter run -d <iphone>`; `flutter build appbundle` | Slice 2A |
| **3** | Route parity + i18n | All `_app` routes mapped; settings copy from `en.json`; `flutter analyze lib/` clean | Slices 3A–3C |
| **4** | Native health + push | HealthKit/Connect read → `biometrics`; APNs token upload | Slices 4A–4B |
| **5** | Flutter TestFlight replaces Capacitor | `bun run ios:testflight` **Flutter IPA path**; ASC build VALID; device smoke | Slice 5A (serial) |
| **6** | Retire Capacitor store track | Archive `capacitor.config.ts` remote URL docs; update handoff; **owner approves** prod | Parent |

**Hard rules:** No prod deploy without gate pass + explicit owner approval. One server owner per port (`8765` Flutter web, `8081` TanStack dev). One iOS release owner per build number.

## Parallel slice files

| Slice | Path | Stage |
|-------|------|-------|
| `PHASE5_0_GAP_AUDIT.md` | read-only | 0 |
| `PHASE5_2_IOS_BUILD.md` | `flutter/ios/` | 2 |
| `PHASE5_3_I18N_SETTINGS.md` | `flutter/lib/l10n/`, settings/account | 3 |
| `PHASE5_5_TESTFLIGHT.md` | `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`, scripts | 5 |

## Verification commands (quick reference)

```bash
# Stage 1
cd flutter && flutter analyze lib/ && flutter test
./scripts/flutter-web-serve.sh --rebuild   # http://localhost:8765

# Stage 2
export DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer
cd flutter && doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter build ios --release --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY"

# Stage 5 (after 2–4 pass)
# New script: flutter TestFlight pipeline (to be added in slice 5A)
```

## Operator sign-off

Reply `approved` on this table to run all stages autonomously (halt only on test fail or missing secrets). Adjust stage order if you want **TestFlight Flutter** before full i18n (not recommended).
