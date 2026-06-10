import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendPushToSubscription } from "@/lib/push.server";

// Called by pg_cron every minute.
// 1. First-fire: pending doses scheduled within the last 60s get a push (notified_at set).
// 2. Escalation: pending doses scheduled 25–35 min ago that the user hasn't acted on
//    get one follow-up nudge (missed_notified_at set).
// Both passes skip users whose local time falls inside their quiet hours window.

function inQuietHours(
  nowUtc: Date,
  tz: string | null,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const [hh, mm] = fmt.format(nowUtc).split(":").map((n) => parseInt(n, 10));
    const cur = hh * 60 + mm;
    const [sh, sm] = start.slice(0, 5).split(":").map((n) => parseInt(n, 10));
    const [eh, em] = end.slice(0, 5).split(":").map((n) => parseInt(n, 10));
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (s === e) return false;
    return s < e ? cur >= s && cur < e : cur >= s || cur < e;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/cron/dose-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const windowStart = new Date(now.getTime() - 60_000).toISOString();
        const windowEnd = new Date(now.getTime() + 30_000).toISOString();
        const escalateFrom = new Date(now.getTime() - 35 * 60_000).toISOString();
        const escalateTo = new Date(now.getTime() - 25 * 60_000).toISOString();

        const { data: doses, error } = await supabaseAdmin
          .from("medication_doses")
          .select("id, user_id, scheduled_at, amount, unit, medication_id, medications(name, dosage)")
          .eq("status", "pending")
          .gte("scheduled_at", windowStart)
          .lte("scheduled_at", windowEnd)
          .is("notified_at", null)
          .limit(200);

        if (error) {
          console.error("[cron] dose-reminders fetch error", error);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }

        // Missed-dose escalation: pending and not yet escalated, scheduled 25–35 min ago.
        const { data: missed } = await supabaseAdmin
          .from("medication_doses")
          .select("id, user_id, scheduled_at, amount, unit, medication_id, medications(name, dosage)")
          .eq("status", "pending")
          .gte("scheduled_at", escalateFrom)
          .lte("scheduled_at", escalateTo)
          .is("missed_notified_at", null)
          .limit(200);

        const allDoses = [...(doses ?? []), ...(missed ?? [])];
        if (allDoses.length === 0) {
          return Response.json({ ok: true, sent: 0, doses: 0 });
        }

        const userIds = Array.from(new Set(allDoses.map((d) => d.user_id)));
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("user_id, endpoint, p256dh, auth")
          .in("user_id", userIds);

        const { data: profs } = await supabaseAdmin
          .from("profiles")
          .select("id, timezone, quiet_hours_start, quiet_hours_end")
          .in("id", userIds);
        const profByUser = new Map<string, { tz: string | null; qs: string | null; qe: string | null }>();
        for (const p of profs ?? []) {
          profByUser.set(p.id as string, {
            tz: (p as any).timezone ?? null,
            qs: (p as any).quiet_hours_start ?? null,
            qe: (p as any).quiet_hours_end ?? null,
          });
        }

        const subsByUser = new Map<string, typeof subs>();
        for (const s of subs ?? []) {
          const list = subsByUser.get(s.user_id) ?? [];
          list.push(s);
          subsByUser.set(s.user_id, list);
        }

        let sent = 0;
        const goneEndpoints: string[] = [];
        const notifiedDoseIds: string[] = [];
        const escalatedDoseIds: string[] = [];

        const firstFireIds = new Set((doses ?? []).map((d) => d.id));

        for (const dose of allDoses) {
          const prof = profByUser.get(dose.user_id);
          if (inQuietHours(now, prof?.tz ?? null, prof?.qs ?? null, prof?.qe ?? null)) {
            // Still mark first-fire as notified so we don't pile up after quiet hours end.
            if (firstFireIds.has(dose.id)) notifiedDoseIds.push(dose.id);
            else escalatedDoseIds.push(dose.id);
            continue;
          }
          const userSubs = subsByUser.get(dose.user_id) ?? [];
          if (userSubs.length === 0) {
            if (firstFireIds.has(dose.id)) notifiedDoseIds.push(dose.id);
            else escalatedDoseIds.push(dose.id);
            continue;
          }

          const med = (dose as unknown as { medications: { name: string; dosage: string | null } | null }).medications;
          const medName = med?.name ?? "your medication";
          const dosageBits: string[] = [];
          if (dose.amount != null) dosageBits.push(String(dose.amount));
          if (dose.unit) dosageBits.push(dose.unit);
          const dosage = dosageBits.length > 0 ? dosageBits.join(" ") : (med?.dosage ?? "");

          const isFollowUp = !firstFireIds.has(dose.id);
          const title = isFollowUp ? `Still pending: ${medName}` : `Time for ${medName}`;
          const body = isFollowUp
            ? `Scheduled 30 min ago. Tap to log it or mark missed.`
            : (dosage ? `${dosage}. Tap when you have taken it.` : "Tap when you have taken it.");

          for (const sub of userSubs) {
            const res = await sendPushToSubscription(sub, {
              title,
              body,
              url: "/meds",
              tag: `med-dose-${dose.id}${isFollowUp ? "-late" : ""}`,
            });
            if (res.ok) sent++;
            if (res.gone) goneEndpoints.push(sub.endpoint);
          }
          if (isFollowUp) escalatedDoseIds.push(dose.id);
          else notifiedDoseIds.push(dose.id);
        }

        if (notifiedDoseIds.length > 0) {
          await supabaseAdmin
            .from("medication_doses")
            .update({ notified_at: new Date().toISOString() })
            .in("id", notifiedDoseIds);
        }
        if (escalatedDoseIds.length > 0) {
          await supabaseAdmin
            .from("medication_doses")
            .update({ missed_notified_at: new Date().toISOString() })
            .in("id", escalatedDoseIds);
        }

        if (goneEndpoints.length > 0) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .in("endpoint", goneEndpoints);
        }

        return Response.json({
          ok: true,
          sent,
          doses: allDoses.length,
          escalated: escalatedDoseIds.length,
          expired: goneEndpoints.length,
        });
      },
    },
  },
});