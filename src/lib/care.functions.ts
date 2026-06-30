import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CareRole, CareScope } from "./care.scopes";
import { ROLE_DEFAULT_SCOPES, ROLE_LABELS } from "./care.scopes";
import { getRequest } from "@tanstack/react-start/server";
import {
  notifyOwnerOfCaregiverWrite,
  notifyCaregiverOfDecision,
} from "./care-notify.server";
import { sendCareDailyDigest } from "./care-digest.server";

function newInviteToken(): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
}

/**
 * Render the `care-invite` React Email template and send it directly via the
 * Resend HTTP API. We deliberately skip the PGMQ queue + pg_cron pump here
 * because that pipeline is fragile in preview (cron job URL points at a
 * different path) and caregiver invites must be delivered immediately for the
 * recipient to act on them. Best-effort: any error is logged and surfaced
 * via `email_send_log`, never thrown back to the inviter.
 */
async function sendCareInviteEmailDirect(params: {
  recipientEmail: string;
  inviterName: string;
  roleLabel: string;
  acceptUrl: string;
  expiresAt: string | null;
  idempotencyKey: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing_resend_api_key" };
  }
  const recipient = params.recipientEmail.trim().toLowerCase();
  const messageId = crypto.randomUUID();

  // Suppression check (best-effort)
  try {
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("id")
      .eq("email", recipient)
      .maybeSingle();
    if (suppressed) return { ok: false, reason: "suppressed" };
  } catch {
    /* ignore */
  }

  let html: string;
  let plainText: string;
  let subject: string;
  try {
    const React = await import("react");
    const { render } = await import("@react-email/components");
    const { TEMPLATES } = await import("./email-templates/registry");
    const tpl = TEMPLATES["care-invite"];
    if (!tpl) return { ok: false, reason: "template_missing" };
    const data: Record<string, unknown> = {
      inviterName: params.inviterName || undefined,
      roleLabel: params.roleLabel,
      acceptUrl: params.acceptUrl,
      expiresAt: params.expiresAt,
    };
    const element = React.createElement(
      tpl.component as React.ComponentType<Record<string, unknown>>,
      data,
    );
    html = await render(element);
    plainText = await render(element, { plainText: true });
    subject = typeof tpl.subject === "function" ? tpl.subject(data) : tpl.subject;
  } catch (err) {
    console.warn("[care-invite] template render failed", err);
    return { ok: false, reason: "render_failed" };
  }

  // Log a pending row so the send is visible in admin tooling.
  try {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "care-invite",
      recipient_email: recipient,
      status: "pending",
    });
  } catch {
    /* ignore log failure */
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        from: "Purple <noreply@notify.purplelife.org>",
        to: [recipient],
        subject,
        html,
        text: plainText,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const reason = `resend_${res.status}: ${body.slice(0, 200)}`;
      await supabaseAdmin
        .from("email_send_log")
        .update({ status: "failed", error_message: reason.slice(0, 1000) })
        .eq("message_id", messageId);
      return { ok: false, reason };
    }
    await supabaseAdmin
      .from("email_send_log")
      .update({ status: "sent", error_message: null })
      .eq("message_id", messageId);
    return { ok: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    try {
      await supabaseAdmin
        .from("email_send_log")
        .update({ status: "failed", error_message: reason.slice(0, 1000) })
        .eq("message_id", messageId);
    } catch {
      /* ignore */
    }
    return { ok: false, reason };
  }
}

const emailSchema = z.string().trim().toLowerCase().email().max(255);
const roleSchema = z.enum(["emergency", "caregiver", "provider", "viewer"]);

/* ---------- Owner-facing ---------- */

export const inviteCaregiver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: CareRole; scopes?: CareScope[]; relationship_label?: string | null }) =>
    z
      .object({
        email: emailSchema,
        role: roleSchema,
        scopes: z.array(z.string().max(64)).max(60).optional(),
        relationship_label: z.string().trim().min(1).max(40).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const invite_token = newInviteToken();
    const scopes = (data.scopes ?? ROLE_DEFAULT_SCOPES[data.role as CareRole]) as string[];

    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .insert({
        owner_id: userId,
        invite_email: data.email,
        invite_token,
        role: data.role,
        status: "pending",
        relationship_label: data.relationship_label ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (scopes.length > 0) {
      const rows = scopes.map((s) => ({
        relationship_id: rel.id,
        scope: s,
        granted: true,
      }));
      const { error: sErr } = await supabaseAdmin.from("care_scopes").insert(rows);
      if (sErr) throw new Error(sErr.message);
    }

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: rel.id,
      owner_id: userId,
      actor_id: userId,
      action: "invited",
      resource_type: "care_relationship",
      resource_id: rel.id,
      metadata: { email: data.email, role: data.role },
    });

    // Best-effort transactional email. The invite link is also surfaced in
    // Settings → Sharing so a failure here is non-fatal.
    const req = getRequest();
    const origin =
      process.env.PUBLIC_SITE_URL ||
      (req ? new URL(req.url).origin : "https://purplelife.org");
    const acceptUrl = `${origin}/care/accept?token=${invite_token}`;
    let emailSent = false;
    try {
      const { data: inviter } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();
      const inviterName = [inviter?.first_name, inviter?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      const result = await sendCareInviteEmailDirect({
        recipientEmail: data.email,
        idempotencyKey: `care-invite-${rel.id}`,
        inviterName,
        roleLabel: ROLE_LABELS[data.role as CareRole],
        acceptUrl,
        expiresAt: (rel as { expires_at?: string | null }).expires_at ?? null,
      });
      emailSent = !!result?.ok;
      if (!result?.ok) {
        console.warn("[care-invite] direct send failed", result?.reason);
      }
    } catch (err) {
      console.warn("care-invite email failed (link still available in UI)", err);
    }

    // If the invitee already has a Purple account, drop an in-app alert and
    // a push notification so they see the invite the next time they open the
    // app (in addition to the email above). Best-effort - never throws.
    try {
      const { data: inviterProfile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name, community_display_name")
        .eq("id", userId)
        .maybeSingle();
      const inviterDisplay =
        inviterProfile?.community_display_name?.trim() ||
        [inviterProfile?.first_name, inviterProfile?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Someone";
      const roleLabel = ROLE_LABELS[data.role as CareRole] ?? "caregiver";

      // Resolve invitee user_id by email via Auth Admin API.
      let inviteeId: string | null = null;
      try {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const match = list?.users?.find(
          (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
        );
        inviteeId = match?.id ?? null;
      } catch (err) {
        console.warn("[care-invite] auth lookup failed", err);
      }

      if (inviteeId) {
        await supabaseAdmin.from("alerts").insert({
          user_id: inviteeId,
          kind: "care_invite",
          severity: "info",
          title: `${inviterDisplay} invited you as their ${roleLabel}`,
          body: "Open Purple to review and accept the invitation.",
        });

        try {
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", inviteeId);
          if (subs && subs.length > 0) {
            const { sendPushToSubscription } = await import("./push.server");
            await Promise.all(
              subs.map((sub) =>
                sendPushToSubscription(sub, {
                  title: `${inviterDisplay} invited you on Purple`,
                  body: `You've been invited as their ${roleLabel}. Tap to accept.`,
                  url: `/care/accept?token=${invite_token}`,
                  tag: `care-invite-${rel.id}`,
                }).catch(() => undefined),
              ),
            );
          }
        } catch (err) {
          console.warn("[care-invite] push failed", err);
        }
      }
    } catch (err) {
      console.warn("[care-invite] in-app notify failed", err);
    }

    return { relationship: rel, invite_token, acceptUrl, emailSent };
  });

export const listMyCaregivers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { archived?: boolean } | undefined) =>
    z.object({ archived: z.boolean().optional() }).optional().parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const archived = data?.archived === true;
    let query = supabaseAdmin
      .from("care_relationships")
      .select("*")
      .eq("owner_id", userId);
    query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    const { data: rels, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (rels ?? []).map((r) => r.id);
    let scopes: Array<{ relationship_id: string; scope: string; granted: boolean }> = [];
    if (ids.length > 0) {
      const { data: s, error: sErr } = await supabaseAdmin
        .from("care_scopes")
        .select("relationship_id, scope, granted")
        .in("relationship_id", ids);
      if (sErr) throw new Error(sErr.message);
      scopes = s ?? [];
    }

    return { relationships: rels ?? [], scopes };
  });

export const unarchiveRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string }) =>
    z.object({ relationship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");

    const { error: uErr } = await supabaseAdmin
      .from("care_relationships")
      .update({ archived_at: null })
      .eq("id", data.relationship_id);
    if (uErr) throw new Error(uErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: "unarchived",
    });
    return { ok: true };
  });

