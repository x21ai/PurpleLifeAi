## Two real problems, two surgical fixes

### 1. Metric pages are unreadable (white text on warm-white background)

**Root cause.** `MetricShell` paints a light canvas (`.metric-canvas` → bg `#F4F2EE`, color `#0A0A0F`), but every child uses Tailwind utilities like `text-foreground`, `text-muted-foreground`, `border-border`, `bg-secondary`. Those resolve from the global `--foreground` / `--border` / `--secondary` tokens, which under the user's dark theme are still **white-on-dark** values. `useRouteTheme("light")` is a documented no-op (`src/lib/use-route-theme.ts`), so the light-canvas pages render light bg + dark-theme tokens = invisible text.

**Fix.** In `src/styles.css`, inside `.metric-canvas` redeclare the shadcn tokens to their light values so every descendant utility flips correctly, regardless of the global theme:

```css
.metric-canvas {
  --background: 30 14% 95%;        /* warm white */
  --foreground: 240 10% 6%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 6%;
  --muted: 30 10% 92%;
  --muted-foreground: 240 4% 36%;
  --secondary: 30 10% 94%;
  --secondary-foreground: 240 10% 6%;
  --border: 36 12% 88%;
  --input: 36 12% 88%;
  --primary: 270 45% 50%;
  --primary-foreground: 0 0% 100%;
  background-color: #F4F2EE;
  color: hsl(var(--foreground));
}
```

That single scoped block fixes the trends detail page, biometrics drilldown, and any future MetricShell page without touching component code.

### 2. Failed report rows have no error message, no retry, no delete

**Root cause.**
- `report_documents.error_message` is populated by `processReport` on failure but never read by the documents list.
- `ReportRowActions` only renders **View** and **Download** — no delete, no retry.
- Filenames upload as raw storage hashes (`MuhF0B-VWHRj…`) because the upload uses the storage key as the title fallback. When extraction fails, the AI title never overwrites it, so the row shows the hash.

**Fix (scoped to two files, plus one server-fn tweak):**

1. **`src/lib/reports.functions.ts`**
   - `listReports`: also select `error_message`.
   - Already have `processReport` and `deleteReport` — reuse, no new server fns.

2. **`src/components/reports/report-row-actions.tsx`** — extend to accept `status`, `onChanged` callback, and render a kebab menu (shadcn `DropdownMenu`) with:
   - **View PDF** (existing)
   - **Download** (existing)
   - **Re-run extraction** (only when `status` is `failed` / `needs_credits` / `rate_limited`) → calls `processReport({ data: { reportId } })`, toasts result, calls `onChanged()`
   - **Delete** (always) → confirm via `AlertDialog`, calls `deleteReport({ data: { id } })`, toasts, `onChanged()`

3. **`src/routes/_app/reports.documents.tsx`**
   - Pass `status={r.status}` and `onChanged={() => refetch()}` to `<ReportRowActions />`.
   - When `r.status === "failed"` (or `needs_credits` / `rate_limited`), render `r.error_message` (truncated to ~140 chars) under the "Extraction failed" line in a muted `text-[#FFA8BD]/70` style so the user can see *why* it failed (AI credits, parse error, etc.).
   - Replace the raw filename title fallback: if `r.title` looks like a storage hash (regex: no spaces, >24 chars, mixed case + digits), render `"Untitled upload"` instead — keeps the row readable while the original title remains accessible via title attr / detail page.

### Out of scope (intentional)

- Renaming reports inline — separate request.
- Bulk-delete / bulk-retry — separate request.
- The earlier responsive sweep is still pending; this plan does not address it.

### Files touched

- `src/styles.css` — add scoped token overrides inside `.metric-canvas` (~15 lines).
- `src/lib/reports.functions.ts` — add `error_message` to `listReports` select.
- `src/components/reports/report-row-actions.tsx` — dropdown with retry + delete.
- `src/routes/_app/reports.documents.tsx` — show error_message, friendlier title fallback, wire `onChanged`.

No DB migration, no new server functions.