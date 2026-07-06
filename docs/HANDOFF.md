# HANDOFF

Current state of the world. Read this first, every session. Update before any task is
done. Newest entries at the top of the log.

Enforced by `.cursor/rules/00-handoff.mdc`. Extended ops: `CURSOR_HANDOFF.md`.

---

## Current snapshot

**2026-07-05 orchestrated fix fleet — SHIPPED to TestFlight as 1.0 (19).** Waves 1+2 landed on `lovable/redesign`, pushed to origin (`4d84721`), iOS archive + ASC upload **succeeded** (`** EXPORT SUCCEEDED **`). 11 slices integrated (meds / vitals / biometrics / reports / insights / ask-purple + care-chat / nav+timeline / settings depth + regression fixes; care-accept client wiring + new `/api/care/*` Worker routes; docs). Gates: `flutter analyze lib/` **clean**, `flutter test` **116/116**.

**Not done — HANDED TO CURSOR** (see the "TF19 ship + Cursor handoff" log entry below and OPEN-ISSUES `care-accept-server-route`): (1) **DEPLOY** the new `/api/care/accept`+`/api/care/decline` Worker routes to web prod (written, `tsc`+`build` pass, NOT deployed); (2) caregiver invite-accept still **not functional end-to-end** — the in-app invites card is dead code (client RLS returns 0 rows; needs a server-listed source); (3) **Wave-3 native pickers** → reports upload + chat attachments still non-functional on device; (4) AI features (insights noticing/pattern cards, reports AI-explain) remain **web-only** (no Flutter endpoint); (5) **on-device verification** of TF19 (checklist in log entry).

**`origin/lovable/redesign` @ `4d84721`** (pubspec **1.0.0+19**, pushed 2026-07-05). **`main` @ `ef05394`** unchanged — the fleet is **NOT merged to `main`**, and the Cloudflare web-prod deploy of the care-API routes is a **separate owner-gated step, NOT done**.

**TestFlight 1.0 (19):** uploaded 2026-07-05 ~20:38 PT, **processing** (VALID expected in ~5–15 min; not yet in ASC list at upload time). Carries the full waves 1+2 fleet; replaces the Capacitor WebView binary on install. **1.0 (18)** VALID / IN_BETA_TESTING remains the prior installable build.

**Flutter gates:** `flutter analyze lib/` **clean**; `flutter test` **116/116** (was 91; +25 tests across the fleet). 9 untracked `* 2.*` Finder duplicates removed from `flutter/lib` to unblock analyze (not in git).

**Next action (Cursor):** poll ASC for **1.0 (19) VALID** + tester install; deploy the care-API Worker routes; fix the dead invites-card source; run the on-device verification checklist. Still open from before: Luciq MCP crash triage; Oura console redirect (owner).

---

## Log

### 2026-07-05T20:45:00Z — TF19 ship + Cursor handoff (waves 1+2 fleet)

- **Requested:** After the fleet completed + gates passed, commit everything, push live, build/upload TestFlight, and write a proper handoff — operator is moving next steps to Cursor.
- **Done:**
  - **Integrated 11 branches** onto `wave2-base` then fast-forwarded `lovable/redesign`: `wave1-{meds,vitals,nav-timeline,care-reports}` (Wave 1) + `wave2-{foundation,biometrics,reports,insights,askpurple,carechat,caredash,careapi,docs,settings,reviewfix}` (Wave 2). Each landed with `flutter analyze lib/` + `flutter test` gate; final combined gate **analyze clean + 116/116**.
  - **Bumped** `flutter/pubspec.yaml` → **1.0.0+19** (`4d84721`).
  - **Pushed** `origin/lovable/redesign` `4f69041..4d84721` (32 commits; no divergence).
  - **Built + uploaded TF19:** `doppler run --project purple-life --config prd -- bun run ios:testflight` → `** EXPORT SUCCEEDED **`, `Upload succeeded`, `Uploaded Runner`. ASC processing at upload time (build 19 not yet listed; 18 latest VALID).
  - **Feature scope shipped:** meds edit-data-loss fix + history tokens; vitals VO₂/elevated-band regressions + My Health conditions/DNA cards; **biometrics** 18-metric hub (range/compare, ±1σ baseline, per-source, pins); **reports** fl_chart trends + detail depth (signed-URL view/share, delete, panel grouping, processing-poll) + documents filters; **insights** vitals tiles/records counts/seizure heatmap/trends; **ask-purple** action cards + markdown/citations + 10/day limit + save-to-journal; **care-chat** realtime + thread mgmt (new/group/mute/leave); **care-dashboard** biometrics depth + honest gap-states + `/care/:ownerId/reports/:reportId` route; **nav** Meds→Insights + timeline dose actions + inbox badge; **settings** OAuth deep-link fix (`FlutterDeepLinkingEnabled=false`), welcome rewrite + conditions, 2FA (`supabase.auth.mfa`), export enrichment, `/settings/terms` + privacy cards, sharing partial; **web** new `src/routes/api/care/{accept,decline}.ts` + `src/lib/care.server.ts` (tsc + build pass).
  - **Review:** independent Wave-1 audit ran; its 1 BLOCKER (timeline dose actions not flushing before refetch) + 2 should-fixes were fixed in `wave2-reviewfix` and verified (116/116).
  - **Decisions:** ship Ask-Purple 10/day limit **as-is for all native users** (no Pro flag yet); push + TF now (operator-approved). Native pickers deferred to Wave 3.
- **Issues / NOT done (handed to Cursor):**
  - **DEPLOY care-API Worker routes.** `/api/care/accept`+`/api/care/decline` are written + build-verified but **NOT deployed** to web prod. Until deployed, the Flutter `acceptInvite` POST 404s.
  - **Caregiver invite-accept not functional end-to-end** even after deploy: the in-app `IncomingCareInvitesCard` is **dead code** (client RLS SELECT on `care_relationships` returns 0 rows for the invitee; web uses service-role `listIncomingCareInvites`). Needs a server-listed source before the Accept button surfaces. Also `decline` still does an RLS-blocked silent 0-row update client-side until rewired to `/api/care/decline`.
  - **Caregiver dashboard tabs** (Meds/Journal/Seizures/Reports/Today/Hydration/Chat) render honest gap-states — need Worker routes fronting `caregiverRead*` server fns (full list in OPEN-ISSUES `care-accept-server-route`, with `care.functions.ts` line refs + the `phi_access_log` requirement for `caregiverReadReport`).
  - **AI features web-only:** insights "noticing"/pattern cards, reports AI-explain (`getDailyInsightCards`, `computeUserPatterns`, `summarizeReport`, `getMetricInsight`, `getVitalsSnapshot`) — no Flutter endpoint; gap-stated, not faked.
  - **Wave-3 native pickers:** reports upload + care-chat attachments are non-functional on device (no `image_picker`/`file_picker`; send-attachment stubbed, receive/render done).
  - **On-device verification NOT done** (no simulator here): TF19 checklist — (a) OAuth Connect deep-link after the `FlutterDeepLinkingEnabled=false` change; (b) fl_chart rendering (biometrics/reports/insights); (c) biometrics pin write to `profiles.biometrics_pinned` (column confirmed present in types); (d) report **delete** under RLS (`report_documents` DELETE + `storage.reports.remove` + `phi_access_log` INSERT); (e) dose-action sync flush; (f) 2FA enroll/verify.
  - **`main` NOT updated** — fleet is only on `lovable/redesign`; web-prod Cloudflare deploy is a separate owner-gated step.
  - Residual `fontFamily:'Georgia'` in `apple_health_panel.dart` + `wearable_oauth_callback_screen.dart` (non-blocking).
- **Stand / next (Cursor):** ① poll `bun run ios:check-asc-builds` for **1.0 (19) VALID**, tester install; ② deploy `/api/care/*` routes (+ Flutter `decline` rewire) then re-source the invites card; ③ expose caregiver-dashboard + AI Worker routes per OPEN-ISSUES; ④ Wave-3 native pickers; ⑤ run the on-device checklist; ⑥ decide `main` merge + web-prod deploy.
- **Who / where:** Claude Code (orchestrated fleet: 5 audits + 4 Wave-1 writers + 6 Wave-2 writers + foundation + careapi + docs + reviewfix + settings + independent review) · darwin · `lovable/redesign@4d84721` (pushed).
- **Timestamp:** 2026-07-05T20:45:00Z

### 2026-07-05T00:00:00Z — Wave-2 reports depth (trend charts, detail actions, documents filters)