export const listPeopleSharingWithMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("care_relationships")
      .select("*")
      .eq("caregiver_id", userId)
      .in("status", ["active", "pending"]) 
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { relationships: data ?? [] };
  });

export const setScopes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; scopes: Array<{ scope: string; granted: boolean }> }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        scopes: z
          .array(z.object({ scope: z.string().min(1).max(64), granted: z.boolean() }))
          .max(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error: rErr } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id")
      .eq("id", data.relationship_id)
      .single();
    if (rErr || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");

    // Upsert each scope
    const rows = data.scopes.map((s) => ({
      relationship_id: data.relationship_id,
      scope: s.scope,
      granted: s.granted,
    }));
    const { error: upErr } = await supabaseAdmin
      .from("care_scopes")
      .upsert(rows, { onConflict: "relationship_id,scope" });
    if (upErr) throw new Error(upErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: "scopes_updated",
      metadata: { count: data.scopes.length },
    });

    return { ok: true };
  });

/* ---------- Audit log ---------- */

export const setRelationshipLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; relationship_label: string | null }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        relationship_label: z.string().trim().min(1).max(40).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("care_relationships")
      .update({ relationship_label: data.relationship_label })
      .eq("id", data.relationship_id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCareAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; limit?: number }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error: rErr } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id")
      .eq("id", data.relationship_id)
      .single();
    if (rErr || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("care_audit_log")
      .select("id, action, at, resource_type, resource_id, metadata")
      .eq("relationship_id", data.relationship_id)
      .gte("at", since)
      .order("at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return { entries: rows ?? [] };
  });

export const revokeRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string }) =>
    z.object({ relationship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");

    const { error: uErr } = await supabaseAdmin
      .from("care_relationships")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", data.relationship_id);
    if (uErr) throw new Error(uErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: "revoked",
    });
    return { ok: true };
  });

export const archiveRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string }) =>
    z.object({ relationship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, status")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");
    if (rel.status !== "revoked") throw new Error("Revoke access before archiving");

    const { error: uErr } = await supabaseAdmin
      .from("care_relationships")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", data.relationship_id);
    if (uErr) throw new Error(uErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: "archived",
    });
    return { ok: true };
  });

export const deleteRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string }) =>
    z.object({ relationship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, status, invite_email")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");
    if (rel.status !== "revoked") throw new Error("Revoke access before deleting");

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: "deleted",
      metadata: { invite_email: rel.invite_email },
    });

    const { error: dErr } = await supabaseAdmin
      .from("care_relationships")
      .delete()
      .eq("id", data.relationship_id);
    if (dErr) throw new Error(dErr.message);
    return { ok: true };
  });

/* ---------- Approval queue ---------- */

export const listPendingChanges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("pending_changes")
      .select("*")
      .eq("owner_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { changes: data ?? [] };
  });

export const decidePendingChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "approved" | "rejected"; note?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: change, error } = await supabaseAdmin
      .from("pending_changes")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !change) throw new Error("Change not found");
    if (change.owner_id !== userId) throw new Error("Forbidden");
    if (change.status !== "pending") throw new Error("Already decided");

    if (data.decision === "approved") {
      // Apply the change. v1 supports two safe types:
      //  - add_journal_comment: append text to journal_entries.text
      //  - add_meds_note:       append text to medications.notes
      // Anything else is recorded as approved but not auto-applied.
      const type = change.type as string;
      if (type === "add_journal_comment" && change.target_id) {
        const note = String((change.payload as any)?.text ?? "").slice(0, 2000);
        const stamp = `\n\n- Caregiver note (approved ${new Date().toISOString().slice(0, 10)}):\n${note}`;
        const { data: row } = await supabaseAdmin
          .from("journal_entries")
          .select("text")
          .eq("id", change.target_id)
          .eq("user_id", change.owner_id)
          .single();
        if (!row) throw new Error("Target journal entry not found for this owner");
        const newText = (row?.text ?? "") + stamp;
        await supabaseAdmin
          .from("journal_entries")
          .update({ text: newText })
          .eq("id", change.target_id)
          .eq("user_id", change.owner_id);
      } else if (type === "add_meds_note" && change.target_id) {
        const note = String((change.payload as any)?.text ?? "").slice(0, 1000);
        const { data: row } = await supabaseAdmin
          .from("medications")
          .select("notes")
          .eq("id", change.target_id)
          .eq("user_id", change.owner_id)
          .single();
        if (!row) throw new Error("Target medication not found for this owner");
        const newNotes = ((row?.notes ?? "") + "\n- Caregiver: " + note).trim();
        await supabaseAdmin
          .from("medications")
          .update({ notes: newNotes })
          .eq("id", change.target_id)
          .eq("user_id", change.owner_id);
      }
    }

    const { error: dErr } = await supabaseAdmin
      .from("pending_changes")
      .update({
        status: data.decision,
        decided_at: new Date().toISOString(),
        decision_note: data.note ?? null,
      })
      .eq("id", data.id);
    if (dErr) throw new Error(dErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: change.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: data.decision,
      resource_type: "pending_change",
      resource_id: change.id,
      metadata: { type: change.type },
    });
    if (change.caregiver_id) {
      void notifyCaregiverOfDecision({
        caregiverId: change.caregiver_id,
        ownerId: userId,
        changeType: String(change.type),
        decision: data.decision,
        decisionNote: data.note ?? null,
      });
    }
    return { ok: true };
  });

/**
 * Bulk decide N pending changes at once. Reuses the same apply logic as
 * decidePendingChange (kept simple, we just loop). Returns how many were
 * processed and how many failed so the UI can surface partial failures.
 */
