## Goal
Let users drop the Apple Health `export.zip` straight from their iPhone (Files app) onto the import page, instead of asking them to manually unzip it first and pick `export.xml`. The ZIP is what the Health app actually produces, so this removes a confusing step.

## How it works
1. Add a tiny client-side unzip dependency (`fflate` — pure JS, no native deps, works on Cloudflare Workers and in the browser, handles multi-hundred-MB files via streaming).
2. On `src/routes/_app/apple-health-import.tsx`:
   - Accept `.zip` in addition to `.xml` on the file input (`accept=".zip,.xml,..."`) and update the dropzone copy to say "Choose export.zip (or export.xml)".
   - When the chosen file ends in `.zip`:
     - Show a new "Unzipping…" phase with a spinner and a "Looking for export.xml" message.
     - Stream-unzip with `fflate.unzip` (or `Unzip` streaming API for big files), locate the first entry whose name ends in `/export.xml` or equals `export.xml` (Apple nests it under `apple_health_export/`).
     - Reconstruct a `File` from the extracted bytes and feed it into the existing `parseHealthExport(file, setProgress)` pipeline — no changes to parser or server functions.
   - If the zip doesn't contain `export.xml`, show a clear error: "That zip doesn't look like an Apple Health export — it should contain apple_health_export/export.xml."
   - Keep the existing `.xml`-direct path working unchanged.
3. Keep the privacy note accurate: file still never leaves the device; unzip + parse happen locally and only daily summaries are uploaded.

## Out of scope
- No server changes (`apple-health.server.ts`, `apple-health.functions.ts`, the webhook route stay as-is).
- No change to the Health Auto Export webhook flow.
- Not extracting the other files in the zip (workout routes GPX, ECG, clinical records) — only `export.xml` is needed for the daily-summary backfill we already support.

## Technical notes
- `fflate` is ~30KB, MIT, pure JS, no WASM, runs fine in the browser. Used only on the import page, dynamically imported so it doesn't bloat the main bundle.
- For very large zips (>500MB), use `fflate`'s streaming `Unzip` class to avoid loading the whole archive into memory at once; we only need to keep `export.xml`'s bytes.
- Memory: `export.xml` itself can be 500MB+ for long-time iPhone users. Once extracted we hand it to the existing `parseHealthExport` which already streams via `FileReader`/chunked reads, so behavior matches today's `.xml` path.
