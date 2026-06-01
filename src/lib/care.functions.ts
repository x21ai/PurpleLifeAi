import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CareRole, CareScope } from "./care.scopes";
import { ROLE_DEFAULT_SCOPES, ROLE_LABELS } from "./care.scopes";
import { sendTransactionalEmail } from "./email/send";
import { getRequest } from "@tanstack/react-start/server";
import {
  notifyOwnerOfCaregiverWrite,
  notifyCaregiverOfDecision,
} from "./care-notify.server";

function newInviteToken(): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
}

const emailSchema = z.string().trim().toLowerCase().email().max(255);
const roleSchema = z.enum(["emergency", "caregiver", "provider", "viewer"]);

/* ---------- Owner-facing ---------- */

export const inviteCaregiver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: CareRole; scopes?: CareScope[] }) =>
    z
      .object({
        email: emailSchema,
        role: roleSchema,
        scopes: z.array(z.string().max(64)).max(60).optional(),
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
      const result = await sendTransactionalEmail({
        templateName: "care-invite",
        recipientEmail: data.email,
        idempotencyKey: `care-invite-${rel.id}`,
        templateData: {
          inviterName: inviterName || undefined,
          roleLabel: ROLE_LABELS[data.role as CareRole],
          acceptUrl,
          expiresAt: (rel as { expires_at?: string | null }).expires_at ?? null,
        },
      });
      emailSent = !!result?.ok;
    } catch (err) {
      console.warn("care-invite email failed (link still available in UI)", err);
    }

    return { relationship: rel, invite_token, acceptUrl, emailSent };
  });

export const listMyCaregivers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rels, error } = await supabaseAdmin
      .from("care_relationships")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
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
        const stamp = `\n\n— Caregiver note (approved ${new Date().toISOString().slice(0, 10)}):\n${note}`;
        const { data: row } = await supabaseAdmin
          .from("journal_entries")
          .select("text")
          .eq("id", change.target_id)
          .single();
        const newText = (row?.text ?? "") + stamp;
        await supabaseAdmin.from("journal_entries").update({ text: newText }).eq("id", change.target_id);
      } else if (type === "add_meds_note" && change.target_id) {
        const note = String((change.payload as any)?.text ?? "").slice(0, 1000);
        const { data: row } = await supabaseAdmin
          .from("medications")
          .select("notes")
          .eq("id", change.target_id)
          .single();
        const newNotes = ((row?.notes ?? "") + "\n— Caregiver: " + note).trim();
        await supabaseAdmin.from("medications").update({ notes: newNotes }).eq("id", change.target_id);
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

    return { relationship_id: rel.id, owner_id: rel.owner_id };
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

    return { change };
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
      .select("id, role, status, expires_at")
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
      .select("first_name, last_name, community_display_name, diagnosis, timezone")
      .eq("id", data.owner_id)
      .maybeSingle();

    return {
      relationship: rel,
      scopes: (scopes ?? []).filter((s) => s.granted).map((s) => s.scope),
      profile,
    };
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