export const decidePendingChangesBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; decision: "approved" | "rejected"; note?: string }) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(50),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    let ok = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const id of data.ids) {
      try {
        const { data: change } = await supabaseAdmin
          .from("pending_changes")
          .select("*")
          .eq("id", id)
          .single();
        if (!change) {
          failed++;
          continue;
        }
        if (change.owner_id !== userId) {
          failed++;
          continue;
        }
        if (change.status !== "pending") {
          // already decided, skip silently
          continue;
        }
        if (data.decision === "approved") {
          const type = change.type as string;
          if (type === "add_journal_comment" && change.target_id) {
            const note = String((change.payload as any)?.text ?? "").slice(0, 2000);
            const stamp = `\n\n- Caregiver note (approved ${new Date()
              .toISOString()
              .slice(0, 10)}):\n${note}`;
            const { data: row } = await supabaseAdmin
              .from("journal_entries")
              .select("text")
              .eq("id", change.target_id)
              .eq("user_id", change.owner_id)
              .single();
            if (row) {
              await supabaseAdmin
                .from("journal_entries")
                .update({ text: (row?.text ?? "") + stamp })
                .eq("id", change.target_id)
                .eq("user_id", change.owner_id);
            }
          } else if (type === "add_meds_note" && change.target_id) {
            const note = String((change.payload as any)?.text ?? "").slice(0, 1000);
            const { data: row } = await supabaseAdmin
              .from("medications")
              .select("notes")
              .eq("id", change.target_id)
              .eq("user_id", change.owner_id)
              .single();
            if (row) {
              const newNotes = ((row?.notes ?? "") + "\n- Caregiver: " + note).trim();
              await supabaseAdmin
                .from("medications")
                .update({ notes: newNotes })
                .eq("id", change.target_id)
                .eq("user_id", change.owner_id);
            }
          }
        }
        await supabaseAdmin
          .from("pending_changes")
          .update({
            status: data.decision,
            decided_at: new Date().toISOString(),
            decision_note: data.note ?? null,
          })
          .eq("id", id);
        await supabaseAdmin.from("care_audit_log").insert({
          relationship_id: change.relationship_id,
          owner_id: userId,
          actor_id: userId,
          action: data.decision,
          resource_type: "pending_change",
          resource_id: change.id,
          metadata: { type: change.type, bulk: true },
        });
        if (change.caregiver_id) {
          void notifyCaregiverOfDecision({
            caregiverId: change.caregiver_id,
            ownerId: userId,
            changeType: String(change.type),
            decision: data.decision,
            decisionNote: data.note ?? null,
          });
        }
        ok++;
      } catch (err) {
        failed++;
        errors.push(err instanceof Error ? err.message : "Unknown");
      }
    }
    return { ok, failed, errors };
  });

/* ---------- Caregiver-facing ---------- */

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { invite_token: string }) =>
    z.object({ invite_token: z.string().min(20).max(128) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("*")
      .eq("invite_token", data.invite_token)
      .single();
    if (error || !rel) throw new Error("Invite not found");
    if (rel.status !== "pending") throw new Error("Invite is no longer pending");
    if (rel.owner_id === userId) throw new Error("You can't accept your own invite");

    // Verify the accepting user's email matches the invite email, so a leaked
    // or forwarded token can't be redeemed by an unintended account.
    if (rel.invite_email) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      const accepterEmail = (u?.user?.email ?? "").trim().toLowerCase();
      const inviteEmail = String(rel.invite_email).trim().toLowerCase();
      if (!accepterEmail || accepterEmail !== inviteEmail) {
        throw new Error("This invite was sent to a different email address.");
      }
    }

    const { error: uErr } = await supabaseAdmin
      .from("care_relationships")
      .update({
        caregiver_id: userId,
        status: "active",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rel.id);
    if (uErr) throw new Error(uErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: rel.id,
      owner_id: rel.owner_id,
      actor_id: userId,
      action: "accepted",
    });

    // Clear any in-app care_invite alerts for this user (best-effort).
    try {
      await supabaseAdmin
        .from("alerts")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("kind", "care_invite")
        .is("read_at", null);
    } catch (err) {
      console.warn("[care] clear invite alerts failed", err);
    }

    return { relationship_id: rel.id, owner_id: rel.owner_id };
  });

/**
 * List pending care invites addressed to the current user's email. Surfaced
 * in-app on the Today page and care inbox so existing Purple users see
 * invites even if they haven't opened the email.
 */
export const listIncomingCareInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = (u?.user?.email ?? "").trim().toLowerCase();
    if (!email) return { invites: [] as Array<Record<string, unknown>> };

    const nowIso = new Date().toISOString();
    const { data: rels, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, role, invite_token, invite_email, created_at, expires_at")
      .eq("status", "pending")
      .ilike("invite_email", email)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ownerIds = Array.from(new Set((rels ?? []).map((r) => r.owner_id)));
    let profilesById: Record<
      string,
      { first_name: string | null; last_name: string | null; community_display_name: string | null }
    > = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name, community_display_name")
        .in("id", ownerIds);
      profilesById = Object.fromEntries(
        (profiles ?? []).map((p) => [
          p.id,
          {
            first_name: p.first_name,
            last_name: p.last_name,
            community_display_name: p.community_display_name,
          },
        ]),
      );
    }

    const invites = (rels ?? []).map((r) => {
      const prof = profilesById[r.owner_id];
      const ownerName =
        prof?.community_display_name?.trim() ||
        [prof?.first_name, prof?.last_name].filter(Boolean).join(" ").trim() ||
        "A Purple member";
      return {
        id: r.id,
        owner_id: r.owner_id,
        role: r.role,
        invite_token: r.invite_token,
        created_at: r.created_at,
        expires_at: r.expires_at,
        owner_name: ownerName,
        role_label: ROLE_LABELS[r.role as CareRole] ?? r.role,
      };
    });
    return { invites };
  });

export const declineIncomingCareInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string }) =>
    z.object({ relationship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = (u?.user?.email ?? "").trim().toLowerCase();
    if (!email) throw new Error("Could not resolve your email.");

    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, status, invite_email")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Invite not found");
    if (rel.status !== "pending") throw new Error("Invite is no longer pending");
    if (String(rel.invite_email ?? "").trim().toLowerCase() !== email) {
      throw new Error("This invite was sent to a different email address.");
    }

    const { error: uErr } = await supabaseAdmin
      .from("care_relationships")
      .update({ status: "declined" })
      .eq("id", rel.id);
    if (uErr) throw new Error(uErr.message);

    try {
      await supabaseAdmin.from("care_audit_log").insert({
        relationship_id: rel.id,
        owner_id: null as unknown as string,
        actor_id: userId,
        action: "declined",
      });
    } catch {
      /* audit best-effort */
    }

    try {
      await supabaseAdmin
        .from("alerts")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("kind", "care_invite")
        .is("read_at", null);
    } catch {
      /* ignore */
    }

    return { ok: true };
  });

export const proposeChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    relationship_id: string;
    type: "add_journal_comment" | "add_meds_note";
    target_id: string;
    payload: { text: string };
  }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        type: z.enum(["add_journal_comment", "add_meds_note"]),
        target_id: z.string().uuid(),
        payload: z.object({ text: z.string().trim().min(1).max(2000) }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, caregiver_id, status")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.caregiver_id !== userId) throw new Error("Forbidden");
    if (rel.status !== "active") throw new Error("Relationship not active");

    // Scope check
    const requiredScope = data.type === "add_journal_comment" ? "journal:comment" : "meds:propose";
    const { data: ok } = await supabaseAdmin.rpc("has_care_scope", {
      _owner_id: rel.owner_id,
      _caregiver_id: userId,
      _scope: requiredScope,
    });
    if (!ok) throw new Error("Missing scope: " + requiredScope);

    const target_table = data.type === "add_journal_comment" ? "journal_entries" : "medications";

    // Verify the target record actually belongs to the relationship's owner.
    // Without this check, a caregiver could submit any record UUID and have it
    // applied against another user's data once their own owner approves.
    const { data: targetRow, error: tErr } = await supabaseAdmin
      .from(target_table)
      .select("id, user_id")
      .eq("id", data.target_id)
      .eq("user_id", rel.owner_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!targetRow) throw new Error("Target record not found for this owner");

    const { data: change, error: cErr } = await supabaseAdmin
      .from("pending_changes")
      .insert({
        relationship_id: data.relationship_id,
        owner_id: rel.owner_id,
        caregiver_id: userId,
        type: data.type,
        target_table,
        target_id: data.target_id,
        payload: data.payload,
        status: "pending",
      })
      .select()
      .single();
    if (cErr) throw new Error(cErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: rel.owner_id,
      actor_id: userId,
      action: "proposed",
      resource_type: target_table,
      resource_id: data.target_id,
      metadata: { type: data.type },
    });

    // Fire an in-app alert for the owner so the pending-inbox badge updates.
    try {
      const { data: caregiverProfile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();
      const caregiverName =
        [caregiverProfile?.first_name, caregiverProfile?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || "A caregiver";
      const summary = String((data.payload as { text?: string })?.text ?? "")
        .slice(0, 140);
      await supabaseAdmin.from("alerts").insert({
        user_id: rel.owner_id,
        kind: "caregiver_proposal",
        severity: "info",
        title: `${caregiverName} proposed a change`,
        body: summary || "Open the inbox to review.",
      });
    } catch {
      // Non-fatal: alert is a UX nicety, the pending_change is what matters.
    }

    return { change };
  });

