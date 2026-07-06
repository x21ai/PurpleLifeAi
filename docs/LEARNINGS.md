# LEARNINGS

Durable lessons from work runs. Read at session start; let these change how future
work (especially multi-agent fleets) is decomposed. Append, never delete.

---

### 2026-07-05 — Multi-agent fleet run (waves 1+2 Flutter parity → TF19)

- **Agent-tool worktrees fork off the original base commit, not the parent's advanced HEAD.** When you land wave N onto `lovable/redesign` locally and then spawn wave N+1 via the Agent tool's `isolation: worktree`, the new worktrees still branch off the *original* base — so they miss wave N's changes and the new packages. Fix used: build a combined base branch (`wave2-base` = wave1 + foundation), create **manual** `git worktree`s off it, and drive each writer into its assigned directory by absolute path (no `isolation`). Do this for any dependent wave.
- **Serialize the package-install / shared-foundation step; never parallelize it.** `pubspec.yaml` + new shared repos (e.g. `seizure_repository.dart`) are single-owner. Run one foundation agent, land it, *then* fan out feature writers that only import (never re-edit) the packages — their `pub get` becomes a cache-read and is safe to run concurrently.
- **Disjoint = no shared file AND no shared upstream being modified.** Writers that edit a shared repo (`vitals_repository`, `reports_repository`) must keep existing method/provider signatures **backward-compatible** (add optional params / new methods) so read-only consumers in other slices keep compiling. This held across the 6-way Wave-2 fan-out.
- **HANDOFF.md is a merge hot-spot in parallel work.** Every writer that prepends a log entry conflicts with every other on `docs/HANDOFF.md`. The resolution is always "keep both" (strip the 3 conflict-marker lines). Consider having writers NOT edit HANDOFF and letting the parent write one consolidated entry at land time.
- **Backend gaps are the real parity ceiling, not Flutter effort.** A large share of "missing functionality" (caregiver dashboard, AI cards, invite-accept) is blocked on server functions that aren't exposed as Worker routes — not on client work. Audit for this *first*; it changes what a wave can honestly deliver. Writers were told to gap-state, never fake — correct call for a health app.
- **Independent review caught a shipping blocker the writer's own gate missed.** `flutter analyze`+`flutter test` were green, but the timeline dose buttons visibly reverted online (queued write never flushed before the direct-Supabase refetch). Green gates ≠ correct behavior; keep the separate-reviewer rule.
- **On-device verification remains the gap.** No simulator in the agent environment — analyze/test/`** EXPORT SUCCEEDED **` verify compile + upload, not runtime. Deep-link, chart rendering, and RLS-mutation paths still need a device pass after upload.
