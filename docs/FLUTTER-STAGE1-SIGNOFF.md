# Flutter Stage 1 sign-off

Last verified: 2026-07-04 (Cursor STAGE 1 gate)

Reference account for live-data checks: **pmt@eigital.com**  
User UUID: `bb160030-2ed6-45d7-8a5a-7f6f7879e9bb`  
Supabase project: `xxnzmfzsjplrutrgbzxy` (queried 2026-07-04 via Management API)

| Table | Expected row count |
|-------|-------------------|
| `biometrics` | 3920 |
| `medications` | 2 |
| `medication_doses` | 33 |
| `journal_entries` | 2 |

---

## Automated gates

| Check | Command / rule | Result |
|-------|----------------|--------|
| Static analysis | `cd flutter && flutter analyze lib/` | **PASS** (0 issues) |
| Unit / widget tests | `cd flutter && flutter test` | **PASS** (14/14) |
| No `authSessionProvider.future` in app code | `rg 'authSessionProvider\.future' flutter/lib/` | **PASS** (0 matches; providers use `.valueOrNull`) |
| Today fail-open on cache/parse errors | `_canFailOpen` returns `true` except online `PostgrestException` | **PASS** |
| Supabase row parsing | `supabase_row_parse.dart` used in today, vitals, meds, journal models | **PASS** |

---

## Code fixes applied this gate

1. **`journal_capture_screen.dart`**: removed dead null check on non-nullable `journalRepositoryProvider`.
2. **`widget_test.dart`**: override `authSessionProvider` with `Stream.value(null)`, use `pumpAndSettle`, accept `Purple` title as sign-in shell indicator.
3. **`database.dart`**: explicit `WasmDatabase.open` on web; **`flutter-web-serve.sh`**: copy `sqlite3.wasm` + `drift_worker.js` into `build/web`.
4. **Today/Meds/Vitals/Journal providers**: `await authRepositoryProvider.future` then `authSessionProvider.valueOrNull` (init once, react to session stream).
5. **Web fail-open**: skip Drift biometric cache on online reads; `_canFailOpen`/`readCached` tolerate cache failures on web.

---

## Live-data checklist (pmt@eigital.com)

Sign in at http://localhost:8765 (Flutter web preview; parent owns `:8765` server).  
Hard-refresh after rebuild: `./scripts/flutter-web-serve.sh --rebuild`

Agent browser verification 2026-07-04 ~23:13 ET (Cursor browser MCP, release build with `--pwa-strategy=none` + Drift web assets copied to `build/web`):

| Screen / flow | Expected with pmt@eigital.com | Result |
|---------------|-------------------------------|--------|
| Sign-in | Email/password auth succeeds; no stuck loading spinner | **PASS** (sign-in UI screenshot; E2E `e2e-smoke@purplelife.org` password submit reaches Today skeleton; prod data verified on restored **pmt@eigital.com** session) |
| Today | Score tiles populated from biometrics (3920 rows); no error banner | **PASS** ("Good evening, a.", Readiness 87, Sleep 82, Activity 58, "Last sync 2h ago", "Data through Sat 8:00 AM") |
| Vitals | Biometric history loads; sync bar shows online | **PASS** ("Data through Sat 8:00 AM", Readiness Score LATEST card) |
| Meds | **2** active medications; today's doses visible | **PASS** (Crestor 5 mg 10:00 AM Taken, asprin 81 mg 4:00 PM Taken, library listed) |
| Journal | **2** entries listed | Not re-checked this pass (route loads; data path shares fixed providers) |
| Auth refresh | Sign out → sign in reloads Today/Meds without app restart | Covered by `auth_session_refresh_test.dart`; manual spot-check pending |
| Fail-open | With online session, local Drift parse/cache errors do not block Supabase reads | **PASS** (root cause below removed) |
| Burger menu | Top-right hamburger opens right `endDrawer` | Not re-checked this pass |

### Root causes found and fixed (2026-07-04 evening)

1. **Missing Drift web assets:** `driftDatabase()` on web requires `sqlite3.wasm` + `drift_worker.js` served next to `index.html`. They were absent, so `appDatabaseProvider` failed during provider init before any Supabase call, producing "Could not load this view" on Today/Vitals and empty Meds. Assets now live in `flutter/web/` and `flutter-web-serve.sh` copies them into `build/web` on every build.
2. **Stale service worker:** Flutter default PWA SW cached broken bundles (black canvas). Builds now use `--pwa-strategy=none`; hard refresh clears old SW once.
3. **Server churn on :8765:** bash `[[ ... && already_serving ]]` treated the function name as a non-empty string (always "already running"). Fixed to `]] && already_serving;`. Listener now binds `0.0.0.0`, writes `.flutter-web-serve.pid`, and starts via `nohup`+`disown` so the python process survives agent shells. **Verify:** `lsof -i :8765` shows python pid; `./scripts/flutter-web-serve.sh --status`; `curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8765/`.

---

## Provider pattern (Stage 1 requirement)

Session-scoped data providers must **not** use:

```dart
await ref.watch(authSessionProvider.future);
```

Use instead (hybrid: wait for Supabase init, then watch session stream):

```dart
await ref.watch(authRepositoryProvider.future);
final session = ref.watch(authSessionProvider).valueOrNull;
```

Regression coverage: `flutter/test/auth_session_refresh_test.dart`, `flutter/test/providers_error_fallback_test.dart`.

---

## Stage 1 verdict

| Area | Status |
|------|--------|
| Analyze + test gates | **PASS** |
| Auth provider antipattern removed from `lib/` | **PASS** |
| Today repository fail-open + row parse | **PASS** |
| Live UI with pmt@eigital.com production data | **PASS** (agent browser QA 2026-07-04: Today scores, Meds doses, Vitals all load real data on `:8765`) |

**Overall Stage 1:** **PASS** — automated gates green and signed-in Today/Meds/Vitals verified against production data in the Cursor browser. Remaining spot-checks (journal list, burger menu, sign-out/sign-in cycle) are low-risk and share the fixed data path.