export const getPendingChangesCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { count, error } = await supabaseAdmin
      .from("pending_changes")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("care_audit_log")
      .select("*")
      .eq("owner_id", userId)
      .order("at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });

/* ---------- Time-limited access ---------- */

export const setExpiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; expires_at: string | null }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        expires_at: z.string().datetime().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id")
      .eq("id", data.relationship_id)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId) throw new Error("Forbidden");

    const { error: uErr } = await supabaseAdmin
      .from("care_relationships")
      .update({ expires_at: data.expires_at })
      .eq("id", data.relationship_id);
    if (uErr) throw new Error(uErr.message);

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: "expiry_changed",
      metadata: { expires_at: data.expires_at },
    });
    return { ok: true };
  });

/* ---------- Caregiver-side reads (scope-guarded) ---------- */

async function assertScope(ownerId: string, caregiverId: string, scope: string) {
  const { data, error } = await supabaseAdmin.rpc("has_care_scope", {
    _owner_id: ownerId,
    _caregiver_id: caregiverId,
    _scope: scope,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Missing scope: " + scope);
}

const ownerInput = (input: { owner_id: string }) =>
  z.object({ owner_id: z.string().uuid() }).parse(input);

export const caregiverReadOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, role, status, expires_at, caregiver_hidden_features")
      .eq("owner_id", data.owner_id)
      .eq("caregiver_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rel) throw new Error("No active relationship");
    if (rel.expires_at && new Date(rel.expires_at) < new Date())
      throw new Error("Access expired");

    const { data: scopes } = await supabaseAdmin
      .from("care_scopes")
      .select("scope, granted")
      .eq("relationship_id", rel.id);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, community_display_name, timezone, gender, conditions, feature_overrides")
      .eq("id", data.owner_id)
      .maybeSingle();

    return {
      relationship: rel,
      scopes: (scopes ?? []).filter((s) => s.granted).map((s) => s.scope),
      profile,
      ownerConditions: (profile?.conditions as string[] | null) ?? [],
      ownerFeatureOverrides:
        (profile?.feature_overrides as Record<string, boolean> | null) ?? {},
      caregiverHiddenFeatures:
        ((rel as { caregiver_hidden_features?: string[] | null })
          .caregiver_hidden_features as string[] | null) ?? [],
    };
  });

export const setCaregiverHiddenFeatures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; hidden: string[] }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        hidden: z.array(z.string().min(1).max(64)).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error: relErr } = await supabaseAdmin
      .from("care_relationships")
      .select("id")
      .eq("id", data.relationship_id)
      .eq("caregiver_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (relErr) throw new Error(relErr.message);
    if (!rel) throw new Error("No active relationship");
    const { error } = await supabaseAdmin
      .from("care_relationships")
      .update({ caregiver_hidden_features: data.hidden })
      .eq("id", rel.id);
    if (error) throw new Error(error.message);
    return { ok: true, hidden: data.hidden };
  });

export const caregiverReadMeds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "meds:read");
    const { data: meds } = await supabaseAdmin
      .from("medications")
      .select("id, name, dosage, times_of_day, schedule, is_rescue, active, notes, refill_date, pills_remaining, created_by_kind")
      .eq("user_id", data.owner_id)
      .eq("active", true)
      .order("name");
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data: doses } = await supabaseAdmin
      .from("medication_doses")
      .select("id, medication_id, scheduled_at, taken_at, status, created_by_kind")
      .eq("user_id", data.owner_id)
      .gte("scheduled_at", since)
      .order("scheduled_at", { ascending: false })
      .limit(200);
    return { meds: meds ?? [], doses: doses ?? [] };
  });

export const caregiverReadBiometrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "biometrics:read");
    // 30 days so the MetricCard grid can compute baselines + sparklines, the
    // same window the patient sees on /biometrics.
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("biometrics")
      .select("*")
      .eq("user_id", data.owner_id)
      .eq("source", "oura")
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true })
      .limit(500);
    return { rows: rows ?? [] };
  });

export const caregiverReadJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "journal:read");
    const { data: rows } = await supabaseAdmin
      .from("journal_entries")
      .select("id, captured_at, kind, text, ai_summary, ai_tags, created_by_kind")
      .eq("user_id", data.owner_id)
      .is("archived_at", null)
      .order("captured_at", { ascending: false })
      .limit(30);
    return { entries: rows ?? [] };
  });

export const caregiverReadSeizures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "seizures:read");
    const { data: rows } = await supabaseAdmin
      .from("seizure_events")
      .select("id, started_at, ended_at, duration_seconds, type, severity, injury, rescue_med_given, notes, created_by_kind")
      .eq("user_id", data.owner_id)
      .order("started_at", { ascending: false })
      .limit(30);
    return { events: rows ?? [] };
  });

export const caregiverReadReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "reports:read");
    const { data: rows } = await supabaseAdmin
      .from("report_documents")
      .select("id, title, report_type, report_date, file_mime, status, created_at")
      .eq("user_id", data.owner_id)
      .order("created_at", { ascending: false })
      .limit(100);
    return { reports: rows ?? [] };
  });

const caregiverReportInput = (input: { owner_id: string; report_id: string }) =>
  z.object({
    owner_id: z.string().uuid(),
    report_id: z.string().uuid(),
  }).parse(input);

export const caregiverReadReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(caregiverReportInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "reports:read");
    const { data: report, error: rErr } = await supabaseAdmin
      .from("report_documents")
      .select(
        "id, title, report_type, report_date, file_mime, status, created_at, summary, ai_summary, ai_summary_at"
      )
      .eq("id", data.report_id)
      .eq("user_id", data.owner_id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!report) throw new Error("Report not found");
    const { data: metrics } = await supabaseAdmin
      .from("report_metrics")
      .select(
        "id, metric_key, display_name, value, value_text, unit, reference_low, reference_high, flag"
      )
      .eq("report_id", data.report_id)
      .order("metric_key", { ascending: true });
    // Audit caregiver access to PHI
    await supabaseAdmin.from("phi_access_log").insert({
      user_id: data.owner_id,
      actor_id: context.userId,
      resource_type: "report_document",
      resource_id: data.report_id,
      action: "caregiver_view",
    });
    return { report, metrics: metrics ?? [] };
  });

