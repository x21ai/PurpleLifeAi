# Medication Reminder Reliability

A missed seizure med is not a UX bug, it is a safety event. This document describes how Purple measures reminder delivery, what the target is, and where the platform itself sets the ceiling.

## Target

**99% of scheduled doses produce a visible notification within 60 seconds of their scheduled time while the app is installed (PWA) with notifications granted.** Acknowledgment rate is tracked as a secondary signal of whether notifications are actually being seen, not just fired.

## The two delivery paths

| Path | Mechanism | Logged by |
|------|-----------|-----------|
| `sw_local` | Service worker polls an IndexedDB dose schedule every 60s (`public/sw.js`) and shows the notification locally; works offline | The SW itself, into an IndexedDB queue, flushed by the app on open |
| `web_push` | The dose-reminders cron (`/api/public/cron/dose-reminders`, every minute) sends a web push per due dose; works when the page and SW are both dead, requires network | The server at send time; the SW refines `fired_at` with the on-device receipt time when the push arrives |

The two paths are deliberately redundant. The same dose may notify through both; the notification `tag` collapses duplicates on the device.

## Instrumentation model

Table: `notification_delivery_log` (owner-only RLS plus service-role insert).

| Column | Meaning |
|--------|---------|
| `dose_id`, `scheduled_at` | Which dose, and when it was supposed to fire |
| `fired_at` | When a notification was actually shown (null = never fired, or ack arrived without a logged fire) |
| `delivery_channel` | `sw_local` or `web_push` |
| `acknowledged_at`, `acknowledged_action` | When and how the user responded: `taken`, `skip`, `snooze`, or `opened` (plain tap) |

Event flow:

1. **SW-local fire**: `sw.js` shows the notification and queues `{fired, sw_local}` in IndexedDB. The SW has no auth context, so the signed-in app flushes the queue to `logNotificationDeliveries` on open (`src/lib/notification-delivery.ts`, called from DeferredStartup).
2. **Web push fire**: the cron inserts the row at send time with the service role. When the SW receives the push it queues a `received` event; the flush refines `fired_at` to the on-device time.
3. **Acknowledgments**: notification action buttons call the `med-dose-action` edge function (which stamps the ack server-side immediately); plain taps queue an `opened` ack flushed on next open.

Metrics surface: admin dashboard > "Med reminder reliability", backed by `getNotificationReliabilityStats` (admin-gated): doses scheduled, fired, fired within 60s, acknowledgment rate, over a chosen window.

## Self-healing: no silent data loss

Delivery can fail (device off, browser killed the SW, push subscription expired). The invariant is that a delivery failure must never become silent data loss:

- On app open, Today diffs the past 24h of still-`pending` doses against the delivery log. Doses that should have fired but have no logged fire surface as a gentle catch-up card: "You may have missed your 7pm dose yesterday. Want to log it?" with one-tap took-it / missed-it (`src/components/today/missed-dose-catchup.tsx`).
- The dose-reminders cron separately escalates doses still pending 25-35 minutes after schedule ("Still pending" push).

## Honest platform limits

- **iOS Safari / iOS PWA**: background SW execution is heavily throttled; the 60s poll loop only runs while the PWA is open or recently backgrounded. Web push on iOS requires the app to be installed to the home screen (iOS 16.4+) and notifications granted. Expect `sw_local` gaps on iOS; `web_push` plus the catch-up card are the backstop.
- **Android Chrome**: SW timers survive backgrounding far longer, and web push wakes the SW reliably; this is the platform where the 99%/60s target is genuinely achievable.
- **Desktop browsers**: reliable while the browser runs; nothing fires when it is fully closed except web push (Chrome/Edge keep a background process by default, Firefox does not).
- **Timer granularity**: the SW poll and the cron both run on a 60s cadence, so worst-case on-time delivery is ~60s after schedule; that is the reason the target is "within 60 seconds".
- **Quiet hours**: doses due inside the user's configured quiet hours intentionally do not push; they are marked notified to avoid a pile-up and appear in Today's dose list and the catch-up logic instead.

## Reading the numbers

- `fired / scheduled` below target usually means uninstalled PWAs, denied permissions, or expired push subscriptions (the cron prunes `gone` endpoints on every run).
- `firedWithin60s / fired` below ~95% suggests cron lag or SW throttling; check the Cloudflare cron trigger history first.
- Low acknowledgment rate with healthy fire rate is a UX signal (notifications seen but ignored), not a delivery problem.
