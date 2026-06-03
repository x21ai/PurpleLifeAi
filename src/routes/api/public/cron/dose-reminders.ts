import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendPushToSubscription } from "@/lib/push.server";

// Called by pg_cron every minute. Sends a Web Push for each
// pending medication_doses row whose scheduled_at falls within
// the last 60s. Idempotent via the notified_at column.
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
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        if (!doses || doses.length === 0) {
          return Response.json({ ok: true, sent: 0, doses: 0 });
        }

        // Group dose IDs per user so we fetch subscriptions once.
        const userIds = Array.from(new Set(doses.map((d) => d.user_id)));
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("user_id, endpoint, p256dh, auth")
          .in("user_id", userIds);

        const subsByUser = new Map<string, typeof subs>();
        for (const s of subs ?? []) {
          const list = subsByUser.get(s.user_id) ?? [];
          list.push(s);
          subsByUser.set(s.user_id, list);
        }

        let sent = 0;
        const goneEndpoints: string[] = [];
        const notifiedDoseIds: string[] = [];

        for (const dose of doses) {
          const userSubs = subsByUser.get(dose.user_id) ?? [];
          if (userSubs.length === 0) continue;

          const med = (dose as unknown as { medications: { name: string; dosage: string | null } | null }).medications;
          const medName = med?.name ?? "your medication";
          const dosageBits: string[] = [];
          if (dose.amount != null) dosageBits.push(String(dose.amount));
          if (dose.unit) dosageBits.push(dose.unit);
          const dosage = dosageBits.length > 0 ? dosageBits.join(" ") : (med?.dosage ?? "");

          for (const sub of userSubs) {
            const res = await sendPushToSubscription(sub, {
              title: `Time for ${medName}`,
              body: dosage ? `${dosage}. Tap when you have taken it.` : "Tap when you have taken it.",
              url: "/meds",
              tag: `med-dose-${dose.id}`,
            });
            if (res.ok) sent++;
            if (res.gone) goneEndpoints.push(sub.endpoint);
          }
          notifiedDoseIds.push(dose.id);
        }

        if (notifiedDoseIds.length > 0) {
          await supabaseAdmin
            .from("medication_doses")
            .update({ notified_at: new Date().toISOString() })
            .in("id", notifiedDoseIds);
        }

        if (goneEndpoints.length > 0) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .in("endpoint", goneEndpoints);
        }

        return Response.json({ ok: true, sent, doses: doses.length, expired: goneEndpoints.length });
      },
    },
  },
});