export const caregiverReadToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    await assertScope(data.owner_id, context.userId, "today:read");
    const today = new Date().toISOString().slice(0, 10);
    const { data: forecast } = await supabaseAdmin
      .from("risk_forecasts")
      .select("for_date, risk_score, band, ai_narrative, top_factors")
      .eq("user_id", data.owner_id)
      .eq("for_date", today)
      .maybeSingle();
    const { data: alerts } = await supabaseAdmin
      .from("alerts")
      .select("id, kind, title, body, severity, acknowledged, created_at")
      .eq("user_id", data.owner_id)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(10);
    return { forecast, alerts: alerts ?? [] };
  });

/* ---------- Caregiver-side writes (scope-guarded) ---------- */

async function getActiveRelationship(ownerId: string, caregiverId: string) {
  const { data: rel, error } = await supabaseAdmin
    .from("care_relationships")
    .select("id, status, expires_at")
    .eq("owner_id", ownerId)
    .eq("caregiver_id", caregiverId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!rel) throw new Error("No active relationship");
  if (rel.expires_at && new Date(rel.expires_at) < new Date())
    throw new Error("Access expired");
  return rel;
}

async function logCaregiverWrite(
  relationshipId: string,
  ownerId: string,
  caregiverId: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  await supabaseAdmin.from("care_audit_log").insert({
    relationship_id: relationshipId,
    owner_id: ownerId,
    actor_id: caregiverId,
    action: "wrote",
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

export const caregiverMarkDose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    owner_id: string;
    dose_id: string;
    action: "taken" | "skip" | "reset_pending";
  }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        dose_id: z.string().uuid(),
        action: z.enum(["taken", "skip", "reset_pending"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    await assertScope(data.owner_id, caregiverId, "meds:write");
    const rel = await getActiveRelationship(data.owner_id, caregiverId);

    const { data: dose, error: dErr } = await supabaseAdmin
      .from("medication_doses")
      .select("id, user_id")
      .eq("id", data.dose_id)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!dose || dose.user_id !== data.owner_id) throw new Error("Dose not found");

    const now = new Date().toISOString();
    const { error: uErr } = await supabaseAdmin
      .from("medication_doses")
      .update(
        data.action === "taken"
          ? { status: "taken", taken_at: now }
          : data.action === "skip"
            ? { status: "skipped", taken_at: null }
            : { status: "pending", taken_at: null },
      )
      .eq("id", data.dose_id);
    if (uErr) throw new Error(uErr.message);

    await logCaregiverWrite(rel.id, data.owner_id, caregiverId, "medication_doses", data.dose_id, {
      action: data.action,
    });
    void notifyOwnerOfCaregiverWrite({
      ownerId: data.owner_id,
      caregiverId,
      relationshipId: rel.id,
      kind: "dose",
      resourceId: data.dose_id,
      summary: `Dose marked ${data.action}`,
    });
    return { ok: true };
  });

export const caregiverLogSeizure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    owner_id: string;
    started_at: string;
    ended_at?: string | null;
    type?: string | null;
    severity?: number | null;
    notes?: string | null;
    rescue_med_given?: boolean;
    injury?: boolean;
  }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        started_at: z.string().datetime(),
        ended_at: z.string().datetime().nullable().optional(),
        type: z.string().max(64).nullable().optional(),
        severity: z.number().int().min(0).max(10).nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
        rescue_med_given: z.boolean().optional(),
        injury: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    await assertScope(data.owner_id, caregiverId, "seizures:write");
    const rel = await getActiveRelationship(data.owner_id, caregiverId);

    const duration =
      data.ended_at
        ? Math.max(
            0,
            Math.round(
              (new Date(data.ended_at).getTime() -
                new Date(data.started_at).getTime()) /
                1000,
            ),
          )
        : null;

    const { data: row, error } = await supabaseAdmin
      .from("seizure_events")
      .insert({
        user_id: data.owner_id,
        started_at: data.started_at,
        ended_at: data.ended_at ?? null,
        duration_seconds: duration,
        type: data.type ?? null,
        severity: data.severity ?? null,
        notes: data.notes ?? null,
        rescue_med_given: data.rescue_med_given ?? false,
        injury: data.injury ?? false,
        witnessed: true,
        witness_name: null,
        created_by_id: caregiverId,
        created_by_kind: "caregiver",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logCaregiverWrite(rel.id, data.owner_id, caregiverId, "seizure_events", row.id);
    void notifyOwnerOfCaregiverWrite({
      ownerId: data.owner_id,
      caregiverId,
      relationshipId: rel.id,
      kind: "seizure",
      resourceId: row.id,
      summary: data.notes?.slice(0, 200) ?? undefined,
    });
    return { id: row.id };
  });

export const caregiverAddJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    owner_id: string;
    text: string;
    captured_at?: string;
  }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        text: z.string().trim().min(1).max(8000),
        captured_at: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    await assertScope(data.owner_id, caregiverId, "journal:write");
    const rel = await getActiveRelationship(data.owner_id, caregiverId);

    const { data: row, error } = await supabaseAdmin
      .from("journal_entries")
      .insert({
        user_id: data.owner_id,
        text: data.text,
        kind: "text",
        captured_at: data.captured_at ?? new Date().toISOString(),
        status: "processing",
        created_by_id: caregiverId,
        created_by_kind: "caregiver",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logCaregiverWrite(rel.id, data.owner_id, caregiverId, "journal_entries", row.id);
    void notifyOwnerOfCaregiverWrite({
      ownerId: data.owner_id,
      caregiverId,
      relationshipId: rel.id,
      kind: "journal",
      resourceId: row.id,
      summary: data.text.slice(0, 200),
    });
    return { id: row.id };
  });

export const caregiverAddBiometric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    owner_id: string;
    recorded_at: string;
    hr_bpm?: number | null;
    resting_hr_bpm?: number | null;
    spo2_pct?: number | null;
    skin_temp_c?: number | null;
    steps?: number | null;
    sleep_total_min?: number | null;
    notes?: string | null;
  }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        recorded_at: z.string().datetime(),
        hr_bpm: z.number().min(0).max(400).nullable().optional(),
        resting_hr_bpm: z.number().min(0).max(400).nullable().optional(),
        spo2_pct: z.number().min(0).max(100).nullable().optional(),
        skin_temp_c: z.number().min(20).max(45).nullable().optional(),
        steps: z.number().int().min(0).max(200000).nullable().optional(),
        sleep_total_min: z.number().min(0).max(1440).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    await assertScope(data.owner_id, caregiverId, "biometrics:write");
    const rel = await getActiveRelationship(data.owner_id, caregiverId);

    const { data: row, error } = await supabaseAdmin
      .from("biometrics")
      .insert({
        user_id: data.owner_id,
        source: "caregiver",
        recorded_at: data.recorded_at,
        hr_bpm: data.hr_bpm ?? null,
        resting_hr_bpm: data.resting_hr_bpm ?? null,
        spo2_pct: data.spo2_pct ?? null,
        skin_temp_c: data.skin_temp_c ?? null,
        steps: data.steps ?? null,
        sleep_total_min: data.sleep_total_min ?? null,
        raw_payload: data.notes ? { notes: data.notes } : null,
        created_by_id: caregiverId,
        created_by_kind: "caregiver",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logCaregiverWrite(rel.id, data.owner_id, caregiverId, "biometrics", row.id);
    void notifyOwnerOfCaregiverWrite({
      ownerId: data.owner_id,
      caregiverId,
      relationshipId: rel.id,
      kind: "biometric",
      resourceId: row.id,
    });
    return { id: row.id };
  });

/* ---------- Caregiver dashboard: owners switcher, visits, alerts ---------- */

