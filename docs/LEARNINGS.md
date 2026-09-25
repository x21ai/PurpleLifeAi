# LEARNINGS

Durable lessons from work runs. Read at session start; let these change how future
work (especially multi-agent fleets) is decomposed. Append, never delete.

---

### 2026-09-25 — Build cleanup traps need absolute paths after `cd` (status: raw)

- `scripts/build-ploy-www.sh` registered a trap with relative
  `astro.config.mjs.bak`, then changed back to the repo root before exit. A post-build
  assertion failure made the trap run from the wrong directory, leaving the production
  URL rewrite in the tracked staging config and a stray backup file. The script now uses
  absolute config/backup paths. Compile into: an automated failure-path test that proves
  the tracked Astro config is restored when the post-build production check fails.

### 2026-09-25 — wrangler KV ids are account-scoped (status: raw)

- **Eigital Worker `purplelife` cannot bind POS KV `73356a0e339447059bdddc33b93f26a9`.**
  Deploy fails with Cloudflare 10041. Ploy www config must use eigital KV
  `9226585702aa4be694ac74981d9859c4` (`purplelifeai` on `08e766e92db74bc7…`).
  Compile into: `wrangler.deploy.ploy.jsonc` CACHE id only; do not copy POS ids
  from `wrangler.deploy.jsonc` into eigital deploy configs.

### 2026-09-24 — node -e trailing VAR=value is argv, not env (status: raw)

- **`node -e 'process.env.SITE' SITE="$SITE"` does not set `process.env.SITE`.** Extra
  tokens after `-e` are `process.argv`, so the Astro rewrite wrote `site: "undefined"`
  and `bun run build:www-ploy` failed with Invalid URL. Use `SITE="$SITE" node -e "..."`
  or `export SITE`. Compile into: (a) this script stays env-prefixed, (b) do not copy
  the argv pattern into other `node -e` rewrites.

### 2026-07-12 — TF28 sibling collision + pill stock trigger (status: raw)

- **Parallel writers on one checkout collided on Today/Meds shared surfaces**
  (`today_screen` expand bodies, `onWearablesSynced`, `onRefill`, wearable
  SourceKey / OAuth hints). Analyze went RED mid-integration. Fix: one restorer
  owns compile green before product land or `ios:testflight`; sole upload owner
  waits for `flutter analyze` today+meds clean AND `flutter test` green.
- **`pills_remaining` can be a true 0 from the DB trigger, not only missing
  refill UI.** Trigger uses `COALESCE(dose.amount, 1)` as the decrement; if
  `amount` is mg, stock collapses. Log as `meds-pill-stock-amount-vs-count`;
  still ship refill write. Compile into: (a) migration/unit test for stock
  delta semantics, or (b) product decision + trigger change.

### 2026-07-05 — Multi-agent fleet run (waves 1+2 Flutter parity → TF19)

- **Agent-tool worktrees fork off the original base commit, not the parent's advanced HEAD.** When you land wave N onto `lovable/redesign` locally and then spawn wave N+1 via the Agent tool's `isolation: worktree`, the new worktrees still branch off the *original* base — so they miss wave N's changes and the new packages. Fix used: build a combined base branch (`wave2-base` = wave1 + foundation), create **manual** `git worktree`s off it, and drive each writer into its assigned directory by absolute path (no `isolation`). Do this for any dependent wave.
- **Serialize the package-install / shared-foundation step; never parallelize it.** `pubspec.yaml` + new shared repos (e.g. `seizure_repository.dart`) are single-owner. Run one foundation agent, land it, *then* fan out feature writers that only import (never re-edit) the packages — their `pub get` becomes a cache-read and is safe to run concurrently.
- **Disjoint = no shared file AND no shared upstream being modified.** Writers that edit a shared repo (`vitals_repository`, `reports_repository`) must keep existing method/provider signatures **backward-compatible** (add optional params / new methods) so read-only consumers in other slices keep compiling. This held across the 6-way Wave-2 fan-out.
- **HANDOFF.md is a merge hot-spot in parallel work.** Every writer that prepends a log entry conflicts with every other on `docs/HANDOFF.md`. The resolution is always "keep both" (strip the 3 conflict-marker lines). Consider having writers NOT edit HANDOFF and letting the parent write one consolidated entry at land time.
- **Backend gaps are the real parity ceiling, not Flutter effort.** A large share of "missing functionality" (caregiver dashboard, AI cards, invite-accept) is blocked on server functions that aren't exposed as Worker routes — not on client work. Audit for this *first*; it changes what a wave can honestly deliver. Writers were told to gap-state, never fake — correct call for a health app.
- **Independent review caught a shipping blocker the writer's own gate missed.** `flutter analyze`+`flutter test` were green, but the timeline dose buttons visibly reverted online (queued write never flushed before the direct-Supabase refetch). Green gates ≠ correct behavior; keep the separate-reviewer rule.
- **On-device verification remains the gap.** No simulator in the agent environment — analyze/test/`** EXPORT SUCCEEDED **` verify compile + upload, not runtime. Deep-link, chart rendering, and RLS-mutation paths still need a device pass after upload.
