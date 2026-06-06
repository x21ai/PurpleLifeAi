---
name: No em dashes
description: Em dash (—, U+2014) is banned project-wide in copy, code, comments, titles, emails, and i18n. Replace with comma, and, or, colon, period, or split the sentence.
type: constraint
---
Never use the em dash character `—` (U+2014) anywhere: UI copy, marketing
pages, emails, code comments, commit messages, docs, JSON strings, page
titles, alt text.

Replace by context:
- Parenthetical aside: wrap with `,` on both sides, or split into two sentences.
- List or definition lead-in: use `:`.
- Connector between clauses: use `and` or `or`.
- Appositive label (`X — Y`): use `,` or `.`.
- Signature or list marker at line start: use `-`.
- Numeric or date range (`9—5`, `Mon—Fri`): use `to` (`9 to 5`).
- Page title separator (`Title — Brand`): use `·` (`Title · Brand`).
- "No data" cell placeholder: `–` (en dash, U+2013) is acceptable.

En dashes (`–`) and hyphens (`-`) are allowed. Only `—` is banned.

**Why:** consistent voice, fewer typographic edge cases, easier copy review.

**How to apply:** before committing copy, grep for `—` and fix every match.
CI enforces this via `scripts/check-no-em-dash.mjs` (npm script
`check:em-dash`), which fails the build on any em dash under `src/` or
`public/`.