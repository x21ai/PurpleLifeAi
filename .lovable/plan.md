## Live QA walkthrough

Run an interactive browser pass through every flow that the static audit could not verify, capture screenshots, and report findings.

### Flows to test

1. **Auth** — open `/`, confirm logged-in session (else stop and ask user to log in).
2. **Phase 1 — Feature flags**
   - `/settings` → "What I track" → toggle one default-off feature on, one default-on feature off → save.
   - `/today` → confirm the toggled cards appear/disappear accordingly.
3. **Phase 2a — Condition suggestions**
   - `/reports` → look for "Patterns we noticed" card (requires a report with HbA1c/glucose/LDL above threshold; if none, insert a synthetic `report_metrics` row via migration is out of scope — just verify card renders empty-state cleanly).
   - If suggestion present: click "Add to my profile" → verify `EnableTrackersSheet` opens with related trackers → enable → confirm `profiles.conditions` and `feature_overrides` updated via `read_query`.
   - Click "Not now" on another suggestion → verify `suggestions_dismissed` updated.
4. **Phase 2b — Condition history**
   - `/settings` → Condition history section → archive a condition → confirm it moves to archived list and disappears from active.
   - Add a new condition → confirm `EnableTrackersSheet` prompt appears.
5. **Phase 3 — Reports as medical history**
   - `/reports` → search input filters list, "N metrics" badge shows, Trends section renders.
   - Click a metric → `/reports/trends/$metricKey` chart loads.
6. **Phase 4 — Caregiver mirror**
   - `/care/$ownerId` (if a care relationship exists) → "Customize tabs" → hide a feature → reload → confirm tab hidden and `caregiver_hidden_features` updated.
7. **Polish** — footer shows "Built by X21 Ai" on `/`.

### Out of scope
- Seeding synthetic lab data to force a suggestion (will note as "needs real data" if no thresholds met).
- Fixing newly-discovered bugs in this pass — will report them and ask before patching.

### Deliverable
A short per-flow PASS/FAIL/SKIP report with screenshots and any bugs found.
