---
name: Metric naming + as-printed rule
description: Every metric shows the canonical human name. PDF wording is preserved as "as printed: …" unless it already means the same. Map lives in src/lib/metric-naming.ts.
type: feature
---
Rule for every chart, card, and metric detail page:

1. Primary label = canonical human name from `METRIC_CANONICAL` in `src/lib/metric-naming.ts` (e.g. `iron_saturation` → "Iron Saturation").
2. Unknown keys fall back to humanized `metric_key`.
3. The PDF's exact wording is preserved underneath as "as printed: …" — UNLESS the PDF wording, normalized, already matches the canonical name (then the "as printed" line is hidden to avoid duplication).
4. Add new mappings to `METRIC_CANONICAL` when new labs appear. Never strip the PDF wording from the database; only the UI hides it conditionally.

Helper: `resolveMetricLabel(metricKey, pdfWording)` returns `{ primary, asPrinted }`.