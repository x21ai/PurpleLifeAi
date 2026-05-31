## Scope

Four threads, sequenced so visual work lands on a stable IA and a working locale.

The two HEICs decode to Oura "My Devices" screens (dark sheet: device card with ring + circular battery arc, secondary card for the charging case, "+ Set up a new device" row, and a "Wear and care" link list with external-link chevrons). They're the visual reference for the new `/tools` surface.

## 1. Locale: saved choice always wins

Problem today: `resolveClientLocale()` returns `navigator → stored → default`, so even after saving "Español" to Supabase + localStorage, the next navigation re-reads navigator (English) and reverts. Saved profile locale is never seeded into the i18n cache either.

Changes (all in `src/i18n/index.ts` + one hook):
- Flip the chain to `stored → profile (seeded) → navigator → default`.
- Add `seedLocaleFromProfile(locale)` — called once when `AuthContext` loads `profiles.locale` — that writes localStorage and calls `i18n.changeLanguage` if different. This makes "saved wins" survive a cleared localStorage on a new device too.
- `setLocale()` already writes localStorage; keep it, and have `PreferencesSection.onLocaleChange` call it on save (already does) — confirmed still correct after chain flip.
- `hydrateLocale()` runs in `__root.tsx`; after change it will pick stored first, so navigation can never demote Spanish back to English.
- Verify by toggling to Español, navigating across `/today → /settings → /tools → /account`, and reloading — UI stays Spanish.

## 2. IA split: Account vs Settings vs Tools

Today everything lives under `/settings`. Mirror Oura's three-surface model.

New routes (file-based, all under `_app`):
- `src/routes/_app/account.tsx` — identity & security
- `src/routes/_app/settings.tsx` — preferences (keep route, slim down)
- `src/routes/_app/tools.tsx` — devices, integrations, utilities

Move map:

| New home | Items moved from current settings |
|---|---|
| **Account** | Full name, email (read-only), phone number, change password, enable 2FA, region (country + timezone), language, appearance (theme), sign out |
| **Settings** | Your focus (conditions), AI model, Floating Ask, sleep window, reminder snooze, How Purple thinks, sharing & access, travel mode, data export/delete, about |
| **Tools** | Oura connection, phone alarms, medications, lab reports, past episodes (when applicable), community |

Bottom-nav / drawer: replace the single "Settings" entry with three (Account, Settings, Tools). Keep `/settings` redirecting deep-links by rendering the slim Settings page; no breaking links because all moved items get redirect stubs (`/settings/appearance → /account#appearance` etc.) only where one already exists.

New supporting pieces:
- `src/components/account/profile-fields.tsx` — full name, phone (E.164 input).
- `src/components/account/password-section.tsx` — change password via `supabase.auth.updateUser({ password })`.
- `src/components/account/two-factor-section.tsx` — TOTP enrol/verify using `supabase.auth.mfa.*` (enroll → QR → verify code → list factors → unenroll). Backend already supports this; no migration needed.
- Move `AppearanceSection` and `LocaleFields` (region + language) out of `preferences-section.tsx` into Account.

## 3. Oura-like redesign (mobile, tablet, desktop)

Visual direction matches the attached screenshots: deep near-black background, large rounded "card-sheet" containers (`rounded-3xl`, subtle inner highlight), generous padding, light sans-serif type at large sizes with thin weight for numbers, soft secondary text, and a top "X close" affordance on full-screen surfaces.

Tokens & shell:
- Add `--surface-sheet` (oklch deep neutral) and `--surface-card` (one step lighter) in `src/styles.css`, plus `--sheet-radius: 1.75rem`.
- New `SheetPage` layout primitive: full-bleed dark bg on mobile, max-w-3xl centered on tablet, max-w-5xl two-column grid on desktop (left: sectioned cards, right: sticky summary like Oura's web dashboards).
- Title pattern: tiny "X" top-left, centered page title in light sans, then stacked cards.

Card patterns to mirror:
- **Device card** (Tools → Connections): device name + subtitle, hero illustration (ring/phone), circular battery arc (SVG), "Active | Sensing" status row.
- **List card** (Wear and care): label + right-aligned external-link icon, divided rows.
- **Action row** ("+ Set up a new device"): primary-accent text with leading "+".

Breakpoint behavior:
- Mobile (≤640): single column, sheet-style cards span the viewport with 20px gutter.
- Tablet (641–1024): centered single column, max-w-2xl, larger type scale.
- Desktop (≥1025): two-column on Account/Tools (cards + sticky meta), single wide column on Settings.

Apply the same treatment to: Account, Settings, Tools, plus `/today`, `/journal`, `/meds`, `/biometrics`, `/insights` headers so the whole app feels consistent — header eyebrow + huge serif title stays as Purple's signature, but card chrome adopts the Oura sheet treatment.

## 4. Deliverable: HEIC conversion

The two uploaded HEICs are now decoded to JPG previews and used as the visual reference above. Nothing to ship for the user here — done as part of the planning step.

## Technical notes

- No DB migration needed for Account fields: `profiles` already has `country`, `timezone`, `locale`, `full_name`. Phone goes on `profiles.phone` if it exists; otherwise add a single column in one migration.
- 2FA uses Supabase Auth's built-in MFA API — no edge function, no extra table.
- Route moves keep loaders/serverFns where they are; only the UI mount-point changes.
- Bottom nav updated in `src/components/app/bottom-nav.tsx` (or equivalent) to three entries.
- All new card chrome uses semantic tokens; no raw colors in components.

## Out of scope (ask before adding)

- Reorganizing `/today` or biometric detail pages beyond chrome polish.
- Wiring real device data (we have Oura already; the device card is the only "device" until more integrations land).
- Localizing every string into Spanish — fix the persistence bug now; full string coverage is a separate pass.
