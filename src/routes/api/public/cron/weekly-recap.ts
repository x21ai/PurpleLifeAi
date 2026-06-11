import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueRenderedEmail } from "@/lib/email/render-and-enqueue.server";

// Weekly recap email, called by pg_cron Sunday mornings.
// Sends one email per user whose profiles.weekly_digest_enabled = true
// and who has at least one journal entry in the last 7 days.
export const Route = createFileRoute("/api/public/cron/weekly-recap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const origin = process.env.PUBLIC_SITE_URL || new URL(request.url).origin;
        const sinceIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

        const { data: profiles, error } = await supabaseAdmin
          .from("profiles")
          .select("id, first_name")
          .eq("weekly_digest_enabled", true);
        if (error) {
          console.error("[cron] weekly-recap fetch error", error);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }

        let sent = 0;
        let skipped = 0;
        for (const p of profiles ?? []) {
          const userId = p.id as string;
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = u?.user?.email;
          if (!email) { skipped++; continue; }

          const [{ data: entries }, { data: seizures }, { data: doses }] = await Promise.all([
            supabaseAdmin
              .from("journal_entries")
              .select("id, voice_transcript, ai_tags")
              .eq("user_id", userId)
              .is("archived_at", null)
              .gte("captured_at", sinceIso),
            supabaseAdmin
              .from("seizure_events")
              .select("id")
              .eq("user_id", userId)
              .gte("started_at", sinceIso),
            supabaseAdmin
              .from("medication_doses")
              .select("id, status")
              .eq("user_id", userId)
              .gte("scheduled_at", sinceIso),
          ]);

          const entryCount = entries?.length ?? 0;
          if (entryCount === 0) { skipped++; continue; }
          const voiceCount = (entries ?? []).filter((e: any) => (e.voice_transcript ?? "").trim().length > 0).length;
          const tagCounts = new Map<string, number>();
          for (const e of entries ?? []) {
            for (const t of ((e as any).ai_tags ?? []) as string[]) {
              if (!t) continue;
              tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
            }
          }
          const topTags = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
          const missedDoses = (doses ?? []).filter((d: any) => d.status === "missed" || d.status === "skipped").length;

          await enqueueRenderedEmail({
            templateName: "weekly-recap",
            recipientEmail: email,
            idempotencyKey: `weekly-recap-${userId}-${sinceIso.slice(0, 10)}`,
            templateData: {
              firstName: (p as any).first_name ?? null,
              entryCount,
              voiceCount,
              seizureCount: seizures?.length ?? 0,
              missedDoses,
              topTags,
              todayUrl: `${origin}/today`,
            },
          }).catch(() => null);
          sent++;
        }

        return Response.json({ ok: true, sent, skipped, total: profiles?.length ?? 0 });
      },
    },
  },
});