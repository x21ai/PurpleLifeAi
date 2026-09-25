# Phase Master Run

## Current phase

**Production hardening:** www Ploy hybrid live-data/auth correctness. Production deploy
remains operator-owned.

## Run log

| Date | Commit | Phase | Summary |
|---|---|---|---|
| 2026-09-25 | `8c59b8c0`, `e34f3653`, `e4c84e85`, `3353880e` | Production hardening | Make www Ploy live-data/auth mode survive SSR and hydration; constrain routes and assets; remove operator-only copy. |
| 2026-09-25 | pending | Production hardening | Remove www preview mode, constrain Ploy to live-wired routes, and verify production auth plus D1 reads. |
