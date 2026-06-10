import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  generateAndStoreMedicalReportAdmin,
  DEFAULT_SECTIONS,
  type Sections,
} from "@/lib/medical-report.server-helpers";
import { enqueueRenderedEmail } from "@/lib/email/render-and-enqueue.server";

// Called daily by pg_cron. For every active monthly schedule whose
// day_of_month matches today (UTC) and that hasn't run in the last ~25
// days, generate a fresh medical history PDF and email each recipient.
export const Route = createFileRoute("/api/public/cron/medical-reports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = new Date();
        const dom = today.getUTCDate();
        const cutoff = new Date(today.getTime() - 25 * 86400000).toISOString();

        const { data: schedules, error } = await supabaseAdmin
          .from("medical_report_schedules")
          .select("id, user_id, day_of_month, window_days, sections, recipients, last_run_at")
          .eq("active", true)
          .eq("cadence", "monthly")
          .eq("day_of_month", dom)
          .or(`last_run_at.is.null,last_run_at.lt.${cutoff}`)
          .limit(100);

        if (error) {
          console.error("[cron] medical-reports fetch error", error);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }
        if (!schedules || schedules.length === 0) {
          return Response.json({ ok: true, processed: 0 });
        }

        let processed = 0;
        let failures = 0;
        for (const s of schedules) {
          try {
            const sections: Sections = {
              ...DEFAULT_SECTIONS,
              ...((s.sections ?? {}) as Partial<Sections>),
            };
            const to = new Date();
            const from = new Date(to.getTime() - s.window_days * 86400000);
            const fmt = (d: Date) => d.toISOString().slice(0, 10);

            const { reportId, signedUrl } = await generateAndStoreMedicalReportAdmin({
              userId: s.user_id,
              from: fmt(from),
              to: fmt(to),
              sections,
            });

            const { data: prof } = await supabaseAdmin
              .from("profiles").select("first_name, last_name")
              .eq("id", s.user_id).maybeSingle();
            const senderName =
              [prof?.first_name, prof?.last_name].filter(Boolean).join(" ").trim() ||
              "A Purple user";

            const recipients = (s.recipients ?? []) as Array<{ email: string; label?: string }>;
            for (const r of recipients) {
              if (!r?.email) continue;
              await enqueueRenderedEmail({
                templateName: "medical-report-share",
                recipientEmail: r.email,
                idempotencyKey: `mr-auto-${reportId}-${r.email}`,
                templateData: {
                  senderName,
                  message: `Monthly automated report covering ${fmt(from)} → ${fmt(to)}.`,
                  windowFrom: fmt(from),
                  windowTo: fmt(to),
                  downloadUrl: signedUrl,
                  isSelf: false,
                },
              });
              await supabaseAdmin.from("medical_report_shares").insert({
                report_id: reportId,
                user_id: s.user_id,
                channel: "email_provider",
                recipient_email: r.email,
                message: "Automated monthly report",
              });
            }

            await supabaseAdmin
              .from("medical_report_schedules")
              .update({ last_run_at: new Date().toISOString(), last_error: null })
              .eq("id", s.id);
            processed += 1;
          } catch (err) {
            failures += 1;
            const msg = err instanceof Error ? err.message : "Unknown error";
            console.error("[cron] medical-reports schedule failed", s.id, msg);
            await supabaseAdmin
              .from("medical_report_schedules")
              .update({ last_error: msg })
              .eq("id", s.id);
          }
        }

        return Response.json({ ok: true, processed, failures, scanned: schedules.length });
      },
    },
  },
});