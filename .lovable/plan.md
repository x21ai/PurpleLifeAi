## Goal

Add a dedicated full-screen, dark-mode capture screen at `/journal/new` with live Web Speech transcription, parallel MediaRecorder audio capture, upload to `journal-media`, and `journal-processor` invocation.

Note: `Purple_Design_System_v2.md` does not exist in the repo. I'll use the existing v2 tokens already in `src/styles.css` (`--purple-primary`, `surface-ai`, etc.) and the patterns established in other v2 routes (chat, today, vitals). If you have the spec file, drop it in and I'll align exactly.

## Changes

### 1. New route — `src/routes/_app/journal.new.tsx`
- Full-screen, `useRouteTheme("dark")`, no bottom nav padding (own layout).
- Top bar: Close (X) on left → navigates back to `/journal`; "Save" pill on right (disabled until content).
- Body (scrollable):
  - Serif `Textarea` for free text.
  - **Live transcript panel** (the "purple-soft preview box"): visible while `listening` or once `transcript` exists. Uses `surface-ai` style (rgba purple tint, rounded-[20px], padding 16px), serif body text, with `VoiceWave` (3 pulsing purple dots) + "Listening…" label header.
  - Attachments grid (photo/video thumbs with remove).
- Bottom dock:
  - 56px round mic button, centered. Idle: `bg-[var(--purple-primary)]` with `Mic` icon. Recording: `bg-destructive` with `Square` stop icon and outer pulse ring.
  - Secondary row: Photo / Gallery / Video icon buttons (smaller, ghost).

### 2. New component — `src/components/journal/voice-wave.tsx`
Three `.h-1.5 .w-1.5 rounded-full bg-[var(--purple-primary)]` dots with staggered `animate-pulse` (delays 0/150/300ms).

### 3. Reuse existing `useVoiceCapture` hook
Already runs Web Speech + MediaRecorder in parallel and exposes `transcript`, `audioBlob`, `listening`, `start/stop/reset`. Good as-is.

### 4. Save flow (same contract as current CaptureSheet, adjusted path)
1. Stop voice, wait ~80ms for blob.
2. Insert `journal_entries` row: `kind: "voice"` when only voice content, otherwise inferred (`mixed`/`photo`/`video`/`text`); `status: "processing"`.
3. Upload audio to `journal-media` at `{user_id}/{entry_id}/audio-{timestamp}.m4a` (note: blob mime from MediaRecorder is typically `audio/webm`; we'll keep the `.m4a` filename per spec but pass actual `contentType` from the blob so playback still works — flag if you'd rather force `.webm`).
4. Upload any photo/video attachments under same prefix.
5. Create signed URLs (1 yr) → update `media_urls`.
6. Fire-and-forget `supabase.functions.invoke("journal-processor", { body: { entry_id } })`.
7. Navigate back to `/journal`.

### 5. Wire entry point
In `src/routes/_app/journal.tsx`, change the "New entry" button (currently opens `CaptureSheet`) to `navigate({ to: "/journal/new" })`. Keep `CaptureSheet` file for now (unused) so nothing else breaks; can delete in a follow-up.

## Tokens used
`--purple-primary`, `surface-ai`, `bg-background`, `text-foreground`, `bg-destructive`, existing serif/sans font classes — all already defined.

## Out of scope
- Editing `journal-processor` edge function.
- Changing `useVoiceCapture` internals.
- Removing `CaptureSheet` (left in place for safety).