import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmail } from "./email/send";

const THROTTLE_MINUTES = 30;

export type CaregiverWriteKind = "dose" | "seizure" | "journal" | "biometric";

const KIND_LABEL: Record<CaregiverWriteKind, string> = {
  dose: "marked a medication dose",
  seizure: "logged a seizure",
  journal: "added a journal entry",
  biometric: "added a biometric reading",
};

/**
 * Best-effort fan-out: a single push + email to the data owner when one of
 * their caregivers writes on their behalf. Throttled per (owner, caregiver)
 * pair so a flurry of dose taps doesn't spam them.
 *
 * Never throws — caller treats notify as fire-and-forget. Throttle state is
 * derived from `care_audit_log` (action='notified') so it survives restarts
 * without an extra table.
 */
export async function notifyOwnerOfCaregiverWrite(params: {
  ownerId: string;
  caregiverId: string;
  relationshipId: string;
  kind: CaregiverWriteKind;
  resourceId?: string;
  summary?: string;
}): Promise<void> {
  const { ownerId, caregiverId, relationshipId, kind, resourceId, summary } = params;
  try {
    const cutoff = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("care_audit_log")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("actor_id", caregiverId)
      .eq("action", "notified")
      .gte("at", cutoff)
      .limit(1);
    if (recent && recent.length > 0) return;

    const [{ data: ownerProfile }, { data: caregiverProfile }, { data: ownerAuth }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, community_display_name")
        .eq("id", ownerId)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, community_display_name")
        .eq("id", caregiverId)
        .maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(ownerId),
    ]);

    const caregiverName =
      caregiverProfile?.community_display_name?.trim() ||
      [caregiverProfile?.first_name, caregiverProfile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "A caregiver";
    const ownerFirstName =
      ownerProfile?.first_name?.trim() ||
      ownerProfile?.community_display_name?.trim() ||
      "";
    const action = KIND_LABEL[kind];
    const title = `${caregiverName} ${action}`;
    const body = summary?.trim() || "Open Purple to review the new entry.";

    // Push (best effort)
    try {
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", ownerId);
      if (subs && subs.length > 0) {
        const { sendPushToSubscription } = await import("./push.server");
        await Promise.all(
          subs.map((sub) =>
            sendPushToSubscription(sub, {
              title,
              body,
              url: "/today",
              tag: "purple-care-write",
            }).catch(() => undefined),
          ),
        );
      }
    } catch (err) {
      console.warn("[care-notify] push failed", err);
    }

    // Email (best effort)
    const ownerEmail = ownerAuth?.user?.email ?? null;
    if (ownerEmail) {
      try {
        await sendTransactionalEmail({
          templateName: "caregiver-write-notice",
          recipientEmail: ownerEmail,
          idempotencyKey: `care-write-${kind}-${resourceId ?? caregiverId}-${Date.now()}`,
          templateData: {
            ownerFirstName,
            caregiverName,
            action,
            summary: body,
          },
        });
      } catch (err) {
        console.warn("[care-notify] email failed", err);
      }
    }

    // Mark throttle window
    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: relationshipId,
      owner_id: ownerId,
      actor_id: caregiverId,
      action: "notified",
      resource_type: kind,
      resource_id: resourceId ?? null,
      metadata: { caregiverName, action },
    });
  } catch (err) {
    console.warn("[care-notify] failed", err);
  }
}

const CHANGE_TYPE_LABEL: Record<string, string> = {
  add_journal_comment: "your note on a journal entry",
  add_meds_note: "your note on a medication",
};

/**
 * Best-effort: email the caregiver after the data owner approves or rejects
 * one of their proposed changes. Never throws.
 */
export async function notifyCaregiverOfDecision(params: {
  caregiverId: string;
  ownerId: string;
  changeType: string;
  decision: "approved" | "rejected";
  decisionNote?: string | null;
}): Promise<void> {
  const { caregiverId, ownerId, changeType, decision, decisionNote } = params;
  try {
    const [{ data: ownerProfile }, { data: caregiverProfile }, { data: caregiverAuth }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("first_name, last_name, community_display_name")
          .eq("id", ownerId)
          .maybeSingle(),
        supabaseAdmin
          .from("profiles")
          .select("first_name, community_display_name")
          .eq("id", caregiverId)
          .maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(caregiverId),
      ]);

    const caregiverEmail = caregiverAuth?.user?.email ?? null;
    if (!caregiverEmail) return;

    const ownerName =
      ownerProfile?.community_display_name?.trim() ||
      [ownerProfile?.first_name, ownerProfile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "The account owner";
    const caregiverFirstName =
      caregiverProfile?.first_name?.trim() ||
      caregiverProfile?.community_display_name?.trim() ||
      "";
    const changeLabel = CHANGE_TYPE_LABEL[changeType] ?? "your proposed change";

    await sendTransactionalEmail({
      templateName: "caregiver-proposal-decision",
      recipientEmail: caregiverEmail,
      idempotencyKey: `care-decision-${decision}-${ownerId}-${caregiverId}-${Date.now()}`,
      templateData: {
        caregiverFirstName,
        ownerName,
        decision,
        changeLabel,
        decisionNote: decisionNote ?? null,
      },
    });
  } catch (err) {
    console.warn("[care-notify] decision email failed", err);
  }
}