const TAB_KEYS = ["today", "meds", "biometrics", "journal", "seizures", "reports"] as const;
type TabKey = (typeof TAB_KEYS)[number];

async function getActiveRelationshipForCaregiver(ownerId: string, caregiverId: string) {
  const { data: rel, error } = await supabaseAdmin
    .from("care_relationships")
    .select("id, status, expires_at")
    .eq("owner_id", ownerId)
    .eq("caregiver_id", caregiverId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!rel) throw new Error("No active relationship");
  if (rel.expires_at && new Date(rel.expires_at) < new Date())
    throw new Error("Access expired");
  return rel;
}

export const listCaregiverOwners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rels, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, role, status, expires_at, invite_email, invite_token, created_at, accepted_at")
      .eq("caregiver_id", userId)
      .in("status", ["active", "pending"])
      .order("accepted_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    const relationships = rels ?? [];
    const ownerIds = Array.from(
      new Set(relationships.filter((r) => r.status === "active").map((r) => r.owner_id)),
    );

    let profilesById: Record<string, { id: string; first_name: string | null; last_name: string | null; community_display_name: string | null; conditions: string[] | null; timezone: string | null }> = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name, community_display_name, conditions, timezone")
        .in("id", ownerIds);
      profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p as never]));
    }

    // Per-relationship last_seen + activity counts
    const relIds = relationships.filter((r) => r.status === "active").map((r) => r.id);
    let visitsByRel: Record<string, { last_seen_at: string; last_seen_by_tab: Record<string, string> }> = {};
    if (relIds.length > 0) {
      const { data: visits } = await supabaseAdmin
        .from("care_caregiver_visits")
        .select("relationship_id, last_seen_at, last_seen_by_tab")
        .in("relationship_id", relIds);
      visitsByRel = Object.fromEntries(
        (visits ?? []).map((v) => [
          v.relationship_id,
          {
            last_seen_at: v.last_seen_at,
            last_seen_by_tab: (v.last_seen_by_tab as Record<string, string>) ?? {},
          },
        ]),
      );
    }

    // Cheap activity totals per owner since last_seen_at (or 30 days back as floor)
    const owners = await Promise.all(
      relationships
        .filter((r) => r.status === "active")
        .map(async (r) => {
          const visit = visitsByRel[r.id];
          const fallback = new Date(Date.now() - 30 * 86400_000).toISOString();
          const since = visit?.last_seen_at ?? fallback;
          const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
          const since72h = new Date(Date.now() - 72 * 3600_000).toISOString();
          const [meds, journal, seizures, biometrics, missed24h, seizures24h, lastJournal] = await Promise.all([
            supabaseAdmin
              .from("medication_doses")
              .select("id", { count: "exact", head: true })
              .eq("user_id", r.owner_id)
              .gt("created_at", since),
            supabaseAdmin
              .from("journal_entries")
              .select("id", { count: "exact", head: true })
              .eq("user_id", r.owner_id)
              .gt("created_at", since),
            supabaseAdmin
              .from("seizure_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", r.owner_id)
              .gt("created_at", since),
            supabaseAdmin
              .from("biometrics")
              .select("id", { count: "exact", head: true })
              .eq("user_id", r.owner_id)
              .gt("created_at", since),
            supabaseAdmin
              .from("medication_doses")
              .select("id", { count: "exact", head: true })
              .eq("user_id", r.owner_id)
              .eq("status", "missed")
              .gte("scheduled_at", since24h),
            supabaseAdmin
              .from("seizure_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", r.owner_id)
              .gte("started_at", since24h),
            supabaseAdmin
              .from("journal_entries")
              .select("created_at")
              .eq("user_id", r.owner_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
          const counts = {
            meds: meds.count ?? 0,
            journal: journal.count ?? 0,
            seizures: seizures.count ?? 0,
            biometrics: biometrics.count ?? 0,
          };
          const total = counts.meds + counts.journal + counts.seizures + counts.biometrics;
          // Health signal: red if seizure in 24h or ≥3 missed doses; amber if
          // ≥1 missed dose or journal silence > 72h; otherwise green.
          const missedCount = missed24h.count ?? 0;
          const seizureCount = seizures24h.count ?? 0;
          const lastJournalAt = (lastJournal.data as { created_at?: string } | null)?.created_at ?? null;
          const journalSilence =
            !lastJournalAt || new Date(lastJournalAt).toISOString() < since72h;
          let health_signal: "green" | "amber" | "red" = "green";
          if (seizureCount > 0 || missedCount >= 3) health_signal = "red";
          else if (missedCount >= 1 || journalSilence) health_signal = "amber";
          return {
            relationship_id: r.id,
            owner_id: r.owner_id,
            role: r.role,
            expires_at: r.expires_at,
            accepted_at: r.accepted_at,
            profile: profilesById[r.owner_id] ?? null,
            last_seen_at: visit?.last_seen_at ?? null,
            unread_total: total,
            unread_by_tab: counts,
            health_signal,
            health_reasons: {
              missed_doses_24h: missedCount,
              seizures_24h: seizureCount,
              journal_silence_72h: journalSilence,
            },
          };
        }),
    );

    const pending = relationships
      .filter((r) => r.status === "pending")
      .map((r) => ({
        relationship_id: r.id,
        owner_id: r.owner_id,
        invite_email: r.invite_email,
        invite_token: r.invite_token,
        role: r.role,
        created_at: r.created_at,
      }));

    return { owners, pending };
  });

export const markOwnerSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { owner_id: string; tab?: string }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        tab: z.enum(TAB_KEYS).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    const rel = await getActiveRelationshipForCaregiver(data.owner_id, caregiverId);
    const now = new Date().toISOString();

    // Fetch existing for last_seen_by_tab merge
    const { data: existing } = await supabaseAdmin
      .from("care_caregiver_visits")
      .select("last_seen_by_tab")
      .eq("relationship_id", rel.id)
      .maybeSingle();
    const prevTabs =
      ((existing?.last_seen_by_tab as Record<string, string>) ?? {});
    const tabs = data.tab ? { ...prevTabs, [data.tab]: now } : prevTabs;

    const { error } = await supabaseAdmin
      .from("care_caregiver_visits")
      .upsert(
        {
          relationship_id: rel.id,
          caregiver_id: caregiverId,
          last_seen_at: now,
          last_seen_by_tab: tabs,
          updated_at: now,
        },
        { onConflict: "relationship_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOwnerActivityCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    const rel = await getActiveRelationshipForCaregiver(data.owner_id, caregiverId);
    const { data: visit } = await supabaseAdmin
      .from("care_caregiver_visits")
      .select("last_seen_at, last_seen_by_tab")
      .eq("relationship_id", rel.id)
      .maybeSingle();
    const fallback = new Date(Date.now() - 30 * 86400_000).toISOString();
    const baseSince = visit?.last_seen_at ?? fallback;
    const tabSeen = (visit?.last_seen_by_tab as Record<string, string>) ?? {};
    const sinceFor = (tab: TabKey) => tabSeen[tab] ?? baseSince;

    const [meds, journal, seizures, biometrics, reports, today] = await Promise.all([
      supabaseAdmin
        .from("medication_doses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .gt("created_at", sinceFor("meds")),
      supabaseAdmin
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .gt("created_at", sinceFor("journal")),
      supabaseAdmin
        .from("seizure_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .gt("created_at", sinceFor("seizures")),
      supabaseAdmin
        .from("biometrics")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .gt("created_at", sinceFor("biometrics")),
      supabaseAdmin
        .from("report_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .gt("created_at", sinceFor("reports")),
      supabaseAdmin
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .eq("acknowledged", false)
        .gt("created_at", sinceFor("today")),
    ]);

    return {
      counts: {
        today: today.count ?? 0,
        meds: meds.count ?? 0,
        journal: journal.count ?? 0,
        seizures: seizures.count ?? 0,
        biometrics: biometrics.count ?? 0,
        reports: reports.count ?? 0,
      },
    };
  });

export const caregiverReadAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ownerInput)
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    const rel = await getActiveRelationshipForCaregiver(data.owner_id, caregiverId);

    // Get caregiver scopes, drive each section by what they can see
    const { data: scopeRows } = await supabaseAdmin
      .from("care_scopes")
      .select("scope, granted")
      .eq("relationship_id", rel.id);
    const scopes = new Set((scopeRows ?? []).filter((s) => s.granted).map((s) => s.scope));

    const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();

    const { data: visit } = await supabaseAdmin
      .from("care_caregiver_visits")
      .select("last_seen_at, dismissed_alert_ids")
      .eq("relationship_id", rel.id)
      .maybeSingle();
    const dismissed = new Set(((visit?.dismissed_alert_ids as string[]) ?? []));
    const sinceVisit = visit?.last_seen_at ?? since24h;

    type AlertItem = {
      id: string;
      kind: "missed_dose" | "seizure" | "biometric" | "journal";
      title: string;
      body?: string;
      at: string;
      tab: TabKey;
    };
    const items: AlertItem[] = [];

    if (scopes.has("meds:read")) {
      const { data: missed } = await supabaseAdmin
        .from("medication_doses")
        .select("id, scheduled_at, medication_id")
        .eq("user_id", data.owner_id)
        .eq("status", "missed")
        .gte("scheduled_at", since24h)
        .order("scheduled_at", { ascending: false })
        .limit(8);
      for (const m of missed ?? []) {
        items.push({
          id: `missed:${m.id}`,
          kind: "missed_dose",
          title: "Missed dose",
          body: new Date(m.scheduled_at).toLocaleString(),
          at: m.scheduled_at,
          tab: "meds",
        });
      }
    }

    if (scopes.has("seizures:read")) {
      const { data: seizures } = await supabaseAdmin
        .from("seizure_events")
        .select("id, started_at, type, severity")
        .eq("user_id", data.owner_id)
        .gte("started_at", since24h)
        .order("started_at", { ascending: false })
        .limit(8);
      for (const s of seizures ?? []) {
        items.push({
          id: `seizure:${s.id}`,
          kind: "seizure",
          title: s.type ? `Seizure: ${s.type}` : "Seizure logged",
          body: new Date(s.started_at).toLocaleString(),
          at: s.started_at,
          tab: "seizures",
        });
      }
    }

    if (scopes.has("biometrics:read")) {
      const { data: bio } = await supabaseAdmin
        .from("biometrics")
        .select("id, recorded_at, spo2_pct, resting_hr_bpm, skin_temp_c")
        .eq("user_id", data.owner_id)
        .gte("recorded_at", since24h)
        .order("recorded_at", { ascending: false })
        .limit(50);
      for (const b of bio ?? []) {
        const flags: string[] = [];
        if (typeof b.spo2_pct === "number" && b.spo2_pct < 92) flags.push(`SpO₂ ${b.spo2_pct}%`);
        if (typeof b.resting_hr_bpm === "number" && (b.resting_hr_bpm > 100 || b.resting_hr_bpm < 40))
          flags.push(`Resting HR ${b.resting_hr_bpm} bpm`);
        if (typeof b.skin_temp_c === "number" && (b.skin_temp_c > 38 || b.skin_temp_c < 35))
          flags.push(`Temp ${b.skin_temp_c}°C`);
        if (flags.length > 0) {
          items.push({
            id: `bio:${b.id}`,
            kind: "biometric",
            title: "Biometric out of range",
            body: flags.join(" · "),
            at: b.recorded_at,
            tab: "biometrics",
          });
        }
      }
    }

    if (scopes.has("journal:read")) {
      const { count } = await supabaseAdmin
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.owner_id)
        .gt("created_at", sinceVisit);
      if ((count ?? 0) > 0) {
        items.push({
          id: `journal:since-${sinceVisit}`,
          kind: "journal",
          title: `${count} new journal ${count === 1 ? "entry" : "entries"}`,
          body: "Since your last visit",
          at: sinceVisit,
          tab: "journal",
        });
      }
    }

    const filtered = items.filter((i) => !dismissed.has(i.id));
    filtered.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return { alerts: filtered };
  });