- **Requested:** Wave-2 Reports build, client-doable only, edit ONLY `flutter/lib/features/reports/`. (P0) fl_chart trend charts + per-metric sparklines; (P0/P1) report-detail depth (panel-grouped metrics, processing-poll, status pill, signed-URL View/Download/Share, delete); (P1) documents client-side search+filters; wire AI explain/metric-insight only if a callable endpoint exists else honest web-only state. Defer native file upload (no picker deps). Branch `wave2-reports`, worktree off Wave-1+foundation (fl_chart present).
- **Done:**
  - **Trend charts (P0):** new `widgets/trend_chart.dart` — fl_chart `MetricLineChart` (curved line + `HorizontalRangeAnnotation` shaded reference band, out-of-range dots colored via `danger`/`warning` tokens) and `MetricSparkline`. Rendered line+band on `reports_trend_screen.dart` (readings list now shows source report title via joined `report_documents(title)`), sparklines per row on `reports_metrics_screen.dart`. Removed both "charts on web" footers. Added `loadAllMetricSeries` + `allMetricSeriesProvider` (single grouped query feeding grid sparklines).
  - **Report detail (P0/P1):** rewrote `reports_detail_screen.dart` as `ConsumerStatefulWidget`. Panel-grouped metrics (`metric_dictionary.panel` join in repo `_attachPanels`; `ReportDetailData.metricsByPanel`, "other" last). Colored status pill. **Processing poll:** `Timer.periodic` 3s invalidating `reportDetailProvider` while `status==processing`, cancels on ready/failed/dispose. Action bar (44pt): **View file** → `getReportFileUrl` (Supabase `createSignedUrl(path,300)`) opened with `launchUrl(externalApplication)` (native browser, no in-app iframe); **Share link** → copies signed link to clipboard (no `share_plus` dep in app); **Delete** → confirm dialog → `deleteReport` (storage.remove + row delete + `phi_access_log`), invalidates hub/tracked providers, routes back; if RLS blocks, throws → honest "remove from web app" snackbar (no fake success). Failed state now shows `error_message`.
  - **AI explain (server-gap, honest):** `summarizeReport`/`getMetricInsight` are server AI fns (`callAIForUser` + credits) with **no Flutter-callable endpoint** — NOT wired. Detail screen shows the cached `report_documents.ai_summary` when the web app has generated one, else an honest "generated on the web app" card. No fabricated summaries.
  - **Documents (P1):** `reports_documents_screen.dart` → stateful client-side search + single-select category/type/year/status filter chips over the already-loaded `reportsHubProvider` list (chips auto-hidden when <2 options), clear-filters, filtered count header. Bulk-zip + reprocess left deferred and flagged in-copy.
  - **Model/repo:** `report_row.dart` — added `aiSummary`/`errorMessage` to `ReportDocumentRow`; `panel`/`reportTitle`+`copyWith` to `ReportMetricRow` (join-aware `fromMap`); `metricsByPanel`; `ReportFileRef`. `reports_repository.dart` — extended doc selects with `ai_summary,error_message`; `loadMetricSeries` joins `report_documents(title)`; added `getReportFileUrl`, `deleteReport`, `loadAllMetricSeries`, `_attachPanels`. **`loadHub` + all existing method signatures unchanged** (insights still reads `reportsHubProvider`); everything additive.
  - **Tests:** new `test/reports_detail_model_test.dart` (5 tests: join parse, copyWith, metricsByPanel grouping, ai_summary/error_message columns).
- **Issues / server-gaps flagged (honest, not faked):**
  - **AI explain report + per-metric AI insight = server-gap.** `summarizeReport`/`getMetricInsight`/`getDailyInsightCards`/`getMetricTrend` insight run server-side AI (provider + credits); no Worker/RPC/Edge endpoint is exposed to Flutter. Rendered read-only (cached `ai_summary`) or web-only state. Needs an Edge Function/Worker route to enable in-app generation. (Same class as Wave-1 care-accept server-route gap.)
  - **Delete RLS unverified on-device.** `deleteReport` mirrors the web fn but the web `deleteReport` runs as a `createServerFn` — if `report_documents` DELETE / `storage.reports.remove` is not permitted to the auth'd user under RLS, the client delete throws and the UI shows a clear "remove from web app" message rather than silently failing. Verify the DELETE RLS policy (and `phi_access_log` INSERT policy for user==actor) on-device before relying on it.
  - **`metric_dictionary` read assumed RLS-readable** (used only for panel labels); `_attachPanels` is best-effort and returns ungrouped metrics on any failure, so grouping degrades gracefully.
  - Share uses clipboard, not an OS share sheet (no `share_plus`; adding deps was out of scope). Native upload picker deferred to Wave 3 as instructed (upload path untouched).
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **No issues found!**; `flutter test` **96/96** (91 baseline + 5 new). Committed `wave2-reports` @ `b63a131`, **not pushed**. **Next:** on-device verify signed-URL View + Delete RLS; expose an AI-explain endpoint (Edge Fn/Worker) if in-app generation is wanted; Wave-3 native file picker.
- **Who / where:** Claude Code (Wave-2 reports writer) · darwin · wave2-reports@b63a131
### 2026-07-05T00:00:00Z — Wave-2 Ask-Purple parity (action cards, markdown/citations, daily limit, follow-ups, save-to-journal)

- **Requested:** Ask-Purple (AI chat) web→Flutter parity per `wave2-specs/chat.md §1`: (P0) tool-action confirm cards + direct-Supabase executor for 5 kinds; (P0) markdown + `[Source: … ](url)` citation pills; (P1) free-tier 10/day limit; (P1) follow-up chips + Save-to-journal. Branch `wave2-askpurple`, worktree only. Scope: `flutter/lib/features/chat/ask_purple_screen.dart`, `chat_repository.dart`, `chat_copy.dart` (+ new files under `features/chat/`). Did NOT touch `care_chat_*`.
- **Done:**
  - **`chat_repository.dart`:** `sendAskPurple` now yields `AskPurpleChunk{text, proposals}` — parses `tool-proposeAction` parts (`input`/`args` → `{kind, summary, params}`) in addition to `text-delta`/`error`. Added `ProposalKind` enum (5 kinds + labels), `Proposal` model (with `displayParams` filter dropping null/""/empty-array), `ActionResult`. Added `executeAction(Proposal)` — Dart port of server `executePurpleAction`, direct RLS-scoped Supabase writes replicating tables/payloads exactly (`medications` insert w/ `is_rescue`/`active`; `seizure_events` insert w/ `detection_source:'ai_chat'`; `journal_entries` insert `status:'processing'`; `medication_doses` update-by-scheduled_at else insert; `medications` archive update `active:false`+`end_date` YYYY-MM-DD; validation errors name/text/medication_id required). Added `saveAnswerToJournal` (insert `journal_entries` `status:'complete'`, `ai_tags:['ask-purple']`, exact `**Q:**/**Purple:**` body). Provider now injects `supabaseClientProvider`.
  - **New `action_confirm_card.dart`:** `ProposalStatus` enum + `ActionConfirmCard` (kind label, summary, filtered param list, Confirm/Cancel, pending/confirmed→Done/cancelled/failed states), dark-glass via `GlassSurface`, `colorScheme.primary`/`.error`, 44pt targets.
  - **New `citation_text.dart`:** `CitationText` renders assistant markdown via `flutter_markdown` `MarkdownBody`, splits `[Source: …](url)` regex into tappable (primary-tinted) / muted pills, opens links via `url_launcher`. User bubbles stay plain `Text`.
  - **New `ask_limit.dart`:** `AskLimit` — SharedPreferences key `purple-ask-message-stamps`, JSON epoch-ms array, 24h window, `freeDailyLimit=10`, `usedToday()`/`pushStamp()`.
  - **`condition_prompts.dart`:** added `getFollowUps(conditions, lastUserMessage)` (topical keyword hints + starters, dedup, cap 3) mirroring web.
  - **`ask_purple_screen.dart`:** rewired transcript to carry per-turn proposals/statuses; renders action cards, follow-up chips under last idle proposal-less assistant turn, Save-to-journal button per idle assistant turn; markdown/citation bubbles; daily-limit block (snackbar over limit) + `_LimitGate` composer replacement + "N left" hint at ≤3; preserved offline guard, SafeArea, streaming.
  - **`chat_copy.dart`:** added action/journal/limit copy strings.
  - **Tests:** added 5 unit tests in `test/chat_routes_test.dart` (follow-up topical/fallback/dedup; proposal kind mapping; displayParams filter).
- **Issues / SERVER-GAPS flagged:**
  - **No native Pro entitlement flag exists in Flutter** (account screen defers subscription to web). Web gates the limit on `useIsPro()`; there is no equivalent client flag, so the **10/day free limit applies to ALL native users** and the over-limit `_LimitGate` is an upsell pointing to purplelife.org rather than a real ProGate. If Pro users must get unlimited on native, a Pro/entitlement flag (or `/api` check) needs to be exposed to the client — flagged, not faked.
  - **Action executor writes go directly to Supabase under RLS** (per spec, matching the pattern) — no worker route. Assumes the same user INSERT/UPDATE RLS policies the web user-scoped client relies on are in place for `medications`, `seizure_events`, `journal_entries`, `medication_doses`. If any table lacks a user policy, that kind's Confirm surfaces the Supabase error on the card (fail state), not a silent no-op.
  - `mark_dose_taken` update-by-`scheduled_at` cannot report 0-row matches as an error; mirrors web (web also returns ok on 0 rows).
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **clean (No issues found!)**; `flutter test` **96/96** (91 prior + 5 new). Committed on `wave2-askpurple` (NOT pushed). **Next:** parent lands slice + runs gate; web/product decides on native Pro flag for unlimited.
- **Who / where:** Claude Code (Wave-2 Ask-Purple writer) · darwin · wave2-askpurple
### 2026-07-05T00:00:00Z — Wave-2 Care-chat parity (realtime, thread mgmt, rendering polish)

