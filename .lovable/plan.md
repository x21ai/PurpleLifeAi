# Purple — Care, Ingest, Export & Localization Master Plan

Built **one phase at a time**. Each phase = ship → you test on staging → I move to the next. Nothing in later phases touches earlier phases' data.

---

## Phase 0 — Live-user safety (TODAY, before anything else)

Devyn is actively using the app. Before I write a single line of new feature code:

1. **Snapshot her data.** Export every row owned by Devyn (`d7d17e54-b6e5-4775-877b-e77ce661fc54`) — profile, journal_entries, medications, medication_doses, biometric_readings, seizures, reports, trips, care_relationships — to a timestamped JSON file in `/mnt/documents/backups/devyn-YYYYMMDD-HHMM.json`. Repeat this snapshot at the start of every subsequent phase.
2. **Working agreement (enforced for the rest of this project):** no destructive migrations on tables that hold her data. Schema changes are additive only (new columns nullable, new tables, new indexes). Any column rename / drop / type-narrow is forbidden — we add the new column, dual-write, migrate, then deprecate.
3. **Grant pmt@eigital.com full caregiver access to Devyn's account.** Two-row insert:
   - `care_relationships` (owner=Devyn, caregiver=pmt, role=`caregiver`, status=`active`, no expiry)
   - `care_scopes` — all granted scopes on for that relationship (today/biometrics/meds/journal/seizures/reports)
   - `super_admin` already on pmt; no change to roles table.

**Gate:** you confirm in the UI you can see Devyn from pmt's account before Phase 1.

---

## Phase 1 — Multi-patient experience for caregivers

Today: caregiver can view one patient at `/care/$ownerId` but there's no switcher and no "who am I currently caring for" concept.

1. **"My people" hub** at `/care` — lists every active care_relationship where you're caregiver. Each row: avatar/initials, name, condition tag, last-activity dot, quick stats (today's score, meds taken today, last journal).
2. **Patient context switcher** in the top bar (mobile + desktop + tablet) — avatar dropdown lets caregiver switch between "My own account" and each person they care for. Selection persists in localStorage + URL, so a refresh keeps the active patient.
3. **Visual safety rail** — when viewing someone else's account, the entire shell shows a thin colored banner: *"Viewing Devyn's account · acting as caregiver"*. Prevents accidentally logging your own seizure on mom's account.
4. **Bottom-nav adapts** — when in patient context, nav shows that patient's Today/Journal/Meds/Insights, scoped via `ownerId` everywhere.

**Gate:** pmt logs in → sees Devyn in /care → switches into her account → sees her real data → switches back to own account cleanly.

---

## Phase 2 — Caregiver write + audit + notifications

Per your call: caregivers can write *everything* directly, no approval, but audited and reversible.

1. **`care_audit_log` already exists** — extend it: every insert/update/delete by a caregiver on owner's data writes a row with `actor_id`, `action`, `entity`, `entity_id`, `before`/`after` snapshots.
2. **All existing server functions** that write to journal_entries / medications / medication_doses / biometric_readings / seizures / report_documents get a `targetUserId` parameter. If targetUserId ≠ caller, we verify `has_care_scope(...)`, write as the target user, and emit an audit row tagged with caregiver's name + initials.
3. **"Care activity" feed** — new panel on Today and a full page at `/care-activity` showing entries like *"PM added a journal entry · 2h ago · [View] [Edit] [Archive]"* with the WhatsApp-style colored-initial avatar. Patient (Devyn) can edit, soft-delete, or archive any caregiver entry from this feed. Soft-delete = `archived_at`, never hard delete — preserves audit.
4. **Notifications** — new `notification_preferences` row per user: toggle for "Notify me when a caregiver adds / edits / deletes my data." Channels: in-app bell, web-push (already wired), email. Default ON for Devyn, configurable per-event-type.

**Gate:** pmt adds a test journal entry on Devyn's account → Devyn gets in-app + push notification → Devyn can edit/archive → audit row visible.

---

## Phase 3 — Multi-format upload (PDF / image / Word → PDF)

Builds on existing `/reports/new`.

1. **Accept** .pdf, .jpg/.jpeg/.png/.heic/.webp, .docx, .doc up to 25 MB (was 15).
2. **Conversion pipeline** via CloudConvert (your choice). Add `CLOUDCONVERT_API_KEY` secret. New server function `convertToPdf` — on `.docx`/`.doc`/`.heic` upload, queue conversion, store BOTH original and resulting PDF, set `report_documents.normalized_pdf_path`.
3. **Images** — if user uploads 1-N images of a lab report, we group them and stitch into a single PDF using `pdf-lib` (Worker-compatible).
4. **Camera capture** — `/reports/new` gets a "Take photo" CTA that uses `<input capture="environment" multiple>` on mobile, plus a guided multi-page flow ("Photo 1 of paper · Add another page · Done"). Works on iOS Safari + Android Chrome.
5. **AI extraction** keeps running on the normalized PDF — no change to `processReport` downstream.