export const dismissCaregiverAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { owner_id: string; alert_id: string }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        alert_id: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    const rel = await getActiveRelationshipForCaregiver(data.owner_id, caregiverId);
    const { data: existing } = await supabaseAdmin
      .from("care_caregiver_visits")
      .select("dismissed_alert_ids")
      .eq("relationship_id", rel.id)
      .maybeSingle();
    const prev = ((existing?.dismissed_alert_ids as string[]) ?? []);
    if (prev.includes(data.alert_id)) return { ok: true };
    const next = [...prev, data.alert_id].slice(-200);
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("care_caregiver_visits")
      .upsert(
        {
          relationship_id: rel.id,
          caregiver_id: caregiverId,
          dismissed_alert_ids: next,
          updated_at: now,
        },
        { onConflict: "relationship_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Dismiss every alert currently visible to the caregiver for one owner.
 * Caller passes the ids it just rendered, we append them to the visit's
 * dismissed_alert_ids list (capped at the most recent 200 entries).
 */
export const dismissAllCaregiverAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { owner_id: string; alert_ids: string[] }) =>
    z
      .object({
        owner_id: z.string().uuid(),
        alert_ids: z.array(z.string().min(1).max(200)).min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const caregiverId = context.userId;
    const rel = await getActiveRelationshipForCaregiver(data.owner_id, caregiverId);
    const { data: existing } = await supabaseAdmin
      .from("care_caregiver_visits")
      .select("dismissed_alert_ids")
      .eq("relationship_id", rel.id)
      .maybeSingle();
    const prev = ((existing?.dismissed_alert_ids as string[]) ?? []);
    const merged = Array.from(new Set([...prev, ...data.alert_ids])).slice(-200);
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("care_caregiver_visits")
      .upsert(
        {
          relationship_id: rel.id,
          caregiver_id: caregiverId,
          dismissed_alert_ids: merged,
          updated_at: now,
        },
        { onConflict: "relationship_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, dismissed: data.alert_ids.length };
  });

/* ---------- Phase 4: owner controls & audit ---------- */

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const exportCareAuditCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { days?: number }) =>
    z.object({ days: z.number().int().min(1).max(365).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const days = data.days ?? 90;
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    const { data: rows, error } = await supabaseAdmin
      .from("care_audit_log")
      .select("id, at, relationship_id, actor_id, action, resource_type, resource_id, metadata")
      .eq("owner_id", userId)
      .gte("at", since)
      .order("at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    // Resolve caregiver emails via relationships → invite_email + auth lookup as fallback
    const relIds = Array.from(new Set((rows ?? []).map((r) => r.relationship_id).filter(Boolean) as string[]));
    const relByActor: Record<string, string> = {};
    if (relIds.length > 0) {
      const { data: rels } = await supabaseAdmin
        .from("care_relationships")
        .select("id, invite_email")
        .in("id", relIds);
      for (const r of rels ?? []) {
        relByActor[r.id] = r.invite_email ?? "";
      }
    }

    const header = ["at", "action", "resource_type", "resource_id", "caregiver_email", "metadata"];
    const lines = [header.join(",")];
    for (const r of rows ?? []) {
      const caregiverEmail = r.relationship_id ? relByActor[r.relationship_id] ?? "" : "";
      lines.push(
        [
          csvEscape(r.at),
          csvEscape(r.action),
          csvEscape(r.resource_type),
          csvEscape(r.resource_id),
          csvEscape(caregiverEmail),
          csvEscape(r.metadata),
        ].join(","),
      );
    }
    return { csv: lines.join("\n"), rowCount: rows?.length ?? 0 };
  });

export const listOwnerAuditFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; caregiverRelId?: string | null; resourceType?: string | null }) =>
    z
      .object({
        limit: z.number().int().min(1).max(500).optional(),
        caregiverRelId: z.string().uuid().nullable().optional(),
        resourceType: z.string().max(64).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    let q = supabaseAdmin
      .from("care_audit_log")
      .select("id, at, relationship_id, actor_id, action, resource_type, resource_id, metadata")
      .eq("owner_id", userId)
      .in("action", ["wrote", "proposed", "approved", "rejected", "scopes_updated", "revoked"])
      .order("at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.caregiverRelId) q = q.eq("relationship_id", data.caregiverRelId);
    if (data.resourceType) q = q.eq("resource_type", data.resourceType);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const relIds = Array.from(new Set((rows ?? []).map((r) => r.relationship_id).filter(Boolean) as string[]));
    const relByActor: Record<string, { email: string; role: string }> = {};
    if (relIds.length > 0) {
      const { data: rels } = await supabaseAdmin
        .from("care_relationships")
        .select("id, invite_email, role")
        .in("id", relIds);
      for (const r of rels ?? []) {
        relByActor[r.id] = { email: r.invite_email ?? "", role: r.role };
      }
    }
    return {
      entries: (rows ?? []).map((r) => ({
        ...r,
        caregiver_email: r.relationship_id ? relByActor[r.relationship_id]?.email ?? null : null,
        caregiver_role: r.relationship_id ? relByActor[r.relationship_id]?.role ?? null : null,
      })),
    };
  });

export const pauseAllWrites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; paused: boolean }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        paused: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, role")
      .eq("id", data.relationship_id)
      .single();
    if (!rel || rel.owner_id !== userId) throw new Error("Forbidden");

    const { data: scopeRows } = await supabaseAdmin
      .from("care_scopes")
      .select("scope, granted")
      .eq("relationship_id", data.relationship_id);

    const writeLike = (s: string) => s.endsWith(":write") || s.endsWith(":propose");
    const toFlip = (scopeRows ?? []).filter((s) => writeLike(s.scope));

    const rows = toFlip.map((s) => ({
      relationship_id: data.relationship_id,
      scope: s.scope,
      granted: data.paused ? false : true,
    }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from("care_scopes")
        .upsert(rows, { onConflict: "relationship_id,scope" });
      if (error) throw new Error(error.message);
    }

    // If un-pausing and no scopes exist yet, seed from role defaults
    if (!data.paused && rows.length === 0) {
      const defaults = ROLE_DEFAULT_SCOPES[rel.role as CareRole] ?? [];
      const seed = defaults
        .filter(writeLike)
        .map((scope) => ({ relationship_id: data.relationship_id, scope, granted: true }));
      if (seed.length > 0) {
        const { error } = await supabaseAdmin
          .from("care_scopes")
          .upsert(seed, { onConflict: "relationship_id,scope" });
        if (error) throw new Error(error.message);
      }
    }

    await supabaseAdmin.from("care_audit_log").insert({
      relationship_id: data.relationship_id,
      owner_id: userId,
      actor_id: userId,
      action: data.paused ? "writes_paused" : "writes_resumed",
    });
    return { ok: true, flipped: rows.length };
  });

