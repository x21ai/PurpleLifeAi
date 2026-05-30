## Travel mode & smart dose reminders

Two connected features: (1) a Travel Mode that keeps your dose schedule medically correct as you cross timezones, and (2) a real reminder system that alarms your phone until you confirm.

---

### 1. Travel Mode — "Anchor to home time"

**Principle:** A dose set for 10:00 AM in your home tz (EST) is *always* taken at 10:00 AM EST, no matter where you are. We just show it in your current local time so you know when on your watch to take it.

**Trip setup (two entry points):**
- **Manual planner** — Settings → Travel → "Plan a trip": pick destination, depart date/time, return date. App shows a preview of every dose for the trip in both home time and local time, flags any that land during your sleep window, and lets you confirm.
- **Auto-detect** — When the browser tz differs from your home tz for >2 hours and no active trip exists, a banner appears on Today: *"Looks like you're in Hong Kong (HKT). Start travel mode? [Yes, anchor to home time] [I moved — update home tz]"*.

**What you see while traveling:**
- Today screen shows each dose with **two times**: large local time ("3:00 AM HKT") + small home-time chip ("10:00 PM EST · home"). No ambiguity about whether a dose is "the 10 PM one".
- Sleep-window warning: doses falling inside your wake/sleep window get a moon icon and tooltip *"This lands at 3 AM local. OK to take if you wake; otherwise log when you do."*
- A trip badge in the header for the duration.

**What stays the same:**
- `scheduled_at` is still stored in UTC, derived from `times_of_day` interpreted in your **home** tz (never the device tz during a trip).
- Drug intervals are preserved exactly — that's the whole point of anchoring.

**Editing while away:**
- Manually logging a dose ("I took it now") uses real `now()` as today — already works.
- If you genuinely move (not travel), tap "Update home timezone" in the banner; we stop anchoring and the next nightly regen uses the new home tz.

---

### 2. Sleep window

- New profile field: `wake_time` / `sleep_time` (defaults 7:00 AM / 11:00 PM home tz).
- Editable in Settings → Preferences.
- Doses landing inside this window get a visual warning ("During sleep — take when you wake"), but are **not** auto-moved. You can long-press → "Move to wake time" if you want.

---

### 3. Dose reminders with alarm

**Per-med setting** on each medication: *Reminder style*
- **Standard** (default) — single push notification at scheduled time. Tap to confirm Taken/Skip/Snooze.
- **Critical / persistent alarm** — repeating alarm sound + push every N minutes (you pick 5/10/15) until you confirm Taken or Skip. Intended for seizure meds.

**How it works:**
- PWA push notifications via the existing service worker (`public/sw.js`) — requires "Add to Home Screen" + notification permission, which we'll prompt for on the meds page when reminders are first enabled.
- In-app: when the app is open at dose time, an alarm sheet pops up with a sound loop (Web Audio) and Taken/Snooze/Skip buttons.
- Snooze interval is per-user in Settings (5/10/15 min, default 10).
- Confirming "Taken" writes to `medication_doses` exactly like the existing Today actions.

**Reliability honest note:** browser push is best-effort; if the OS kills the PWA, alarms may not fire. We'll show a one-time setup checklist (install PWA, allow notifications, disable battery optimization) and a banner if permissions are missing.

---

### Technical details

**Schema (one migration):**
- `profiles`: add `home_timezone` (rename usage of existing `timezone` → home), `wake_time time`, `sleep_time time`, `snooze_minutes int default 10`.
- `medications`: add `reminder_style text default 'standard'` (`'standard' | 'critical'`).
- New table `trips`: `id, user_id, destination_tz, depart_at, return_at, status, created_at` + RLS owner-only + GRANTs.
- Update `seed_daily_medication_doses()` and `regenerate_today_pending_doses()` to always use `home_timezone` (ignore active trip's destination tz — that's the anchor behavior).

**Code:**
- `src/routes/_app/settings.travel.tsx` — trip planner UI + list of past/upcoming trips.
- `src/components/travel/trip-banner.tsx` — auto-detect banner on Today.
- `src/components/travel/dual-time.tsx` — render "3:00 AM HKT · 10:00 PM EST home" on dose rows when a trip is active.
- `src/lib/travel.functions.ts` — `createTrip`, `endTrip`, `previewTripSchedule` server fns.
- `src/lib/reminders.ts` — service worker registration, notification scheduler, alarm sheet.
- `src/components/meds/reminder-alarm-sheet.tsx` — fullscreen alarm UI with audio loop.
- `src/components/meds/medication-form-sheet.tsx` — add "Reminder style" select.
- `src/components/meds/today-doses.tsx` — show dual-time chip when trip active; show sleep-window moon icon.
- `public/sw.js` — handle `showNotification` + click actions (taken/snooze/skip routing back to app).
- New server route `src/routes/api/public/hooks/dose-reminders.ts` + pg_cron every minute to fan out push notifications for due doses (only for users with critical-style reminders or push subscriptions).

**Out of scope (call out if you want them):**
- Gradual-shift / jet-lag taper transitions (you chose anchor-only — can add later).
- SMS or email fallback alarms.
- Apple/Google Calendar export of trip schedule.

---

### Files touched

```text
supabase/migrations/<new>.sql                          (schema + RLS + GRANTs)
src/integrations/supabase/types.ts                     (auto)
src/routes/_app/settings.tsx                           (link to travel)
src/routes/_app/settings.travel.tsx                    (NEW)
src/routes/_app/settings.preferences.tsx               (wake/sleep, snooze)
src/routes/_app/today.tsx                              (trip banner)
src/components/travel/trip-banner.tsx                  (NEW)
src/components/travel/dual-time.tsx                    (NEW)
src/components/meds/today-doses.tsx                    (dual-time, sleep icon)
src/components/meds/medication-form-sheet.tsx          (reminder style)
src/components/meds/reminder-alarm-sheet.tsx           (NEW)
src/lib/travel.functions.ts                            (NEW)
src/lib/reminders.ts                                   (NEW)
src/routes/api/public/hooks/dose-reminders.ts          (NEW, cron target)
public/sw.js                                           (push handlers)
```

All viewports (mobile/tablet/desktop) covered per workspace rule.