- **Requested:** Bring Flutter Care chat to web parity. P0 realtime inbound + 15s thread-list poll; P0 thread management (New-chat picker, group list/create, mute/leave menu); P1 rendering polish (day separators, "Message deleted" tombstone, group sender names). Defer attachment *sending* to Wave 3. Branch `wave2-carechat`, worktree off wave2 base. Strict scope: `flutter/lib/features/chat/care_chat_*` only.
- **Done:**
  - **Realtime (P0):** `CareChatRepository.subscribeThread(threadId, onInsert)` opens Supabase channel `care-thread-<id>` with `onPostgresChanges(insert, public.care_messages, filter thread_id=eq.<id>)`; `removeChannel` teardown helper. `_ConversationPanel` subscribes in `initState`, tears down + re-subscribes in `didUpdateWidget` on thread change, and disposes in `dispose`. Inbound inserts merge into a local `_liveById` map (dedup by id), auto-mark-read + refresh threads when from another sender, and scroll to bottom. Own sent message is merged locally to avoid an echo race.
  - **Thread-list poll (P0):** `ChatCareScreen` is now `ConsumerStatefulWidget` with a 15s `Timer.periodic` that invalidates `careThreadsProvider`.
  - **Thread management (P0):** new repo methods `listContacts` (both relationship directions for New-chat), `listMyCaregivers` (group picker), `listGroupThreads`, `createGroupThread`, `setThreadMute`, `leaveThread` — payloads/tables/validation exactly per web `care-chat.functions.ts` (mute clears `muted_until:null`; owner-cannot-leave error string matched). New providers `careContactsProvider`/`careMyCaregiversProvider`/`careGroupThreadsProvider`. New file `care_chat_pickers.dart`: dark-glass bottom-sheet **New-chat** picker (wires existing `getOrCreateDirectThread`) and **Group** picker (list existing / create with title + caregiver checkboxes). Header buttons "New" + "Group" replace the old single "Sharing" button (empty-state "Go to Sharing" retained). Per-thread `PopupMenuButton`: Mute/Unmute (all), Leave (non-owner only, confirm dialog); muted threads show a bell-off indicator.
  - **Rendering polish (P1):** `CareMessage` extended with `attachments` (List<CareAttachment>) + `deletedAt`; `getMessages` now selects `attachments`, keeps tombstones (no longer silently filters deleted), and supports `before` pagination (limit capped ≤200). Bubbles now render per-day separators (Today/Yesterday/Mon D, YYYY), "Message deleted" italic tombstone, sender-name label above others' bubbles in group threads, and received attachments.
  - **Attachments (view-only):** new file `care_attachment_view.dart` renders stored attachments via `createSignedUrl(path, 300)` (image thumbnail / file row with MB label, opens via url_launcher). `sendMessage` now accepts `List<CareAttachment>` and inserts real attachment JSON. **Sending/adding** attachments is deferred: explicit `// TODO(wave3): attachments` at the composer paperclip spot; no image_picker/file_picker added.
- **Issues / server-gaps flagged:**
  - **Native push on send is NOT implemented (backend/Wave-3).** Web `sendCareMessage` sends web-push to non-muted recipients; native equivalent is server/edge-triggered (FCM/APNs). Left a `TODO(wave3)` in `sendMessage`; do not send push from client. Muted-recipient filtering must live wherever native push is generated.
  - **Attachment *sending* deferred** (needs native picker) — receive/render path is complete and live.
  - Realtime depends on Supabase Realtime being enabled for `public.care_messages` on the project; if the channel never receives, inbound still arrives via the 15s poll + on-send refetch (graceful degrade). Malformed realtime payloads are swallowed.
- **Risks:** Subscription lifecycle is the main risk — handled: single channel per active thread, torn down on thread switch and dispose (no leak, no double-subscribe). `_liveById` is cleared on thread change so live messages don't bleed across threads.
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **No issues found!**; `flutter test` **91/91**. Committed on `wave2-carechat` (NOT pushed). **Next:** Wave-3 native attachment picker + server/edge push trigger; then device QA of live inbound.
- **Who / where:** Claude Code (Wave-2 care-chat writer) · darwin · wave2-carechat
### 2026-07-05T00:00:00Z — Wave-2 care dashboard depth + honest gap states + report route

- **Requested:** Wave-2 Care dashboard slice (Flutter-only, branch `wave2-caredash`, worktree off Wave-1+foundation). Deepen client-reachable tabs, replace vague "coming soon" with honest gap states for backend-blocked caregiver reads, add `/care/:ownerId/reports/:reportId` route + a CareReport screen. Strict scope: only `care_dashboard_screen.dart`, a NEW care report screen, `shell/router.dart`, `shell/routes.dart`. Accuracy over coverage; no fabricated data, no RLS bypass.
- **Done:**
  - **Biometrics tab (genuinely client-reachable):** rewrote `_BiometricsPlaceholder` → `_BiometricsTab` + `_BiometricMetricCard`. Renders one labeled card per wearable metric actually selected by `CareRepository.loadOwnerBiometrics` (readiness, sleep_score, activity, hrv_rmssd_ms, resting_hr_bpm, steps) with latest value + date + 30-day range, replacing eight identical readiness tiles. Preserves scope-gating (`scopeGranted`), cached-state banner, empty/error states. No repo changes (`care_repository.dart` untouched, per scope).
  - **Backend-blocked tabs (honest gap):** replaced generic `_ComingSoonPanel` with `_CaregiverAccessGate` (polished glass EmptyState) for Today, Meds, Journal, Seizures, Reports, Hydration, Chat. No-scope variant reused for biometrics-without-scope.
  - **New route + screen:** `care_report_screen.dart` (`CareReportScreen`) renders the honest gap state (dark-glass, EmptyState, 44pt back button). Registered `/care/:ownerId/reports/:reportId` as a child of `care-dashboard` GoRoute (name `care-report`); added `careOwnerReport` const + `careReport(ownerId, reportId)` helper to `routes.dart`. `/care` already a protected prefix so auth-gating is covered.
  - Made the caregiver "add biometric" toolbar button honest (was a dev-stub snackbar).
- **Issues / SERVER GAPS (routes needed, all currently server fns in `src/lib/care.functions.ts`, `supabaseAdmin` + `assertScope`, not Flutter-callable):** `caregiverReadToday` (1356) → Today; `caregiverReadMeds` (1233) + `caregiverMarkDose` (1414) → Meds; `caregiverReadJournal` (1274) + `proposeChange` (978) → Journal; `caregiverReadSeizures` (1289) + `caregiverLogSeizure` (1469) → Seizures; `caregiverReadReports` (1303) → Reports tab; `caregiverReadReport` (1323, must preserve `phi_access_log action:caregiver_view`) → CareReport screen; `listHydrationForDay`/`listAurasForDay` (scoped by ownerId) → Hydration; `getOrCreateDirectThread` (care-chat.functions.ts) → Chat; caregiver `addBiometric` write → toolbar. Recommend exposing each as a Worker route (Bearer session) mirroring `POST /api/care/accept`, preserving `assertScope`/`has_care_scope` + audit writes. Also NOT ported this slice: owner feature-gate on `scopedTabs` (`TAB_OWNER_FEATURE`), `CaregiverAlertsCard`, activity counts/unread badges (`getOwnerActivityCounts`/`markOwnerSeen`).
- **Stand / next:** `flutter analyze lib/` clean, `flutter test` 91/91. Committed `wave2-caredash` @ `1d7c5a1`, NOT pushed. Next: parent lands slice + runs gate; backend exposes caregiver server fns as Worker routes to wire the gap-stated tabs.
- **Who / where:** Claude (Opus 4.8), Flutter feature writer. Worktree `wt-caredash`, branch `wave2-caredash`.
- **Timestamp:** 2026-07-05T00:00:00Z
### 2026-07-05T23:00:00Z — Orchestrated fix fleet: Wave 1 landed + Wave 2 foundation + Wave 2 in flight

