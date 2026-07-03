# Post-task documentation

Every completed agent task must update project documentation before claiming done. Nothing important lives only in chat.

## Required surfaces

- `CURSOR_HANDOFF.md` for operational state (commit, deploy, gaps, verify commands)
- `docs/` runbooks when workflow, gates, deploy, or env changes
- `.cursor/rules/` when conventions or pitfalls should bind future edits
- `AGENTS.md` and `mem/` for durable preferences and decisions

## Rule file

Enforced via `.cursor/rules/post-task-documentation.mdc` (`alwaysApply: true`).

## Rationale

Purple is edited from Cursor and Lovable with manual production deploys. Without mandatory doc sync, the next session repeats incidents, misses gates, or asks the user for manual steps the agent could run.
