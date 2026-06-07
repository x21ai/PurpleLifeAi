# Three improvements

## 1. Upload report — drop title/date, support multi-file, AI auto-detects

**`src/routes/_app/reports.new.tsx`** — simplify the form:
- Remove Title and Report date inputs entirely.
- Replace single `<input type="file">` with a multi-file picker (`multiple` attr) + drag-and-drop zone. Accept PDF/JPG/PNG/HEIC/WEBP, 15 MB each.
- For each picked file: upload to `reports` bucket, insert a `report_documents` row with a placeholder title (filename) and `status: 'processing'`, then fire `processReport({ reportId })`. Run uploads in parallel with a per-file progress row.
- After all kick off, navigate to `/reports` with a toast like "3 reports uploading · Purple is reading them now".

**`src/lib/reports.functions.ts` / `reports.server.ts`** (extraction handler): ensure the AI extraction prompt also returns a detected `title` and `report_date`, and the handler writes them back to `report_documents` when the row's current title is the placeholder filename. (Already extracts values; just add title + date to the output schema and the update statement.)

**Reports list page** (`src/routes/_app/reports.tsx`): no change needed — it already renders extracted values and per-report charts/logs. Verify the "processing" → "ready" transition still shows nicely for multiple rows arriving together.

## 2. Insights — hide Seizures tab when the user hasn't opted into seizures

**`src/routes/_app/insights.tsx`**:
- Read `profiles.conditions` (text[]) for the current user.
- Treat the user as a "seizure tracker" only if `conditions` includes `"epilepsy"` or `"seizures"` (matching the same keys used in `src/lib/condition-prompts.ts`).
- If not: hide the Seizures `TabsTrigger` + `TabsContent`, and set `defaultValue="trends"`.
- Keep the existing layout for users who do track seizures.

(Why this hits pmt@eigital.com: their profile has no seizure condition selected, so Seizures should not appear.)

## 3. Care chat — attachments + visible date/time on every message

**Storage**: new private bucket `care-chat-attachments` with RLS so only thread participants can read/write their own files. Path shape: `{thread_id}/{message_id}/{filename}`. Files served via short-lived `createSignedUrl` (per the project's private-media rule).

**Schema**: `care_messages.attachments` (jsonb) already exists. Standardize shape:
```
[{ path: string, name: string, mime: string, size: number, kind: "image"|"file" }]
```

**Server fns** (`src/lib/care-chat.functions.ts`):
- `sendCareMessage`: accept optional `attachments` array, validate with Zod, allow empty body when attachments are present.
- New `getCareAttachmentUrl({ messageId, path })`: verify caller is a participant of the message's thread, return a signed URL (5 min TTL).

**UI** (`src/routes/_app/chat-care.tsx`):
- Composer: add a paperclip button that opens a file picker (images + PDFs + common docs, multi-select, ~15 MB each). Show pending thumbnails/filenames above the input with a remove (×) button. Send uploads files to storage first, then calls `sendCareMessage` with the attachments metadata.
- Message bubble:
  - Always render a visible timestamp under each bubble in the user's locale (e.g. "Jun 5 · 9:24 PM" if not today, "9:24 PM" if today). Today's chat shows only "hi · Jun 5" with no time — fix by always rendering time, plus the date when it's not today.
  - Render image attachments as inline thumbnails (click → lightbox / open in new tab) and non-image attachments as a download chip with filename + size. URLs come from `getCareAttachmentUrl` (cached per messageId via React Query).
- Day separators: insert a centered "Today / Yesterday / Jun 3, 2026" divider between messages when the date changes.

## Technical notes
- All three work items are scoped, additive, and keep existing copy/branding.
- Storage bucket + RLS goes through one migration (private bucket, policies scoped to `care_thread_participants`).
- `processReport` already runs as a background server fn — multi-file just fans out N parallel invocations.
- No new dependencies.

## Out of scope (ask separately if wanted)
- Voice notes in chat
- Typing indicators / read receipts in chat UI
- Reordering / deleting uploaded report files before extraction starts
