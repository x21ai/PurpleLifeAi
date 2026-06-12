import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function randomToken(len = 36): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  // base64url, no padding
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** Create a public, time-limited share link for a generated medical report. */
export const createMedicalReportShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        reportId: z.string().uuid(),
        expiresInDays: z.number().int().min(1).max(90).default(7),
        viewerLabel: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("medical_reports")
      .select("id")
      .eq("id", data.reportId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) throw new Error("Report not found");

    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + data.expiresInDays * 86400000).toISOString();
    const { data: ins, error } = await supabaseAdmin
      .from("medical_report_public_links")
      .insert({
        report_id: data.reportId,
        user_id: userId,
        token,
        expires_at: expiresAt,
        viewer_label: data.viewerLabel ?? null,
      })
      .select("id, token, expires_at, viewer_label, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { link: ins };
  });

/** List active and revoked share links for a report. */
export const listMedicalReportShareLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reportId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("medical_report_public_links")
      .select(
        "id, token, expires_at, revoked_at, viewer_label, opened_count, last_opened_at, created_at",
      )
      .eq("report_id", data.reportId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { links: rows ?? [] };
  });

/** Revoke a share link. */
export const revokeMedicalReportShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ linkId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("medical_report_public_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.linkId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Resolve a public token → signed PDF URL. No auth. Increments view counter. */
export const resolveMedicalReportShareLink = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(8).max(128) }).parse(input))
  .handler(async ({ data }) => {
    const { data: link } = await supabaseAdmin
      .from("medical_report_public_links")
      .select("id, report_id, user_id, expires_at, revoked_at, viewer_label, opened_count")
      .eq("token", data.token)
      .maybeSingle();
    if (!link) throw new Error("Link not found");
    if (link.revoked_at) throw new Error("This link has been revoked.");
    if (new Date(link.expires_at) < new Date()) throw new Error("This link has expired.");

    const { data: report } = await supabaseAdmin
      .from("medical_reports")
      .select("id, file_path, window_from, window_to, created_at, sections")
      .eq("id", link.report_id)
      .maybeSingle();
    if (!report) throw new Error("Report not found");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", link.user_id)
      .maybeSingle();

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("medical-reports")
      .createSignedUrl(report.file_path, 60 * 60);
    if (sErr) throw new Error(sErr.message);

    // Increment view counter (best effort)
    await supabaseAdmin
      .from("medical_report_public_links")
      .update({
        opened_count: (link.opened_count ?? 0) + 1,
        last_opened_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    await supabaseAdmin.from("phi_access_log").insert({
      user_id: link.user_id,
      actor_id: link.id,
      action: "read",
      resource_type: "medical_report_public_link",
      resource_id: link.id,
      metadata: {
        viewer_label: link.viewer_label,
        access_kind: "public_link",
        share_link_id: link.id,
      },
    });

    return {
      patientFirstName: profile?.first_name ?? null,
      windowFrom: report.window_from,
      windowTo: report.window_to,
      generatedAt: report.created_at,
      sections: report.sections,
      signedUrl: signed.signedUrl,
      viewerLabel: link.viewer_label,
      expiresAt: link.expires_at,
    };
  });
