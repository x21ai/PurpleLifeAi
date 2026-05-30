import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Called by pg_cron daily. Permanently deletes user data for any profile
// whose purge_after has passed. Soft-deletes are reversible until then.
export const Route = createFileRoute("/api/public/cron/purge-deleted-accounts")({
  server: {
    handlers: {
      POST: async () => {
        const nowIso = new Date().toISOString();

        const { data: due, error: dueErr } = await supabaseAdmin
          .from("profiles")
          .select("id, purge_after")
          .lte("purge_after", nowIso)
          .not("deleted_at", "is", null)
          .limit(100);

        if (dueErr) {
          console.error("[cron] purge fetch error", dueErr);
          return Response.json({ ok: false, error: dueErr.message }, { status: 500 });
        }
        if (!due || due.length === 0) {
          return Response.json({ ok: true, purged: 0 });
        }

        const userIds = due.map((r) => r.id);
        const perUserTables: Array<[string, string]> = [
          ["ai_memory", "user_id"],
          ["alerts", "user_id"],
          ["biometrics", "user_id"],
          ["journal_entries", "user_id"],
          ["medication_doses", "user_id"],
          ["medications", "user_id"],
          ["oura_tokens", "user_id"],
          ["whoop_tokens", "user_id"],
          ["risk_forecasts", "user_id"],
          ["seizure_events", "user_id"],
          ["trips", "user_id"],
          ["push_subscriptions", "user_id"],
        ];

        for (const [table, col] of perUserTables) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabaseAdmin.from(table as any) as any)
            .delete()
            .in(col, userIds);
          if (error) console.warn(`[cron] purge ${table} error`, error.message);
        }

        // Profiles last; then drop the auth user so the email is freed.
        await supabaseAdmin.from("profiles").delete().in("id", userIds);
        for (const uid of userIds) {
          const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
          if (authErr) console.warn("[cron] auth delete error", uid, authErr.message);
        }

        return Response.json({ ok: true, purged: userIds.length });
      },
    },
  },
});