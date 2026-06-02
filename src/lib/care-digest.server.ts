import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueRenderedEmail } from "./email/render-and-enqueue.server";
import type { DigestRow } from "./email-templates/care-daily-digest";

const ACTION_LABEL: Record<string, string> = {
  journal_entries: "added a journal entry",
  medication_doses: "marked a medication dose",
  seizure_events: "logged a seizure",
  biometrics: "added a biometric reading",
  medications: "noted a medication change",
  pending_change: "proposed a change",
};

function caregiverDisplayName(p: {
  first_name: string | null;
  last_name: string | null;
  community_display_name: string | null;
} | null): string {
  if (!p) return "A caregiver";
  return (
    p.community_display_name?.trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    "A caregiver"
  );
}

async function buildPreview(
  resourceType: string | null,
  resourceId: string | null,
): Promise<string | null> {
  if (!resourceType || !resourceId) return null;
  try {
    if (resourceType === "journal_entries") {
      const { data } = await supabaseAdmin
        .from("journal_entries")
        .select("text, ai_summary")
        .eq("id", resourceId)
        .maybeSingle();
      const raw = (data?.ai_summary || data?.text || "").trim();
      if (!raw) return null;
      return raw.length > 120 ? raw.slice(0, 117) + "…" : raw;
    }
    if (resourceType === "seizure_events") {
      const { data } = await supabaseAdmin
        .from("seizure_events")
        .select("type, duration_seconds, severity, rescue_med_given")
        .eq("id", resourceId)
        .maybeSingle();
      if (!data) return null;
      const bits: string[] = [];
      if (data.type) bits.push(data.type);
      if (data.duration_seconds != null) bits.push(`${data.duration_seconds}s`);
      if (data.severity != null) bits.push(`severity ${data.severity}`);
      if (data.rescue_med_given) bits.push("rescue med given");
      return bits.length ? bits.join(" · ") : null;
    }
    if (resourceType === "medications" || resourceType === "medication_doses") {
      return null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Build and send a daily digest email for one owner. Skips silently if there's
 * nothing to report or the owner opted out. Returns a small summary.
 */
export async function sendCareDailyDigest(params: {
  ownerId: string;
  origin: string;
  windowHours?: number;
}): Promise<{ sent: boolean; rowCount: number; reason?: string }> {
  const { ownerId, origin } = params;
  const windowHours = params.windowHours ?? 24;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, community_display_name, care_daily_digest_enabled")
    .eq("id", ownerId)
    .maybeSingle();
  if (!profile) return { sent: false, rowCount: 0, reason: "no_profile" };
  if (profile.care_daily_digest_enabled === false) {
    return { sent: false, rowCount: 0, reason: "opted_out" };
  }

  const since = new Date(Date.now() - windowHours * 3600_000).toISOString();

  const { data: log } = await supabaseAdmin
    .from("care_audit_log")
    .select("id, actor_id, action, at, resource_type, resource_id, metadata")
    .eq("owner_id", ownerId)
    .in("action", ["wrote", "proposed"])
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(50);

  const entries = log ?? [];
  if (entries.length === 0) {
    return { sent: false, rowCount: 0, reason: "no_activity" };
  }

  const caregiverIds = Array.from(
    new Set(entries.map((e) => e.actor_id).filter((id) => id !== ownerId)),
  );
  const { data: caregivers } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name, community_display_name")
    .in("id", caregiverIds.length ? caregiverIds : ["00000000-0000-0000-0000-000000000000"]);
  const byId = Object.fromEntries((caregivers ?? []).map((c) => [c.id, c]));

  const rows: DigestRow[] = [];
  for (const e of entries.slice(0, 20)) {
    const caregiverName = caregiverDisplayName(byId[e.actor_id] ?? null);
    const action =
      e.action === "proposed"
        ? "proposed a change"
        : ACTION_LABEL[e.resource_type ?? ""] ?? "made an update";
    const preview = await buildPreview(e.resource_type, e.resource_id);
    rows.push({
      caregiverName,
      action,
      resourceType: e.resource_type ?? "",
      at: e.at,
      preview,
    });
  }

  // Pending count for inbox CTA
  const { count: pendingCount } = await supabaseAdmin
    .from("pending_changes")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "pending");

  const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(ownerId);
  const ownerEmail = ownerAuth?.user?.email ?? null;
  if (!ownerEmail) return { sent: false, rowCount: rows.length, reason: "no_email" };

  const result = await enqueueRenderedEmail({
    templateName: "care-daily-digest",
    recipientEmail: ownerEmail,
    idempotencyKey: `care-digest-${ownerId}-${new Date().toISOString().slice(0, 10)}`,
    templateData: {
      ownerFirstName:
        profile.first_name?.trim() ||
        profile.community_display_name?.trim() ||
        "",
      rows,
      total: rows.length,
      pendingCount: pendingCount ?? 0,
      inboxUrl: `${origin}/care/inbox`,
    },
  });

  return { sent: result.ok, rowCount: rows.length, reason: result.reason };
}

/**
 * Find all owners with active caregiver activity in the last `windowHours` and
 * dispatch a digest to each one. Returns counts for the caller (cron route).
 */
export async function runDailyDigest(origin: string, windowHours = 24) {
  const since = new Date(Date.now() - windowHours * 3600_000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("care_audit_log")
    .select("owner_id")
    .in("action", ["wrote", "proposed"])
    .gte("at", since);
  const ownerIds = Array.from(new Set((rows ?? []).map((r) => r.owner_id)));

  let sent = 0;
  let skipped = 0;
  for (const ownerId of ownerIds) {
    const r = await sendCareDailyDigest({ ownerId, origin, windowHours });
    if (r.sent) sent++;
    else skipped++;
  }
  return { owners: ownerIds.length, sent, skipped };
}