export const getRelationshipWriteState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string }) =>
    z.object({ relationship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id")
      .eq("id", data.relationship_id)
      .single();
    if (!rel || rel.owner_id !== userId) throw new Error("Forbidden");
    const { data: scopeRows } = await supabaseAdmin
      .from("care_scopes")
      .select("scope, granted")
      .eq("relationship_id", data.relationship_id);
    const writeLike = (s: string) => s.endsWith(":write") || s.endsWith(":propose");
    const writes = (scopeRows ?? []).filter((s) => writeLike(s.scope));
    const hasAnyEnabled = writes.some((s) => s.granted);
    return { paused: writes.length > 0 && !hasAnyEnabled, total: writes.length };
  });

export const setCareDigestPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { enabled: boolean }) =>
    z.object({ enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ care_daily_digest_enabled: data.enabled })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCareDigestPreference = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("care_daily_digest_enabled")
      .eq("id", userId)
      .maybeSingle();
    return { enabled: data?.care_daily_digest_enabled ?? true };
  });

/**
 * Per-caregiver digest mute. When `muted` is true, that caregiver's actions
 * are excluded from the owner's daily digest email (without revoking access).
 */
export const setRelationshipDigestMuted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationship_id: string; muted: boolean }) =>
    z
      .object({
        relationship_id: z.string().uuid(),
        muted: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("care_relationships")
      .update({ digest_muted: data.muted })
      .eq("id", data.relationship_id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendCareDigestNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const req = getRequest();
    const origin =
      process.env.PUBLIC_SITE_URL ||
      (req ? new URL(req.url).origin : "https://purplelife.org");
    return await sendCareDailyDigest({ ownerId: userId, origin, windowHours: 24 });
  });

/* ---------- Phase 5: pending-changes inbox ---------- */

const PENDING_TYPE_LABEL: Record<string, string> = {
  add_journal_comment: "Note appended to a journal entry",
  add_meds_note: "Note appended to a medication",
};

export const listPendingChangesDetailed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: changes, error } = await supabaseAdmin
      .from("pending_changes")
      .select("*")
      .eq("owner_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const caregiverIds = Array.from(
      new Set((changes ?? []).map((c) => c.caregiver_id).filter(Boolean) as string[]),
    );
    const profilesById: Record<string, { first_name: string | null; last_name: string | null; community_display_name: string | null }> = {};
    if (caregiverIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name, community_display_name")
        .in("id", caregiverIds);
      for (const p of profs ?? []) profilesById[p.id] = p;
    }

    const detailed = await Promise.all(
      (changes ?? []).map(async (c) => {
        let currentValue: string | null = null;
        if (c.type === "add_journal_comment" && c.target_id) {
          const { data } = await supabaseAdmin
            .from("journal_entries")
            .select("text, captured_at")
            .eq("id", c.target_id)
            .eq("user_id", c.owner_id)
            .maybeSingle();
          currentValue = data?.text ?? null;
        } else if (c.type === "add_meds_note" && c.target_id) {
          const { data } = await supabaseAdmin
            .from("medications")
            .select("name, notes")
            .eq("id", c.target_id)
            .eq("user_id", c.owner_id)
            .maybeSingle();
          currentValue = data ? `${data.name}\n${data.notes ?? ""}` : null;
        }
        const proposedText = String((c.payload as { text?: string } | null)?.text ?? "");
        return {
          id: c.id,
          type: c.type,
          type_label: PENDING_TYPE_LABEL[c.type] ?? c.type,
          created_at: c.created_at,
          target_table: c.target_table,
          target_id: c.target_id,
          caregiver_id: c.caregiver_id,
          caregiver_profile: c.caregiver_id ? profilesById[c.caregiver_id] ?? null : null,
          current_value: currentValue,
          proposed_text: proposedText,
        };
      }),
    );
    return { changes: detailed };
  });