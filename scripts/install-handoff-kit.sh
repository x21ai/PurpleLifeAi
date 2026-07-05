#!/usr/bin/env bash
# install-handoff-kit.sh
# Drops the permanent handoff/documentation discipline into the current repo.
# Idempotent: safe to re-run; will not overwrite existing docs, only fills gaps.
#
# Usage: run from the root of any repo:
#   bash scripts/install-handoff-kit.sh
#
# Purple: already installed 2026-07-05. Re-run safe; skips existing files.
# Source kit: user Downloads/handoff/ or inline content below.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p .cursor/rules docs

write_if_absent() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "skip (exists): $path"
  else
    cat > "$path"
    echo "created:       $path"
  fi
}

write_if_absent .cursor/rules/00-handoff.mdc <<'EOF'
---
description: Permanent handoff and documentation discipline. Read state before work, record state after work. Applies to every request.
alwaysApply: true
---

# Handoff and Documentation Rule (load-bearing, non-negotiable)

Multiple developers, machines, and agent sessions work on this project.
Knowledge must never be lost between them. Documentation is part of finishing
the task, not optional cleanup.

## On EVERY session start, before changing anything
1. Read `docs/HANDOFF.md` in full (current state).
2. Read `docs/DECISIONS.md` (standing decisions).
3. Read `docs/OPEN-ISSUES.md` (known blockers).
4. If the task conflicts with these, stop and surface it before proceeding.

## On EVERY task completion, before it is done
Append a new entry to the top of the log in `docs/HANDOFF.md`:
- What was requested
- What was done (files, commands, config, infra)
- Issues (broken, incomplete, deferred, risky)
- Where we stand + the single next action
- Who / where (identity, machine, branch@commit)
- Timestamp (ISO 8601 UTC)
Update `docs/DECISIONS.md` and `docs/OPEN-ISSUES.md` when relevant.
Refresh the "Current snapshot" block in `docs/HANDOFF.md`.

## Hard constraints
- Task is NOT complete until the handoff entry is written.
- Never delete doc history. Append and mark status.
- Never write secrets/tokens/keys into any file. Reference their location only.
- Factual and specific. No filler.
EOF

write_if_absent CLAUDE.md <<'EOF'
# CLAUDE.md

Claude Code reads this; Cursor reads `.cursor/rules/00-handoff.mdc`. Keep in sync.

## Session start (before any work)
Read in order: `docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`.
If the task conflicts with any, stop and surface it first.

## Task completion (before declaring done)
Append to the top of the log in `docs/HANDOFF.md`: Requested, Done, Issues,
Stand/next, Who/where, Timestamp (ISO 8601 UTC). Update DECISIONS and
OPEN-ISSUES when relevant. Refresh the snapshot block.

## Hard rules
- Not complete until the handoff entry exists.
- Never delete doc history. Append and mark status.
- Never write secrets into any file. Reference location only.
- Factual and specific. No filler.
EOF

write_if_absent docs/HANDOFF.md <<'EOF'
# HANDOFF

Current state of the world. Read first, every session. Update before any task is
done. Newest entries at the top. Rule: `.cursor/rules/00-handoff.mdc`.

## Current snapshot
> Not yet started. Replace after the first task.

## Log

<!--
### YYYY-MM-DDTHH:MM:SSZ — <short title>
- **Requested:** 
- **Done:** 
- **Issues:** 
- **Stand / next:** 
- **Who / where:** <name or agent> · <machine> · <branch@commit>
- **Timestamp:** YYYY-MM-DDTHH:MM:SSZ
-->
EOF

write_if_absent docs/DECISIONS.md <<'EOF'
# DECISIONS

Standing decisions all future work must respect. Append, never rewrite. Reversed
decisions get a new entry that supersedes the old; mark the old SUPERSEDED.

### YYYY-MM-DD — <title> [ACTIVE | SUPERSEDED by <date>]
- **Decision:** 
- **Reason:** 
- **Implications:** 
EOF

write_if_absent docs/OPEN-ISSUES.md <<'EOF'
# OPEN ISSUES

Known problems, blockers, deferred work. Mark resolved, do not delete.

- [ ] **<id>** — description. _Raised YYYY-MM-DD by <who>._
- [x] ~~**<id>**~~ — RESOLVED YYYY-MM-DD: how.

_No open issues yet._
EOF

echo
echo "Handoff kit check complete. Commit any new files:"
echo "  git add .cursor/rules/00-handoff.mdc CLAUDE.md docs/HANDOFF.md docs/DECISIONS.md docs/OPEN-ISSUES.md scripts/install-handoff-kit.sh"
