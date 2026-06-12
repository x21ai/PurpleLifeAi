import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const eventSchema = z.object({
  kind: z.enum(["fired", "received", "acknowledged"]),
  doseId: z.string().uuid(),
  scheduledAt: z.string().nullable(),
  firedAt: z.string().optional(),
  acknowledgedAt: z.string().optional(),
  action: z.string().max(20).optional(),
  channel: z.enum(["sw_local", "web_push"]),
});

const logInput = z.object({ events: z.array(eventSchema).max(200) });

/**
 * Persists the service worker's queued delivery events.
 * - fired (sw_local): inserts a delivery row
 * - received (web_push): refines the server-send row's fired_at with the
 *   on-device receipt time
 * - acknowledged: stamps the matching row, or inserts an ack-only row when
 *   the fire was never logged (e.g. cleared IndexedDB)
 */
export const logNotificationDeliveries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => logInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let written = 0;

    for (const event of data.events) {
      if (event.kind === "fired") {
        const { error } = await supabase.from("notification_delivery_log").insert({
          user_id: userId,
          dose_id: event.doseId,
          scheduled_at: event.scheduledAt ?? event.firedAt ?? new Date().toISOString(),
          fired_at: event.firedAt ?? null,
          delivery_channel: event.channel,
        });
        if (!error) written++;
        continue;
      }

      if (event.kind === "received") {
        // Ground-truth receipt time for a web push the server already logged.
        const { data: rows } = await supabase
          .from("notification_delivery_log")
          .select("id")
          .eq("user_id", userId)
          .eq("dose_id", event.doseId)
          .eq("delivery_channel", "web_push")
          .order("created_at", { ascending: false })
          .limit(1);
        if (rows && rows.length > 0 && event.firedAt) {
          const { error } = await supabase
            .from("notification_delivery_log")
            .update({ fired_at: event.firedAt })
            .eq("id", rows[0].id);
          if (!error) written++;
        }
        continue;
      }

      // acknowledged
      const { data: openRows } = await supabase
        .from("notification_delivery_log")
        .select("id")
        .eq("user_id", userId)
        .eq("dose_id", event.doseId)
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false })
        .limit(1);
      if (openRows && openRows.length > 0) {
        const { error } = await supabase
          .from("notification_delivery_log")
          .update({
            acknowledged_at: event.acknowledgedAt ?? new Date().toISOString(),
            acknowledged_action: event.action ?? null,
          })
          .eq("id", openRows[0].id);
        if (!error) written++;
      } else {
        const { error } = await supabase.from("notification_delivery_log").insert({
          user_id: userId,
          dose_id: event.doseId,
          scheduled_at: event.scheduledAt ?? new Date().toISOString(),
          delivery_channel: event.channel,
          acknowledged_at: event.acknowledgedAt ?? new Date().toISOString(),
          acknowledged_action: event.action ?? null,
        });
        if (!error) written++;
      }
    }

    return { ok: true, written };
  });

const statsInput = z.object({ days: z.number().int().min(1).max(90).default(7) });

/** Admin-only reliability stats for the med reminder pipeline. */
export const getNotificationReliabilityStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => statsInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesError) throw new Error(rolesError.message);
    const roleNames = (roles ?? []).map((r: { role: string }) => r.role);
    if (!roleNames.includes("super_admin") && !roleNames.includes("admin")) {
      throw new Error("Not authorized");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    const [scheduledRes, logRes] = await Promise.all([
      supabaseAdmin
        .from("medication_doses")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", since)
        .lte("scheduled_at", new Date().toISOString())
        .neq("status", "cancelled"),
      supabaseAdmin
        .from("notification_delivery_log")
        .select("scheduled_at, fired_at, acknowledged_at")
        .gte("scheduled_at", since),
    ]);

    const rows = logRes.data ?? [];
    const fired = rows.filter((r) => r.fired_at != null);
    const firedWithin60s = fired.filter((r) => {
      const lag = new Date(r.fired_at as string).getTime() - new Date(r.scheduled_at).getTime();
      return lag >= 0 && lag <= 60_000;
    });
    const acknowledged = rows.filter((r) => r.acknowledged_at != null);

    return {
      days: data.days,
      scheduled: scheduledRes.count ?? 0,
      fired: fired.length,
      firedWithin60s: firedWithin60s.length,
      acknowledged: acknowledged.length,
      ackRate: fired.length > 0 ? acknowledged.length / fired.length : null,
    };
  });
