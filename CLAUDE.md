# CLAUDE.md

Instructions for Claude Code in this repo. Cursor reads `.cursor/rules/00-handoff.mdc`;
this file is the Claude Code equivalent. Keep the two in sync.

Purple also uses `AGENTS.md` (learned preferences), `CURSOR_HANDOFF.md` (extended ops),
and `mem/` (durable decisions). Session start reads the handoff trio first.

## Session start (before any work)

Read these in order, every session:

1. `docs/HANDOFF.md` — current snapshot and log (canonical state).
2. `docs/DECISIONS.md` — standing decisions you must respect.
3. `docs/OPEN-ISSUES.md` — known blockers.
4. `CURSOR_HANDOFF.md` — skim for TestFlight, Doppler, gates relevant to the task.

If the task conflicts with any of these, stop and surface it before proceeding.

## Task completion (before declaring done)

Append a new entry to the top of the **Log** in `docs/HANDOFF.md` with:

- **Requested** — the actual ask.
- **Done** — concrete files, commands, config, infra changed.
- **Issues** — broken, incomplete, deferred, or risky items.
- **Stand / next** — current state and the single next action.
- **Who / where** — identity, machine, branch@commit.
- **Timestamp** — ISO 8601 UTC.

Refresh the **Current snapshot** block at the top of `docs/HANDOFF.md`.

Also update `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, and `CURSOR_HANDOFF.md` when
relevant. Follow `.cursor/rules/post-task-documentation.mdc` for runbooks, rules, and
`mem/`.

## Hard rules

- The task is not complete until the handoff log entry exists.
- Never delete doc history. Append and mark status.
- Never write secrets/tokens/keys into any file. Reference their location only.
- Factual and specific. No filler, no vague optimism.
- Agent-owned ops per `.cursor/rules/no-manual-operator-work.mdc`.
