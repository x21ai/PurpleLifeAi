import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CareRole, CareScope } from "./care.scopes";
import { ROLE_DEFAULT_SCOPES } from "./care.scopes";

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

    return { relationship: rel, invite_token };
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