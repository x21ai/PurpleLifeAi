## Problem

Generating the Medical history PDF throws `WinAnsi cannot encode (0x2192)` (the `→` character). pdf-lib's Helvetica only encodes WinAnsi, and `src/lib/medical-report.server.ts` already has a `safe()` sanitizer that maps `→` to `->` and strips any other non-WinAnsi codepoint. Most call sites pipe text through `safe()`, but a few don't, so a stray `→` (or any other non-WinAnsi codepoint that lives in user data — emoji in a med name, a journal note, a biometric source label, etc.) reaches pdf-lib raw and crashes the whole report.

Audit of `src/lib/medical-report.server.ts` shows three categories of unsafe calls:

1. `widthOfTextAtSize` calls that measure text before it is sanitized:
   - `wrap()` (line 141) — receives safed text from `P()` but is also reachable in future call sites; harden it to safe internally.
   - `truncate()` (line 197) — same; harden it.
   - `overlayChart()` legend, line 337 — `lx += c.font.widthOfTextAtSize(label, 8)` measures the raw chart-series source name. If a series key contains any non-WinAnsi codepoint this throws.
2. Any other ad-hoc string built from user data inside `overlayChart()` (axis labels, source names) that reaches `drawText`/`widthOfTextAtSize` without `safe()`.
3. `fmtDate` returns the raw input on parse failure (line 361). If a date column ever holds a weird string, it bypasses sanitization until `P()`/`table()` calls `safe()` — already covered, but worth keeping `safe()` as the single chokepoint.

## Fix

Make `safe()` the single, mandatory chokepoint for every string handed to pdf-lib in `src/lib/medical-report.server.ts`. Edits are local to that one file; no schema, no API, no other call sites change.

1. Add two tiny wrappers used everywhere in that file:
   - `drawSafeText(page, text, opts)` -> calls `page.drawText(safe(text), opts)`.
   - `widthSafe(font, text, size)` -> calls `font.widthOfTextAtSize(safe(text), size)`.
2. Replace every existing `c.page.drawText(safe(...), ...)` with `drawSafeText(c.page, ..., ...)` and every `font.widthOfTextAtSize(...)` with `widthSafe(font, ..., ...)`. This guarantees no future regression where someone forgets to wrap.
3. Harden `wrap()` and `truncate()` to call `safe()` on their input once at entry (idempotent, since `safe()` is already a no-op for already-safe text).
4. Fix the specific known leak at the chart legend (line 337) — `lx += widthSafe(c.font, label, 8)`.
5. Extend `safe()`'s explicit replacements with a few more common unicode glyphs likely to show up in user-entered text or AI-generated narrative so the PDF stays readable rather than just stripped: `↑ ↓ ⇒ ⇐ ≥ ≤ ± ° × ÷ ✓ ✗` -> ASCII equivalents (`^ v => <= >= <= +/- deg x / yes no`). Anything still outside WinAnsi after this gets stripped, as today.

## Verify

- Manually trigger PDF generation from `/reports/medical-history` with a profile whose data includes the previously failing input (any med/journal/note containing `→` or emoji). Confirm the PDF downloads.
- `bun run build` to confirm typecheck stays green.
- Skim the generated PDF for any visible mojibake or empty cells where text used to be.

## Out of scope

Embedding a Unicode font (e.g. via `fontkit` + a TTF) so the PDF could keep glyphs like `→` as-is. That would balloon the bundle and is unnecessary — the report is clinical text, ASCII substitutes are fine.