**Gate:** Devyn uploads a real lab PDF, a .docx, and three phone photos → all three appear as PDFs in /reports with extracted values.

---

## Phase 4 — Email-in (forward to Purple)

Cloudflare Email Routing → Worker → our server route.

1. **DNS** — you add MX records for `inbox.purplelife.org` pointing to Cloudflare. I'll provide the exact records.
2. **Cloudflare Email Worker** — receives the email, posts the raw MIME to `POST /api/public/email/inbound` on our app with an HMAC signature (`EMAIL_INBOUND_SECRET`).
3. **Inbound handler** parses MIME (`postal-mime`, Worker-safe), figures out the sender, matches to a user account by `from:` address (must be a verified email on Purple or a verified caregiver). Unknown senders → 200 + drop with a bounce notice.
4. **Routing rules** by subject prefix or recipient localpart:
   - `report@…` / `Subject: Report` → creates a `report_documents` row with all attachments (PDFs/images stitched via Phase 3 pipeline).
   - `journal@…` / default → creates a `journal_entries` row with email body as text and attachments as media. Runs through existing journal-extract.
   - `med@…` → logs a dose for the most-likely medication (fuzzy match on subject).
5. **Caregiver-on-behalf** — if sender is a caregiver, we create the entry against the patient they last had selected; if ambiguous, we reply asking *"Which person is this for? Reply 1 for Devyn, 2 for …"*.
6. **All inbound entries are audit-logged and notify the patient** (Phase 2 plumbing).

**Gate:** Devyn forwards a Quest PDF to `inbox@purplelife.org` → sees it in /reports within 30s. pmt emails a journal note on her behalf → Devyn gets notified.

---

## Phase 5 — "Send to my doctor" PDF export

1. **`/reports/export` page** — pick date range (default: last 90 days), pick sections (vitals, meds + adherence, journal summary, seizure log, recent lab values, AI-generated narrative summary), pick recipient.
2. **Server function `buildDoctorReport`** renders a branded multi-page PDF with `pdf-lib` (Worker-safe). Sections include the standard medical disclaimer.
3. **Delivery options:** download, email-to-doctor (uses Lovable Emails infra; needs you to confirm sender domain), or share-link (signed URL, expires in 7 days, revocable from Settings).
4. **Caregivers** can generate this for any patient they have `reports` scope on.

**Gate:** Devyn generates a 30-day report → opens cleanly in iOS Mail → arrives in test doctor inbox.

---

## Phase 6 — Resume localization (the original "all one by one" thread)

Once features above are stable, pick up the 5 remaining localization phases from where we paused — in this order, each its own ship+test cycle:
- 6A: public marketing pages (index, features, pricing, about, contact, charter, terms, privacy, resources, sign-up)
- 6B: shared layout + nav (touches every screen — biggest visual surface)
- 6C: remaining app routes (account, settings, tools, reports detail, care.accept, oauth callback)
- 6D: community + messages
- 6E: feature components (journal, meds, biometrics, care, today, settings, account, chat-fab, pwa, travel, connections, disclaimer)
- 6F: admin panel (lowest priority)

---

## Non-negotiables for every phase

- **Snapshot before, smoke-test after** on Devyn's account.
- **Additive migrations only.** New columns nullable, new tables, no destructive changes.
- **Mobile + tablet + desktop** verified for every UI change (per workspace knowledge).
- **No new Supabase Edge Functions** — server logic is `createServerFn`; raw HTTP for email-in goes in `src/routes/api/public/`.
- **Audit + notify** on every caregiver write.
- **Soft-delete only** for any user-visible content from Phase 2 onward.

---

## What I need from you before I start Phase 0

1. ✅ Confirmed: pmt@eigital.com gets full caregiver access to Devyn (all scopes, no expiry).
2. Confirm Devyn's email `devynrosewalker@gmail.com` is the address she actually signs in with (so notification email targeting is correct).
3. For Phase 4 — confirm you own/control `purplelife.org` DNS and can add MX records when we get there.
4. For Phase 5 — is "doctor email" going through Lovable Emails (using your existing `notify.purplelife.org` sender) or do you want a separate domain?

Approve this plan and I'll start Phase 0 (snapshot + caregiver grant) immediately.