- **Requested:** Run an orchestrated multi-agent fix fleet on the Flutter app (branch `lovable/redesign`, base `4f69041`): close audit-found P0/P1 gaps (meds data-loss, care accept loop, My Health depth, nav parity, token cleanup), then build out Wave-2 depth (insights, care dashboard, charts/markdown foundation). Local only; no push; TF19 after landing.
- **Done:**
  - **Wave 1 (landed locally; gates `flutter analyze lib/` clean + `flutter test` 91/91 after each land):**
    - Meds **edit data-loss fixed**: form now hydrates the full medication row and partial update preserves unedited columns.
    - Meds history status colors **tokenized** + copy aligned with web.
    - VO2max unit suffix gated on non-null value; elevated risk band chip restored to the **warning** token.
    - My Health: **"Your conditions" grid** + **DNA insights card** added (non-navigating; target routes still missing).
    - Bottom nav 3rd tab switched **Meds → Insights** (web parity); Meds added to the menu sheet.
    - Timeline dose actions: **I took it / Skip / Undo** pills.
    - Care invite **Accept wired client-side**: POST `/api/care/accept`, in-app `/care/accept?token=` route + `CareAcceptScreen`; top-bar **pending-inbox badge**.
    - Token cleanup in reports/care: `0xFFFF8A80`→`danger`, `0xFFF3D58B`→`warning`, `0xFF1A1224`→`backgroundTertiary`.
  - **Wave 2 foundation (landed):** `fl_chart 0.69.2` + `flutter_markdown 0.7.7+1` (pure Dart, no native pods); new `flutter/lib/features/seizures/seizure_repository.dart` (`SeizureEvent`, `loadRecent`, `recentSeizuresProvider`).
  - **Wave 2 in flight (feature branches, gates green so far, NOT merged):**
    - `wave2-insights` @ `da858ae` — vitals tiles, records category counts, 90-day seizure heatmap + list, fl_chart trends; AI noticing/pattern cards honestly gap-stated as server-only.
    - `wave2-caredash` @ `1d7c5a1` — biometrics tab with real per-metric cards; other tabs honest gap-states; new `/care/:ownerId/reports/:reportId` route + `CareReport` gap-state screen.
    - askpurple / carechat / biometrics / reports writers **still running** at time of writing.
  - **Docs (this entry):** OPEN-ISSUES `care-accept-server-route` extended with the full Worker-route backlog; stale rows corrected in `FLUTTER-CUTOVER-GAP-MATRIX.md` (`/insights`, `/timeline` are registered, not Missing) and resolved items marked in `FLUTTER-DESIGN-PARITY-CHECKLIST.md` (§0 serif, §3 meds).
- **Issues:**
  - **All caregiver mutations and dashboard reads blocked server-side**: accept/decline plus every caregiver read (today, meds, journal, seizures, reports, hydration, chat thread) needs Worker routes fronting `src/lib/care.functions.ts` server fns; insights/reports AI cards also server-only. Full grouped backlog in OPEN-ISSUES `care-accept-server-route`. Flutter UI is wired and fails with clear errors, not silent no-ops.
  - Wave-2 writer branches not yet merged; each must land serially with gates before push. Nothing pushed; **TF19 pending**.
  - My Health conditions grid + DNA card are non-navigating (`/condition/$slug`, `/my-health-dna` routes still missing).
  - Residual `fontFamily: 'Georgia'` in `apple_health_panel.dart` and `wearable_oauth_callback_screen.dart` (out of Wave-1 scope; core screens all on `PurpleType.serif`).
- **Stand / next:** Wave 1 + Wave 2 foundation merged locally on the integration line; Wave 2 partially landed on branches. **Next:** finish remaining writers, land serially with gate-per-land, push `lovable/redesign`, web team adds Worker routes, then TF19.
- **Who / where:** Claude Code orchestrated fleet · darwin · lovable/redesign (local worktrees off base `4f69041`; wave branches `wave1-*`, `wave2-*`)
- **Timestamp:** 2026-07-05T23:00:00Z
### 2026-07-05T00:00:00Z — Wave-2 settings parity (6 audited fixes)

- **Requested:** 6 web→Flutter parity fixes on branch `wave2-settings`, scoped to `features/settings|account|tools`, `auth/welcome_screen.dart`, `shell/routes.dart`+`router.dart` (terms route only), and one Info.plist key.
- **Done:**
  1. **[P0] Wearable OAuth callback delivery.** Added `FlutterDeepLinkingEnabled=false` to `flutter/ios/Runner/Info.plist` (syntax verified against app_links 7.2.0 example plist in pub cache) so Flutter's engine deep-linking no longer steals the `org.purplelife.app://oauth-*-callback` from app_links' `uriLinkStream`. The `nativeConnectSetupHint` was ALREADY surfaced pre-connect in the Tools `_ConnectionCard` (shown when disconnected+loaded, before failure) — no change needed there; verified in `tools_screen.dart`.
  2. **[P1] Welcome screen.** Rewrote `welcome_screen.dart`: removed the dev copy ("keeps Flutter preview routing aligned with production"); ported web step-0 (first + last name, conditions picker writing `profiles.conditions`) using the read-only `condition_catalog.dart` catalog (grouped chips, max 12, prefill from existing profile). Invite-code redemption + generateCareProfile left as explicit TODO (Worker-blocked), no dead UI.
  3. **[P1] 2FA.** Replaced the "set up in the web app" stub in `account_screen.dart` with a real `_TwoFactorSection` using `supabase.auth.mfa` (enroll TOTP → challenge → verify → unenroll/disable), mirroring web `two-factor-section.tsx`. On-device it shows the TOTP secret + an "Open authenticator app" `otpauth://` deep link instead of a QR image (no second camera to scan on the phone itself); secret never logged. Removed the old `_loadTwoFactor`/`_twoFactorSection` and their state fields.
  4. **[P1] Data export enrichment.** `data_export_service.dart` per-entry journal markdown now includes `ai_tags`, kind/status line, `voice_transcript`, `ai_summary`, and `media_urls` links, matching web `data-export.ts`.
  5. **[P1] Terms + privacy cards.** New `features/settings/terms_screen.dart` (ports web `settings.terms.tsx`), `settingsTerms='/settings/terms'` const + protectedPaths entry in `routes.dart`, GoRoute in `router.dart`. Tools "Wear and care" terms row now points at `/settings/terms` (was substituting an About web-only snackbar; removed the now-unused `_showWebOnly`). Added the 3 missing privacy cards to `privacy_screen.dart`: "Where it's stored", "What we'll never do", "Children" (+ signed-links line on "Who can see" and backups line on "Export and delete").
  6. **[P1] Sharing screen partial.** `sharing_screen.dart` now wires DB-direct reads: pending-approval count via existing `carePendingCountProvider` (owner RLS SELECT, shown as a tappable strip → `/care/inbox`) and a new `archivedCaregiversProvider` (direct `care_relationships` SELECT where `archived_at IS NOT NULL`, owner RLS, collapsible "Show archived (N)"). Invite / scope editing / archive-unarchive-delete mutations kept web-only with explicit "blocked on Worker routes (care.functions.ts)" copy. No caregiver mutations invented.
