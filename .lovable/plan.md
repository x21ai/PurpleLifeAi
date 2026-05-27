
# Plan: Footer tests, full E2E suite, and Caregiver Sharing

Three things, in this order. The sharing feature is the biggest piece and ships in its own slice so we don't block the tests.

---

## Slice 1 — Footer responsive tests (small)

Add Playwright. New spec asserts footer behavior across breakpoints.

- Install `@playwright/test`, add `playwright.config.ts` (baseURL = preview URL, retries 1, projects: chromium-mobile-375, chromium-tablet-768, chromium-tablet-1024, chromium-desktop-1440).
- `tests/e2e/footer.spec.ts`: for each route in `['/', '/welcome', '/today', '/biometrics', '/community', '/settings']`, at viewports **375, 768, 1023** → footer (`[data-testid="site-footer"]`) **not visible**; at **1024, 1440** → footer **visible**.
- Add `data-testid="site-footer"` to `src/components/layout/site-footer.tsx` (the only code change in this slice).
- `bun run test:e2e` script.

---

## Slice 2 — Full E2E suite (smoke + core flows + sharing)

One Playwright test user seeded per run. Specs:

1. `auth.spec` — sign-up email/password, sign-in, sign-out, password reset request.
2. `onboarding.spec` — `/welcome` → profile → consents → lands on `/today`.
3. `today.spec` — hero risk card renders, ask-FAB opens chat.
4. `journal.spec` — new text entry, new voice entry (mocked mic), entry appears in timeline.
5. `meds.spec` — add med, schedule slot, log dose as taken, adherence updates.
6. `biometrics.spec` — page loads, "no data" state OK, metric drill-down route loads.
7. `community.spec` — opt in, create post, comment, react, report (admin sees report).
8. `settings.spec` — theme switch (light/dark/system) persists, data export downloads.
9. `admin.spec` — super-admin (seeded `pmt@eigital.com`) sees all admin routes.
10. `sharing.spec` — full caregiver flow (see Slice 3 below).
11. `routes-smoke.spec` — every route in the route tree returns 200 and renders without console error, at desktop + mobile viewports.
12. `theme-footer.spec` — footer breakpoint spec from Slice 1, expanded to all routes.

Test user is created via a TanStack server fn `seedTestUser` gated by a `TEST_SEED_TOKEN` env var (only available in test env). Teardown deletes the user.

---

## Slice 3 — Caregiver Sharing ("Circle of Trust")

Your answers locked in: **Roles + per-scope toggles · Always needs your approval · Until I revoke** (we'll add expiry later as a follow-up; data model supports it from day one).

### Concept

You invite someone by email → they sign in or sign up → they appear in your **pending invitations** → you assign a role and toggle exact scopes → they get access. Anything they write (edits, comments) lands in your **approval queue** until you tap ✓. You can revoke instantly. Every view and change is logged.

### Roles (presets that pre-fill scope toggles, all editable per person)

| Role | Default scopes (you can flip any off) |
|---|---|
| **Emergency contact** | seizure_events:read, profile:read, location:read |
| **Caregiver / Co-pilot** (e.g. partner, parent) | all reads + meds:propose + journal:comment + alerts:receive |
| **Care provider** (clinician) | biometrics:read, meds:read, seizures:read, journal:read |
| **Viewer** | today:read only |

Scopes are atomic and composable: `today`, `journal`, `meds`, `biometrics`, `seizures`, `risk`, `community`, `profile`, `location`, `chat`, `alerts` × `read | comment | propose | receive`.

### Approval queue

Caregivers never write directly to your tables. Their actions become **pending_changes** rows with a typed payload (`type: 'edit_med' | 'add_journal_comment' | 'edit_profile' | ...`). Your inbox shows diff + caregiver + timestamp. Tap ✓ → server fn applies the change as you; tap ✗ → marked rejected with optional note.

### Data model (one migration)

```text
care_relationships
  id, owner_id (you), caregiver_id (nullable until accepted),
  invite_email, invite_token, role,
  status (pending|active|revoked),
  created_at, accepted_at, revoked_at,
  expires_at (nullable, reserved for future)

care_scopes
  relationship_id, scope (text), granted (bool)
  -- e.g. (rel_42, 'meds:propose', true)

pending_changes
  id, relationship_id, owner_id, caregiver_id,
  type, target_table, target_id, payload (jsonb),
  status (pending|approved|rejected), decided_at, decision_note

care_audit_log
  id, relationship_id, actor_id, action (viewed|proposed|approved|rejected|revoked),
  resource_type, resource_id, at, ip, user_agent
```

RLS: owner can CRUD their relationships, scopes, pending_changes, audit_log. Caregiver can SELECT their own active relationships, INSERT pending_changes for relationships they're active on, SELECT data only via dedicated `caregiver_read_*` security-definer functions that internally check `has_scope(relationship_id, scope)`.

### Server functions (`src/lib/care.functions.ts`)

`inviteCaregiver`, `acceptInvite`, `setScopes`, `revokeRelationship`,
`listMyCaregivers`, `listPeopleSharingWithMe`,
`proposeChange`, `approveChange`, `rejectChange`,
`caregiverReadToday`, `caregiverReadMeds`, `caregiverReadBiometrics`, …

All `requireSupabaseAuth`. Reads go through the security-definer functions so RLS stays simple.

### UI

- **Settings → Sharing** (new tab)
  - "People I share with" — list, role chip, scope summary, manage / revoke buttons
  - "People sharing with me" — list of owners who've invited you, click → care dashboard for that person
  - "Pending approvals" — count badge, queue with diff + ✓ / ✗
  - "Invite someone" — email + role picker + scope toggles + "Send invite"
  - Audit log link → full-page table, filterable by person/action/date
- **Top-bar badge** when pending approvals > 0 (link to queue)
- **Caregiver-side dashboard** (`/care/$ownerId`) — read-only views of granted scopes, "propose edit" buttons that open a sheet, comment thread on each section
- Invite email template (transactional, via existing email infra) with one-tap accept link

### What's deferred (call out, don't build yet)

- Time-limited access (`expires_at` already in schema, no UI this pass)
- Break-glass auto-unlock on seizure
- SMS invites (email only for v1)
- Caregiver mobile push notifications (in-app alerts only)

---

## Technical notes

- **Routes added**: `src/routes/_app/settings.sharing.tsx`, `src/routes/_app/care.$ownerId.tsx`, `src/routes/care.accept.tsx` (public, token-gated)
- **Components**: `CaregiverList`, `InviteCaregiverSheet`, `ScopeToggleMatrix`, `PendingApprovalsList`, `ChangeDiff`, `AuditLogTable`
- **No breaking changes** to existing tables — sharing layers on top
- **Tests**: `sharing.spec` covers invite → accept → scope toggle → caregiver propose → owner approve → caregiver sees change → owner revoke → caregiver access blocked + audit log entries
- **Order I'll ship**: Slice 1 (footer tests) → Slice 3 schema + server fns → Slice 3 UI → Slice 2 E2E suite (sharing.spec written alongside the UI)

Ready to implement on approval.
