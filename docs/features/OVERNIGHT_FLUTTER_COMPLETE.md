# Overnight Flutter completion (operator asleep 2026-07-04)

**Operator directive:** Complete all phases, deep testing, no manual handoffs, no morning excuses.
**TestFlight install target:** 1.0 (11) VALID Flutter native (build 12+ if plist/binary changes).
**Reference:** `docs/FLUTTER-PAGE-BY-PAGE-COMPARISON.md`, `docs/FLUTTER-CUTOVER-GAP-MATRIX.md`

## P0 tonight (user reported)

1. Settings wrong again — full hub parity vs web `settings.tsx` + inline sections
2. Apple Health does not work — native HealthKit connect/sync on device + Tools UI

## Phase waves (execute all)

| Wave | Scope | Owner agent |
|------|-------|-------------|
| A | Settings + Account + shell avatar | settings-fleet |
| B | Apple Health + Tools OAuth/sync | health-tools-fleet |
| C | Core tab gaps (Today/Meds/Journal/Vitals data+nav) | core-fleet |
| D | Routes wave 3 stubs (reports/care/sharing partial) | routes-fleet |
| E | Global typography Source Serif 4 | design-fleet |
| F | Deep test: analyze, test, browser :8765, ASC poll | verify-fleet |
| G | Package audit + TestFlight rebuild if native changes | ship-fleet |

## Acceptance (morning)

- `cd flutter && flutter analyze lib/` 0 errors
- `flutter test` all pass
- Browser agent verified :8765 vs prod for Settings, Tools/Apple Health, core tabs
- Apple Health connect path works on iOS (code + entitlements verified; simulator/device log)
- Settings hub matches web section order and wired prefs where RLS allows
- `CURSOR_HANDOFF.md` updated with evidence, not claims

## Do not

- Ask operator to test URLs or unlock phone (agent verifies; note blockers only)
- Ship Capacitor (`ios:testflight:capacitor`)
- Stop at "Wave 1 done"