- **Exact Info.plist key added:** `<key>FlutterDeepLinkingEnabled</key><false/>` (with a comment explaining app_links owns the OAuth deep link).
- **Gaps flagged / blocked (not faked):**
  - Welcome invite-code redemption + care-profile generation: no Worker `/api` route for `invite-codes.functions.ts` / `care-profile.functions.ts`; left as TODO, no placeholder UI.
  - Sharing caregiver mutations (invite/edit scope/archive/unarchive/delete): all web-side `care.functions.ts` server fns, no Worker route; kept web-only with explicit copy. Reads only in-app.
  - 2FA on-device uses secret + `otpauth://` deep link rather than a scannable QR (deliberate: enrolling on the same phone can't self-scan).
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **No issues found!**; `flutter test` **91/91**. Committed on `wave2-settings` (NOT pushed). Next: web team adds the Worker routes above to unblock welcome invite/care-profile and sharing mutations.
- **Who / where:** Claude Code (Wave-2 settings writer) · darwin · wave2-settings
- **Timestamp:** 2026-07-05T00:00:00Z

### 2026-07-05T00:00:00Z — Wave-1 care/reports fixes (accept loop, inbox badge, tokens)

- **Requested:** (P0) fix broken caregiver-invite accept loop; (P0) add missing top-bar inbox badge; (P1) token color cleanup in reports+care. Flutter-only, branch `wave1-care-reports`, worktree off `lovable/redesign`.
- **Done:**
  - **Accept loop:** added `inviteToken` to `IncomingCareInvite` + populated it in `care_repository.dart` `_loadIncomingCareInvites` (now selects `invite_token`). Implemented `CareRepository.acceptInvite(token)` mirroring web `acceptInvite` contract shape (authenticated `POST {invite_token}` to `${workerApiBaseUrl}/care/accept`, Bearer session token, WorkerClient conventions). Replaced dead-snackbar Accept button in `incoming_care_invites_card.dart` with a real accept (loading spinner, error snackbar, navigates to owner dashboard on success). Added new `CareAcceptScreen` (`features/care/care_accept_screen.dart`) and in-app GoRoute `/care/accept?token=` in `shell/router.dart` (+ `careAccept` const in `routes.dart`); signed-out users are redirected to sign-in with token preserved via existing `authRedirect` `from` mechanism (`/care` is already a protected prefix).
  - **Inbox badge:** added `CareRepository.pendingChangesCount()` + `carePendingCountProvider` (mirrors web `getPendingChangesCount`: `pending_changes` where `owner_id=me AND status='pending'`, readable under `pending_owner_all` RLS — no service role). Added `_PendingInboxBadge` widget in `shell/top_bar.dart` after the sync button, before profile menu, 44pt tap target, purple count pill, navigates to `/care/inbox`; hidden when count 0.
  - **Tokens:** `0xFFFF8A80`→ token `danger`, `0xFFF3D58B`→ token `warning` (via `parseTokenColor(PurpleTokens.loaded.colorsFor('dark').*)`) in reports_detail/trend/upload; modal surface `0xFF1A1224`→`PurpleColors.backgroundTertiary` (care_dashboard, ×2). Routed all inline `GoogleFonts.sourceSerif4()` in-scope through `PurpleType.serif` (reports_detail/trend/medical-history/report_tiles/reports_layout, care_index ×2, care_inbox ×2). Skipped web-only mint `#5CE0AC` per instructions.
- **Issues / RISK:**
  - **Accept + decline require a server route that does not yet exist.** RLS gives caregivers **SELECT-only** on `care_relationships` (`care_rel_caregiver_select`; no caregiver UPDATE policy — see migration `20260527094605...`). The web accept UPDATE runs with **service role** via a TanStack `createServerFn`, which is **not** exposed as a stable `/api/...` Worker route (no `src/routes/api/care/accept.ts`). Flutter's `acceptInvite` posts to `/api/care/accept` (matching the established mirror pattern) but that route must be added on the **web/Worker** side before accept works end-to-end; until then the call returns a clear error, not a silent no-op. **The pre-existing `declineIncomingCareInvite` direct `.update({'status':'revoked'})` is ALSO RLS-blocked today** (silent 0-row no-op) — same root cause; not fixed here (out of P0 scope, needs the same server route or a decline route). See OPEN-ISSUES `care-accept-server-route`.
  - Did NOT weaken RLS or invent a Supabase mutation. Did NOT edit `core/api/worker_client.dart` (out of scope); the authenticated POST lives inside `care_repository.dart` and duplicates WorkerClient's auth/URL conventions.
  - Touched `lib/shell/routes.dart` (one-line route const) in addition to router.dart/top_bar.dart — necessary to register the new route; did not touch bottom_nav/shell_menu_sheet/pubspec/ios.
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **clean**; `flutter test` **91/91**. Committed on `wave1-care-reports` (not pushed). **Next:** web team adds `POST /api/care/accept` (and ideally `/api/care/decline`) Worker route fronting the `acceptInvite` server fn, with Flutter CORS; then re-verify accept/decline end-to-end on device.
- **Who / where:** Claude Code (Wave-1 writer) · darwin · wave1-care-reports
- **Timestamp:** 2026-07-05T00:00:00Z

### 2026-07-05T16:02:00Z — Luciq MCP + Doppler integration

- **Requested:** Wire Luciq OAuth token from `servers-teamkeys/dev` for agent crash triage.
- **Done:** `scripts/luciq-sync-doppler-secrets.sh`, `scripts/install-luciq-mcp-cursor.sh`,
  `luciq:sync-secrets`, `luciq:install-mcp` in `package.json`; `luciq-fetch-reports.mjs`
  accepts `LUCIQ_OAUTH_TOKEN`, returns `status: mcp` when REST 401 (MCP token expected);
  synced `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` to `purple-life/prd`; installed Luciq MCP
  in `~/.cursor/mcp.json` (restart Cursor required).
- **Verified:** MCP HTTP `initialize` 200; `list_applications` shows **Flutter - Purple**
  (`slug=flutter-purple`, beta) and **Purple** iOS (`slug=purple`, beta); `list_crashes` returns
  **0 crashes** on both (matches ASC crash submissions API empty for Jul 4 feedback).
- **Issues:** Legacy dashboard REST still 401 with MCP OAuth token; use Luciq MCP for stacks.
  Jul 4 "App is crashing" screenshot feedback has no Luciq stack yet (SDK may not have fired or
  tester on pre-Luciq build).
- **Stand / next:** Restart Cursor for in-IDE Luciq MCP; retriage after TF18+ installs with SDK;
  re-run `ios:check-tf-feedback`.
- **Who / where:** Cursor agent · darwin · main
- **Timestamp:** 2026-07-05T16:02:00Z

### 2026-07-05T14:47:54Z — TestFlight 18 ship (merge wave)

- **Requested:** Sync `lovable/redesign` with `main`; bump **1.0.0+18**; analyze + test; `ios:testflight`; ASC checks; HANDOFF.
- **Done:** `lovable/redesign` already contained `origin/main` (`ef05394`); pushed **`3afdcbb`** (pubspec +18), **`68bf214`** (const analyze fixes). `flutter test` **91/91**. `doppler run --project purple-life --config prd -- bun run ios:testflight` **EXPORT + upload OK** (~4 min). `ios:check-asc-builds` / `ios:check-tf-feedback` run (10 beta screenshots; synced-data / sync UX themes).
- **Issues:** ASC list not yet showing build **18** (processing). TF17 still **VALID** / internal **IN_BETA_TESTING**. Duplicate `* 2.dart` files on disk can break analyze until deleted.
- **Stand / next:** Poll ASC for **1.0 (18) VALID**; tester install on internal group.
- **Who / where:** Cursor command subagent · darwin · lovable/redesign@68bf214
- **Timestamp:** 2026-07-05T14:47:54Z

### 2026-07-05T14:45:00Z — Staging prep: build + workers.dev smoke checklist

- **Requested:** Git pull `lovable/redesign`; `bun run build:prod:flutter-web`; document workers.dev smoke in `docs/FLUTTER-WEB-CUTOVER.md`; test merge locally; commit docs; push. No prod deploy.
- **Done:** **`bun run build:prod:flutter-web` PASS** (~122s; `dist/client/_flutter/` merged). `merge-flutter-web-assets.sh` re-run OK. `wrangler deploy --dry-run` OK (874 ASSETS). Added **Staging smoke (`workers.dev`)** section: prerequisites, `purplelife-staging` deploy (`--routes ""`, `--var FLUTTER_WEB_CUTOVER:true`), HTTP rows 1–10, signed-in rows 11–18, OAuth/API notes, prod promotion gate; updated deploy blockers.
- **Issues:** Staging Worker deploy not executed (per no-prod-deploy). `dist/` local only.
- **Stand / next:** Deploy `purplelife-staging`; execute checklist; owner approval before prod flag.
- **Who / where:** Cursor subagent · darwin · main@ef05394
- **Timestamp:** 2026-07-05T14:45:00Z

### 2026-07-05T14:42:00Z — Merge lovable/redesign → main (gates + push)

- **Requested:** Operator-approved merge `origin/lovable/redesign` into `main` with full quality gates; push `main`; no prod deploy.
- **Done:** Fast-forward `main` `311d466` → `7fd1bc2` (includes gate commit `fix(flutter): pass merge gates for insights, vitals, and chat`). Gates: `check:em-dash`, `check:live-data`, `check:unique-images`, `check:lovable-auth`, `tsc --noEmit`, Doppler `build:prod`, `flutter analyze lib/`, `flutter test` **91/91**. `git push origin main` **OK** (`311d466..7fd1bc2`).
- **Issues:** Local `docs/OPEN-ISSUES.md` edits unstaged; duplicate `lib/shell/top_bar 2.dart` triggers analyze info on some runs; `lovable/redesign` remote may trail `main` by 1 commit until pushed.
- **Stand / next:** `git push origin lovable/redesign` to align branches; prod deploy only with explicit approval.
- **Who / where:** Cursor merge subagent · darwin · main@7fd1bc2
- **Timestamp:** 2026-07-05T14:42:00Z.

### 2026-07-05T14:40:00Z — Flutter synced data visibility depth

- **Requested:** Close `tf-synced-data-visibility`: clearer all-synced-data UX on My Body and
  Tools (source breakdown, last sync per provider, link graph); scoped `my_health/`, `vitals/`,
  `tools/`; analyze + test; commit; push; update OPEN-ISSUES.
- **Done:** `synced_data_overview.dart`, `synced_data_panel.dart`, `loadSyncedDataOverview` +
  `syncedDataOverviewProvider` in `vitals_repository.dart`; wired into `my_health_screen.dart`,
  `vitals_screen.dart` (compact strip), `tools_screen.dart`; `synced_data_overview_test.dart`
  (4 tests pass); `docs/OPEN-ISSUES.md` marked partially improved.
- **Issues:** Biometrics hub screen depth and bottom-nav My Body label still open; full
  `flutter test` **87/88** (pre-existing `insights_timeline_routes_test.dart` compile error).
- **Stand / next:** TF17+ upload for tester re-check of synced-data panel on device.
- **Who / where:** Cursor agent, `lovable/redesign`.
- **Timestamp:** 2026-07-05T14:40:00Z.

### 2026-07-05T14:36:00Z — Flutter care chat messaging wired

- **Requested:** Wire `/chat-care` composer to web care chat APIs; `flutter analyze` + test;
  commit `fix(flutter): wire care chat messaging`; push.
- **Done:** `care_chat_repository.dart` (list threads, load messages, send, mark read,
  owner `getOrCreateDirectThread`); `care_chat_screen.dart` thread list + live composer;
  `chat_copy.dart` send/offline strings; `chat_routes_test.dart` provider override. Web APIs
  are TanStack server fns (`listCareThreads`, `sendCareMessage`, etc.), not Worker `/api/*`.
- **Issues:** Caregivers cannot create a new direct thread on Flutter until owner opens chat
  (RLS); attachments/group threads deferred; full suite **87/88** (pre-existing
  `insights_timeline_routes_test.dart` compile error on branch).
- **Stand / next:** Optional Worker `/api/care-chat/*` for admin-only thread creation; realtime
  subscription like web.
- **Who / where:** Cursor subagent · darwin · lovable/redesign (uncommitted)
- **Timestamp:** 2026-07-05T14:36:00Z

### 2026-07-05T14:40:00Z — Flutter marketing features charter terms routes

- **Requested:** Wire `/features`, `/charter`, `/terms` Flutter marketing stubs from web copy;
  analyze + test; commit push.
- **Done:** `MarketingFeaturesScreen`, `MarketingCharterScreen`, `MarketingTermsScreen`;
  copy in `marketing_copy.dart`; GoRouter + `AppRoutes.marketingPaths`; footer Terms link;
  `marketing_routes_test.dart` **10/10** pass; `flutter analyze lib/features/marketing` clean.
- **Issues:** Full `flutter analyze` still flags pre-existing vitals/chat files outside scope;
  `widget_test.dart` load failure pre-existing (**81/82** full suite).
- **Stand / next:** Marketing hero calm-scene images; `/contact` public route if needed.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:40:00Z

- **Requested:** Refresh `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` route counts vs `router.dart` and
  `src/routes/_app/`; update P0/P1/P2 for my-health, care, chat, reports, marketing; commit push.
- **Done:** Full route audit; gap counts **Missing 22**, **Stub 1**, **Partial 32**, **Parity 0**
  (total gaps 23, down from 33). P0/P1/P2 tables and Flutter inventory updated; TF17 ASC row.
- **Issues:** Stage 5 still NO-GO; admin (13), insights, care.accept deep link remain Missing.
- **Stand / next:** Device QA on TF17; Luciq crash triage; Oura console redirect.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:36:00Z

### 2026-07-05T14:10:00Z — Marketing GoRouter wire + path URLs + build 17

- **Requested:** Wire `/`, `/pricing`, `/privacy`, `/about`, `/trust` in GoRouter (public);
  path URLs on Flutter web; analyze + test green; verify `:8765`; bump `1.0.0+17`; commit push.
- **Done:** Routes in `8f81b69` (GoRouter outside ShellRoute); path URL + SPA serve in `c6658d5`;
  `flutter analyze lib/` 0 issues; `flutter test` **81/81**; `--rebuild` served `:8765` with
  HTTP 200 on `/` and `/pricing`; pubspec **1.0.0+17** committed and pushed. TestFlight skipped
  (policy: gates only, no upload this session).
- **Issues:** Browser MCP unavailable in subagent; verified via curl + serve logs. PID artifacts
  untracked.
- **Stand / next:** Prod Worker path routing when operator approves cutover.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:10:00Z

- **Requested:** Port core marketing routes to Flutter; path routes on web; verify analyze/test/
  browser; commit and push.
- **Done:** `usePathUrlStrategy()` in `main.dart`; `flutter_web_plugins` dep; `/` cold-start fix
  in `routes.dart`; `scripts/flutter-web-spa-serve.py` for `:8765` deep links. Browser MCP:
  `/` shows "Your health, remembered." + "Begin today"; client nav `/pricing` shows "Simple
  plans. Honest pricing." `flutter analyze lib/` 0 issues; `flutter test` **81/81**. Pushed
  `c6658d5` to `origin/lovable/redesign`.
- **Issues:** Marketing hero uses gradient stub (no calm-scene images yet). `/features`,
  `/charter`, `/terms`, footer GitHub links stub/disabled. `/contact` from header requires sign-in.
- **Stand / next:** Image assets + remaining marketing routes; Worker SPA routing at cutover.
- **Who / where:** Cursor marketing subagent · darwin · lovable/redesign@c6658d5
- **Timestamp:** 2026-07-05T14:06:00Z

### 2026-07-05T14:05:00Z — Marketing routes + P0-4 Today (stalled fleet closeout)

- **Requested:** Complete stalled marketing (Task A) and Today P0-4 (Task B) agents; analyze +
  test; commit and push both; rebuild `:8765`.
- **Done:** Task B already at `9b4e114` (date strip, score strip, signals grid, day-filtered
  snapshots, `signals_grid_skeleton.dart`, `today_vital_items_test.dart`). Task A screens in
  `ec8b21b`; GoRouter wiring in `8f81b69` (`router.dart`, `routes.dart` deep-link recognition).
  `flutter analyze` clean; `flutter test` **80/80** pass. Rebuilt `:8765`; curl **200** on `/`
  and `/pricing`. Pushed to `origin/lovable/redesign`.
- **Issues:** Browser MCP unavailable in subagent; signed-in `/today` walk not browser-verified
  (widget tests pass). Marketing `/contact` nav still hits protected route (sign-in gate).
- **Stand / next:** Operator device QA on `/today` and marketing nav; Worker cutover per
  `docs/FLUTTER-WEB-CUTOVER.md` when approved.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@8f81b69
- **Timestamp:** 2026-07-05T14:05:00Z


- **Requested:** `flutter test` fix all failures (chat, marketing, reports, today); analyze clean;
  commit and push.
- **Done:** Today/chat/reports fixes already on branch (`9b4e114`, `04a98d9`, `d1da862`). Committed
  marketing screens + `marketing_routes_test.dart`; `prefer_const_constructors` fixes in marketing
  and `reports_detail_screen.dart`. `flutter test` **79/79**; `flutter analyze lib/` **0 issues**.
  Pushed `ec8b21b` to `origin/lovable/redesign`.
- **Issues:** Marketing screens not yet wired in GoRouter (widget tests only). PID/lock artifacts
  untracked.
- **Stand / next:** GoRouter marketing routes; web rebuild when lock free.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@ec8b21b
- **Timestamp:** 2026-07-05T14:30:00Z

### 2026-07-05T14:05:00Z — P0-4 Flutter Today web parity

- **Requested:** Today parity — date strip, signals grid, score strip vs web `today.tsx`;
  scope `flutter/lib/features/today/`; analyze + test; browser `:8765/#/today`; commit push.
- **Done:** Confirmed/landed date strip, glass three-up score strip (Readiness/Sleep/Activity),
  "YOUR SIGNALS" grid with connect/empty states, quick actions, More-for-today disclosure (prior
  work). This commit: day-filtered `hasData` from real metrics in `today_repository.dart`;
  `signals_grid_skeleton.dart` for past-day loading; connect routes use `AppRoutes.settings`;
  `test/today_vital_items_test.dart`. `flutter analyze lib/features/today/` clean;
  `flutter test` **79/79** pass. Browser verified `:8765/#/today` (date strip, scores, signals).
- **Issues:** Full `flutter analyze lib/` still red on untracked marketing WIP (out of scope).
  Web rebuild blocked by concurrent `flutter-web-serve` lock; existing server served stale-enough
  build with real signed-in data for verify.
- **Stand / next:** `--rebuild` when lock free; update gap matrix P0-4 to Parity.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@9b4e114
- **Timestamp:** 2026-07-05T14:05:00Z

### 2026-07-05T14:20:00Z — P0-9 Flutter reports child routes

- **Requested:** Add six missing `/reports/*` child routes vs web; honest empty/upload states;
  scope `flutter/lib/features/reports/` + router; analyze + test; commit and push.
- **Done:** Routes `/reports/metrics`, `/documents`, `/medical-history`, `/new`,
  `/:reportId`, `/trends/:metricKey` with `ReportsLayout` tabs; repository loaders for
  tracked metrics, detail, series; removed monolithic hub; `test/reports_routes_test.dart`.
  `flutter analyze` exit 0; `flutter test` 79/79 pass.
- **Issues:** Trend charts, PDF generate, bulk download, reprocess, AI explain remain web-only
  (honest copy in UI). `/settings/reports` redirects to `/reports/metrics`.
- **Stand / next:** Worker file URL for Flutter report detail view; optional chart widget.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:20:00Z

### 2026-07-05T14:15:00Z — P0-7 Flutter chat routes shell

- **Requested:** Wire `/chat` and `/chat-care` stubs vs web; real shell + empty/connect or API;
  analyze + test; commit `feat(flutter): chat routes shell`; push.
- **Done:** `flutter/lib/features/chat/` — Ask Purple shell (header, chips, composer,
  disclaimer, SSE via `WorkerClient.postChatStream`); Care chat split list/conversation shell
  with `sharingListProvider` connect/empty states; `getSuggestedQuestions` in
  `condition_prompts.dart`; `test/chat_routes_test.dart` (6 pass). Scoped analyze clean.
- **Issues:** Landed co-staged in `a9c4361` (meds commit) not isolated feat message. Care
  message send still disabled (no Worker RPC client yet).
- **Stand / next:** `feat(flutter): care chat API` slice; rebuild web preview for `/chat`.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@a9c4361
- **Timestamp:** 2026-07-05T14:15:00Z

### 2026-07-05T14:12:00Z — P0-6 Flutter meds schedule UX parity

- **Requested:** Meds toolbar, 24h timeline, FAB vs web `meds*.tsx`; scope
  `flutter/lib/features/meds/` only; no fake doses; analyze + test; commit and push.
- **Done:** `meds_screen.dart` — four-button toolbar (+/scan/voice/history), mobile FAB below
  768px width, `medsScheduleProvider` with day navigation. `dose_list.dart` — prev/next day,
  date picker, conditional now marker, adherence only on today. `meds_repository.dart` —
  `todayStr`/`viewDateStr`, regenerate pending doses only when viewing today.
  `test/meds_schedule_ux_test.dart` — 3 widget tests. Pushed `a9c4361`.
- **Issues:** Scan/voice show web-only snackbar (no native capture). Commit also picked up
  co-staged chat scaffold files from parallel disk WIP.
- **Stand / next:** Native scan/voice med sheets; device verify schedule panel.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@a9c4361
- **Timestamp:** 2026-07-05T14:12:00Z

### 2026-07-05T14:10:00Z — Flutter P0-8 care inbox route

- **Requested:** Port `/care/inbox` from web; wire `care_repository`; analyze + test; commit
  `feat(flutter): care inbox route`; push.
- **Done:** `care_inbox_screen.dart`, `incoming_care_invites_card.dart`; `CareRepository`
  pending-change load/decide/bulk + `careInboxProvider`; `AppRoutes.careInbox` + router route
  before `:ownerId`; `test/care_routes_test.dart`. Scoped analyze clean; care tests 3/3.
- **Issues:** Incoming invites list/decline may fail RLS without service role (web uses server
  fn). Accept still email-link only. Full `flutter test` has pre-existing WIP failures on disk.
- **Stand / next:** Worker care inbox RPC or RLS for invitee reads; `/care/accept` Flutter route.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:10:00Z

### 2026-07-05T14:05:00Z — P0-3 Flutter wearable OAuth error UX

- **Requested:** Improve Tools Oura/Whoop OAuth inline errors; register redirect hint for
  `org.purplelife.app://oauth-oura-callback`; compare web tools integration UI; analyze + test;
  commit and push.
- **Done:** `wearable_oauth.dart` — `whoopFunctionErrorMessage`, `oauthCallbackQueryErrorMessage`,
  `nativeConnectSetupHint`, `emitWearableOAuthFailure`; Whoop exchange + callback error mapping.
  `tools_screen.dart` — inline errors on both cards, native pre-connect hints (Oura + Whoop).
  `wearable_oauth_callback_screen.dart` — emits failures to Tools stream. Tests extended.
  `flutter analyze lib/features/tools/` + `flutter test test/wearable_oauth_test.dart` pass.
- **Issues:** Oura developer console still needs native redirect URI registered (UX only).
- **Stand / next:** Owner adds `org.purplelife.app://oauth-oura-callback` in Oura console; TF device
  verify connect path.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:05:00Z

### 2026-07-05T18:30:00Z — Flutter web Worker cutover scaffold

- **Requested:** Implement merge script, `server.ts` path dispatch stub, `build:prod:flutter-web`
  chain; commit + push; no prod deploy.
- **Done:** `scripts/merge-flutter-web-assets.sh`; `src/lib/flutter-web-routing.ts` +
  `src/server.ts` dispatch (`/api/*`, `/oauth/*` → TanStack; Flutter static + SPA fallback when
  `FLUTTER_WEB_CUTOVER=true`; marketing TanStack fallback). `package.json`
  `build:prod:flutter-web`. `bunx tsc --noEmit` pass.
- **Issues:** Flag defaults off; no staging smoke; `flutter-phase5-nogo` and E2E TanStack paths
  remain.
- **Stand / next:** `build:prod:flutter-web` on workers.dev; owner sign-off before wrangler deploy.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T18:30:00Z

### 2026-07-05T18:10:00Z — Flutter signed-in route parity wave 1

- **Requested:** Complete P0 wave 1: `/my-health` + nav, Tools OAuth UX, vitals depth,
  reports hub, journal honest capture; analyze + test; commit and push.
- **Done:** Added `MyHealthScreen` + repository (narrative, 90-day coverage, metric rows);
  bottom nav **My Body** → `/my-health`; `/biometrics` hub + trend drilldowns; vitals synced
  strip + My Body link; Tools Oura redirect hint + coverage summary; reports upload route
  (`/settings/reports/new`); journal platform-honest capture dock. `flutter test` **50/50**
  (excludes WIP `marketing_routes_test.dart` on disk). Commit `fix(flutter): signed-in route
  parity wave 1`.
- **Issues:** Oura console redirect still manual (`tf-oauth-not-working`). Marketing Flutter
  WIP remains untracked on disk.
- **Stand / next:** TF device sign-off on synced-data visibility; ship TF17 when ready.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T18:10:00Z


- **Requested:** Document Worker path for Flutter web at www.purplelife.org; scaffold prod build
  script; list Worker route changes (plan only); commit TF16 Luciq dedupe; push.
- **Done:** Added `docs/FLUTTER-WEB-CUTOVER.md` (build pipeline, asset paths, path-based Worker
  dispatch vs TanStack SSR, rollback, `:8080` vs `:8765` roles). Added
  `scripts/flutter-web-build-prod.sh` (Doppler dart-defines → `flutter/build/web`). Linked from
  `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`. Committed **d62472b** `chore(ios): TF16 build bump and
  Luciq dedupe` (`1.0.0+16`, removed duplicate SPM Luciq, Podfile.lock). `flutter test` **47/47**
  on committed tree (parallel fleet WIP in untracked `lib/features/marketing/` breaks local
  analyze until merged).
- **Issues:** Worker `src/server.ts` dispatch + `merge-flutter-web-assets.sh` not implemented.
  `flutter-phase5-nogo` still blocks prod Flutter web. Parallel agents left untracked marketing/
  reports WIP on disk.
- **Stand / next:** Staging cutover on workers.dev; owner approval before prod deploy.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@d62472b
- **Timestamp:** 2026-07-05T14:00:00Z


- **Requested:** Pull ASC/Luciq feedback, confirm TF16, map feedback to Flutter gaps, compare web vs
  Flutter routes, refresh gap matrix and open issues; audit only, commit + push.
- **Done:** `bun run ios:check-tf-feedback` (10 ASC submissions); `bun run ios:check-asc-builds`
  (**1.0 (16) VALID**); refreshed `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` with P0/P1/P2 table,
  feedback map, route counts (33 gaps); `docs/OPEN-ISSUES.md` (`tf-synced-data-visibility`,
  `tf-oauth-not-working`, resolved `tf16-asc-processing`).
- **Issues:** Luciq dashboard API creds still absent (manual crash triage). No screen work this pass.
- **Stand / next:** `tf16-device-verify` on iPhone; ship P0-2 `/my-health` + P0-3 Oura console.
- **Who / where:** Cursor cutover audit subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T17:55:00Z

### 2026-07-05T13:36:00Z — Settings scroll re-verification (subagent)

- **Requested:** Confirm Flutter `/settings` full scroll web parity; browser verify `:8765`; analyze +
  test; resolve `tf-settings-design`.
- **Done:** Compared web `settings.tsx` vs Flutter hub + inline sections (order matches). Rebuilt
  `:8765`; browser MCP accessibility tree **108 nodes** (Preferences through Admin); scrollIntoView
  screenshots for AI provider, Data, Help, About; `flutter analyze lib/features/settings/` clean;
  `flutter test` **47/47** incl. `settings_screen_scroll_test.dart`.
- **Issues:** None. Commit `fb3b018` already on `origin/lovable/redesign`; TF16 needed for tester
  re-check.
- **Stand / next:** Poll ASC for TF16 VALID; device sign-off on settings scroll.
- **Who / where:** Cursor settings subagent · darwin · lovable/redesign@2b3fbb1
- **Timestamp:** 2026-07-05T13:36:00Z


- **Requested:** Ship TF16 bundling `home_city` (9b3de42), Luciq (e1cd69d), settings scroll
  (fb3b018), TF sync/timezone feedback (2aeabd4).
- **Done:** Polled `git pull` until fb3b018 + 2aeabd4 on branch; `flutter analyze lib/` + `flutter
  test` 47/47; bumped `pubspec.yaml` to **1.0.0+16**; ASC pre-check TF15 VALID; fixed duplicate
  LuciqSDK (removed SPM `luciq-ios-sdk` from Flutter `project.pbxproj`, keep CocoaPods via
  `luciq_flutter`); `bun run ios:testflight` via Xcode-beta **EXPORT SUCCEEDED**, upload **100%**
  (~09:33 ET); `bun run ios:check-tf-feedback` (7 ASC submissions, Luciq SDK token present).
- **Issues:** ASC API still lists **1.0 (15)** as newest VALID (16 processing). Local **+16** and
  pbxproj fix **not committed**. `xcode-select` points at CLT; script used `/Applications/Xcode-beta.app`.
- **Stand / next:** Poll ASC for 16 VALID; commit chore bump + Luciq SPM dedupe; close TF feedback
  items on device after install.
- **Who / where:** Cursor TF upload subagent · darwin · lovable/redesign@2b3fbb1 (upload tree) +
  local pbx/pubspec edits
- **Timestamp:** 2026-07-05T13:35:00Z

### 2026-07-05T13:34:00Z — Luciq vs Sentry observability audit

- **Requested:** Can agents access Luciq without manual checks? Sentry project exists? Need both?
- **Done:** Audit confirms SDK capture works; dashboard automation blocked until
  `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` in Doppler. No Sentry in repo or Doppler; policy
  keeps Luciq-only for TestFlight beta (no dual SDK).
- **Issues:** User must add Luciq API creds in Luciq dashboard, then Doppler, for agent crash pulls.
- **Stand / next:** TF16 upload; optional Luciq MCP install; do not create Sentry.
- **Who / where:** agent d29d33cc · darwin · lovable/redesign@fb3b018
- **Timestamp:** 2026-07-05T13:34:00Z

### 2026-07-05T13:22:00Z — Post-fleet integration verification

- **Requested:** Pull `lovable/redesign`, run Flutter gates, rebuild `:8765`, curl + browser
  verify `#/settings` scroll and `#/account` city field; update `CURSOR_HANDOFF.md`.
- **Done:** `git pull` up to date at `e1cd69d`; `flutter analyze lib/` 0 issues; `flutter test`
  46/46; `./scripts/flutter-web-serve.sh --rebuild` OK; curl **200**; browser MCP verified
  settings sections scroll and account city field (`e.g. Brooklyn`); re-fetch showed no new
  settings/TF commits; `CURSOR_HANDOFF.md` integration section updated.
- **Issues:** None blocking. Signed-in browser session required for account form (existing session
  used).
- **Stand / next:** TF16 upload with accumulated fixes; Luciq verify on device after TF16.
- **Who / where:** Cursor agent · darwin · lovable/redesign@e1cd69d
- **Timestamp:** 2026-07-05T13:22:00Z

### 2026-07-05T13:25:00Z — Flutter settings full scroll web parity

- **Requested:** Complete Flutter `/settings` full scroll parity with prod web; verify, resolve
  `tf-settings-design`, commit and push.
- **Done:** Confirmed inline sections already wired in `settings_screen.dart` +
  `settings_sections.dart` (Preferences through Admin); added
  `flutter/test/settings_screen_scroll_test.dart`; `flutter analyze lib/` clean; `flutter test`
  47/47; browser verified `http://127.0.0.1:8765/#/settings` (108 interactive a11y nodes incl.
  Export, Contact, About, Admin); resolved `tf-settings-design` in OPEN-ISSUES.
- **Issues:** TF16 upload needed for tester re-check; Travel sub-route still placeholder.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:25:00Z

### 2026-07-05T13:20:00Z — TestFlight sync bar and timezone label fixes (commit)

- **Requested:** Commit uncommitted TestFlight feedback fixes (sync bar, timezone labels) and
  handoff kit files; push `lovable/redesign`.
- **Done:** Committed `sync_status_bar.dart` (provider names in sync button, relative + clock
  last sync, local time), removed `SyncStatusBar` from Meds/Vitals, `timezoneLabel()` in
  `locale_data.dart`; handoff kit (`00-handoff.mdc`, `CLAUDE.md`, `install-handoff-kit.sh`,
  post-task doc rule updates); `flutter analyze` 0 errors (5 pre-existing info), `flutter test`
  46/46; pushed to `origin/lovable/redesign`.
- **Issues:** Settings design still wrong per tester (see OPEN-ISSUES); fixes need TF16 upload to
  reach testers.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:20:00Z

### 2026-07-05T13:30:00Z — Luciq Flutter crash reporting

- **Requested:** Luciq vs free alternatives; integrate `luciq_flutter`; agent periodic checks.
- **Done:** Added `luciq_flutter` ^19.8, `luciq_bootstrap.dart`, dart-define injection in
  `flutter-ios-testflight.sh`; removed duplicate native Luciq init from Flutter AppDelegate;
  `scripts/luciq-fetch-reports.mjs`, `check-testflight-feedback.mjs`, `ios:check-luciq`,
  `ios:check-tf-feedback`; `mem/observability/crash-reporting.md`, testflight-setup section,
  `.cursor/rules/flutter-testflight-observability.mdc`; analyze 0 issues, 46/46 tests.
- **Issues:** Dashboard API automation needs optional `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL`
  in Doppler; SDK token alone sufficient for device crash capture. `tf-crash-report` open until
  TF16+ verified in Luciq UI.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:30:00Z

### 2026-07-05T13:20:00Z — profiles.home_city field (DB + Flutter + web Account)

- **Requested:** Separate city field in DB (not just timezone label); migration, Flutter Account,
  optional web Account parity; commit and push.
- **Done:** Verified no `city`/`home_city` on live NEW DB; migration
  `supabase/migrations/20260705131400_profiles_home_city.sql` applied via Management API;
  regenerated `src/integrations/supabase/types.ts`; Flutter `account_screen.dart` city text
  field (autosave); web `LocaleFields` + `account.tsx` + i18n en/es; `flutter test` 46/46,
  `check:supabase-types` ok.
- **Issues:** None blocking. Settings scroll parity and Luciq out of scope.
- **Stand / next:** TF16 upload can include city field; welcome/onboarding does not yet collect
  `home_city`.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:20:00Z

### 2026-07-05T13:10:00Z — TestFlight feedback API + triage fixes

- **Requested:** Access TestFlight user feedback/screenshots; resolve issues.
- **Done:** Confirmed ASC API access (`/v1/apps/6787298041/betaFeedbackScreenshotSubmissions`);
  added `scripts/asc-list-testflight-feedback.mjs`, `bun run ios:check-asc-feedback`; triaged 7
  submissions; removed sync bar from Meds/Vitals; sync labels name providers + clock time;
  Account timezone shows city labels (New York not America/New_York).
- **Issues:** Settings design still wrong per tester; crash screenshot with no ASC crash log;
  fixes need TF16 upload.
- **Stand / next:** Upload TF16; Settings parity agent; optional ASC webhook for real-time feedback.
- **Who / where:** Cursor agent · darwin · lovable/redesign (superseded by commit above)
- **Timestamp:** 2026-07-05T13:10:00Z

### 2026-07-05T12:05:00Z — Install handoff/documentation discipline kit

- **Requested:** Apply permanent handoff rules from attached kit to Cursor repo
  (`docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, `.cursor/rules/00-handoff.mdc`,
  `CLAUDE.md`, install script); integrate with existing Purple docs.
- **Done:** Created `.cursor/rules/00-handoff.mdc`, `CLAUDE.md`, `docs/HANDOFF.md`,
  `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, `scripts/install-handoff-kit.sh`; updated
  `.cursor/rules/post-task-documentation.mdc` and `AGENTS.md` to reference the trio;
  seeded snapshot and log from overnight Flutter fleet state (`327c161`, TF15 VALID).
- **Issues:** Phase 5 cutover still NO-GO; Oura native redirect URI may need manual
  Oura console registration; `CURSOR_HANDOFF.md` remains large legacy ops doc (maintain
  in parallel, not replaced).
- **Stand / next:** All future tasks append here first; operator verifies TF15 on device.
- **Who / where:** Cursor agent · darwin · lovable/redesign@327c161 (pre-commit for this task)
- **Timestamp:** 2026-07-05T12:05:00Z

### 2026-07-05T09:01:00Z — TestFlight 15 shipped (Settings, Account, Oura, Apple Health)

- **Requested:** Ship TF15 with Settings/`#/account`/Oura fixes missing from TF14 upload.
- **Done:** `pubspec` **1.0.0+15**; upload VALID ASC id `e85ac1a5-f547-4cb1-b51b-aa091191ba15`;
  commits `99e836c` (router refresh, Account deep links), `98d1ec8` (Oura OAuth),
  `92e0c0b` (compile + Apple Health Keychain connect); handoff `327c161` pushed.
- **Issues:** Device-side HealthKit and Oura connect not agent-verified on physical iPhone.
- **Stand / next:** Install **1.0 (15)** from TestFlight; verify connect flows on device.
- **Who / where:** overnight fleet agents · CI Mac · lovable/redesign@327c161
- **Timestamp:** 2026-07-05T09:01:00Z

### 2026-07-05T08:49:00Z — Apple Health TF14 (Keychain connect fix)

- **Requested:** Fix Apple Health connect on device (TF13 bool gate bug).
- **Done:** iOS trusts `requestAuthorization` + Keychain flag (matches Capacitor
  `health-ios.ts`); user-visible errors in Tools panel; TF14 uploaded VALID
  (`9aaf275d-c070-4a26-934c-6d21373b5edd`); superseded by TF15.
- **Issues:** TF14 predated Settings/Oura commits.
- **Stand / next:** Superseded by TF15 upload.
- **Who / where:** agent 60b9bcad · darwin · lovable/redesign@92e0c0b
- **Timestamp:** 2026-07-05T08:49:00Z

### 2026-07-05T08:00:00Z — Compile gates restored after parallel WIP break

- **Requested:** Fix 186 analyze errors from broken `tools_screen.dart` syntax.
- **Done:** `92e0c0b` — analyze 0 issues, **44/44** then **46/46** tests, `:8765` rebuild;
  preserved Oura OAuth and Apple Health WIP.
- **Issues:** None blocking after fix.
- **Stand / next:** Continue Settings/Health/Oura agents; upload TF14/15.
- **Who / where:** agent a83f8337 · darwin · lovable/redesign@92e0c0b
- **Timestamp:** 2026-07-05T08:00:00Z

<!--
Copy this template for each new entry. Newest at the top.

### YYYY-MM-DDTHH:MM:SSZ — <short title>
- **Requested:**
- **Done:**
- **Issues:**
- **Stand / next:**
- **Who / where:** <name or agent> · <machine> · <branch@commit>
- **Timestamp:** YYYY-MM-DDTHH:MM:SSZ
-->
