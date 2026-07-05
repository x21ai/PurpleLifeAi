# Post-task documentation

Every completed agent task must update project documentation before claiming done. Nothing important lives only in chat.

## Required surfaces

- `docs/HANDOFF.md` — canonical snapshot + log (append every task; `.cursor/rules/00-handoff.mdc`)
- `docs/DECISIONS.md` — standing decisions when made or superseded
- `docs/OPEN-ISSUES.md` — blockers opened or resolved
- `CURSOR_HANDOFF.md` — extended operational state (TestFlight, deploy, gates, verify commands)
- `docs/` runbooks when workflow, gates, deploy, or env changes
- `.cursor/rules/` when conventions or pitfalls should bind future edits
- `AGENTS.md` and `mem/` for durable preferences and decisions

## Rule files

- `.cursor/rules/00-handoff.mdc` — session start read + log append gate (`alwaysApply: true`)
- `.cursor/rules/post-task-documentation.mdc` — Purple-specific targets beyond the trio

## Install on other repos

`bash scripts/install-handoff-kit.sh` (idempotent).

## Rationale

Purple is edited from Cursor and Lovable with manual production deploys. Without mandatory doc sync, the next session repeats incidents, misses gates, or asks the user for manual steps the agent could run.
