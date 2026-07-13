/**
 * Shared care-invite accept/decline/list logic for the Worker JSON routes
 * (`/api/care/accept`, `/api/care/decline`, `/api/care/incoming-invites`)
 * used by Flutter and other non-TanStack clients.
 *
 * Mirrors the TanStack server fns in `src/lib/care.functions.ts`
 * (`acceptInvite`, `declineIncomingCareInvite`, `listIncomingCareInvites`)
 * exactly: same checks, same order, same messages, same writes/reads. If you
 * change behavior here, change the server fns too (and vice versa).
 *
 * SECURITY: runs with the service role. RLS's `care_rel_caregiver_select`
 * policy only allows `auth.uid() = caregiver_id`, which is NULL on a
 * still-pending invite, so a direct client-side SELECT/UPDATE from the
 * invitee always returns 0 rows. That is why accept, decline, and the
 * incoming-invites list all require this service-role path. Never log the
 * raw invite token.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CareRole } from "./care.scopes";
import { ROLE_LABELS } from "./care.scopes";

/** Error carrying the HTTP status the JSON routes should respond with. */
export class CareApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CareApiError";
  }
}

/**
 * Accept a pending care invite by its single-use token on behalf of `userId`.
 * Parity note: like `acceptInvite`, this does NOT check `expires_at` (only
 * `listIncomingCareInvites` filters expired invites). Do not add an expiry
 * check here without a product decision.
 */
export async function acceptCareInviteForUser(
  userId: string,
  inviteToken: string,
): Promise<{ relationship_id: string; owner_id: string }> {
  const { data: rel, error } = await supabaseAdmin
    .from("care_relationships")
    .select("*")
    .eq("invite_token", inviteToken)
    .single();
  if (error || !rel) throw new CareApiError("Invite not found", 404);
  if (rel.status !== "pending") {
    throw new CareApiError("Invite is no longer pending", 409);
  }
  if (rel.owner_id === userId) {
    throw new CareApiError("You can't accept your own invite", 403);
  }

  // Verify the accepting user's email matches the invite email, so a leaked
  // or forwarded token can't be redeemed by an unintended account.
  if (rel.invite_email) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const accepterEmail = (u?.user?.email ?? "").trim().toLowerCase();
    const inviteEmail = String(rel.invite_email).trim().toLowerCase();
    if (!accepterEmail || accepterEmail !== inviteEmail) {
      throw new CareApiError("This invite was sent to a different email address.", 403);
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
  if (uErr) throw new CareApiError(uErr.message, 500);

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
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("kind", "care_invite")
      .eq("acknowledged", false);
  } catch (err) {
    console.warn("[care] clear invite alerts failed", err);
  }

  return { relationship_id: rel.id, owner_id: rel.owner_id };
}

/**
 * Decline a pending care invite addressed to `userId`'s email. Service-role
 * variant of `declineIncomingCareInvite`: the Flutter client's direct
 * `.update()` is silently RLS-blocked (0-row no-op), so decline must run here.
 */
export async function declineCareInviteForUser(
  userId: string,
  relationshipId: string,
): Promise<{ ok: true }> {
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = (u?.user?.email ?? "").trim().toLowerCase();
  if (!email) throw new CareApiError("Could not resolve your email.", 400);

  const { data: rel, error } = await supabaseAdmin
    .from("care_relationships")
    .select("id, status, invite_email")
    .eq("id", relationshipId)
    .single();
  if (error || !rel) throw new CareApiError("Invite not found", 404);
  if (rel.status !== "pending") {
    throw new CareApiError("Invite is no longer pending", 409);
  }
  if (
    String(rel.invite_email ?? "")
      .trim()
      .toLowerCase() !== email
  ) {
    throw new CareApiError("This invite was sent to a different email address.", 403);
  }

  const { error: uErr } = await supabaseAdmin
    .from("care_relationships")
    .update({ status: "revoked" })
    .eq("id", rel.id);
  if (uErr) throw new CareApiError(uErr.message, 500);

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
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("kind", "care_invite")
      .eq("acknowledged", false);
  } catch {
    /* ignore */
  }

  return { ok: true };
}

export type IncomingCareInvite = {
  id: string;
  owner_id: string;
  role: string;
  invite_token: string | null;
  created_at: string;
  expires_at: string | null;
  owner_name: string;
  role_label: string;
};

/**
 * List pending care invites addressed to `userId`'s email. Service-role
 * mirror of `listIncomingCareInvites` in `care.functions.ts`, fronted by the
 * `/api/care/incoming-invites` Worker route for Flutter (the client-side
 * `.select()` equivalent is always empty pre-accept, see module docstring).
 */
export async function listIncomingInvitesForUser(
  userId: string,
): Promise<{ invites: IncomingCareInvite[] }> {
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = (u?.user?.email ?? "").trim().toLowerCase();
  if (!email) return { invites: [] };

  const nowIso = new Date().toISOString();
  const { data: rels, error } = await supabaseAdmin
    .from("care_relationships")
    .select("id, owner_id, role, invite_token, invite_email, created_at, expires_at")
    .eq("status", "pending")
    .ilike("invite_email", email)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });
  if (error) throw new CareApiError(error.message, 500);

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

  const invites: IncomingCareInvite[] = (rels ?? []).map((r) => {
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
}

/* ---------- Caregiver dashboard reads (scope-guarded) ---------- */

/**
 * Service-role mirror of `assertScope` in `care.functions.ts`. Same
 * `has_care_scope` RPC (checks an active, non-expired relationship plus the
 * specific granted scope), but throws `CareApiError` so the Worker routes can
 * map it to a real HTTP status. Cross-user / missing-scope denials are 404
 * (not 403) so callers cannot distinguish "no access" from "not found".
 */
async function assertScopeForUser(ownerId: string, caregiverId: string, scope: string) {
  const { data, error } = await supabaseAdmin.rpc("has_care_scope", {
    _owner_id: ownerId,
    _caregiver_id: caregiverId,
    _scope: scope,
  });
  if (error) throw new CareApiError(error.message, 500);
  if (!data) throw new CareApiError("Not found", 404);
}

/** Mirrors `caregiverReadToday` in `care.functions.ts`. */
export async function caregiverReadTodayForUser(caregiverId: string, ownerId: string) {
  await assertScopeForUser(ownerId, caregiverId, "today:read");
  const today = new Date().toISOString().slice(0, 10);
  const { data: forecast } = await supabaseAdmin
    .from("risk_forecasts")
    .select("for_date, risk_score, band, ai_narrative, top_factors")
    .eq("user_id", ownerId)
    .eq("for_date", today)
    .maybeSingle();
  const { data: alerts } = await supabaseAdmin
    .from("alerts")
    .select("id, kind, title, body, severity, acknowledged, created_at")
    .eq("user_id", ownerId)
    .eq("acknowledged", false)
    .order("created_at", { ascending: false })
    .limit(10);
  return { forecast, alerts: alerts ?? [] };
}

/** Mirrors `caregiverReadMeds` in `care.functions.ts`. */
export async function caregiverReadMedsForUser(caregiverId: string, ownerId: string) {
  await assertScopeForUser(ownerId, caregiverId, "meds:read");
  const { data: meds } = await supabaseAdmin
    .from("medications")
    .select(
      "id, name, dosage, times_of_day, schedule, is_rescue, active, notes, refill_date, pills_remaining, created_by_kind",
    )
    .eq("user_id", ownerId)
    .eq("active", true)
    .order("name");
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: doses } = await supabaseAdmin
    .from("medication_doses")
    .select("id, medication_id, scheduled_at, taken_at, status, created_by_kind")
    .eq("user_id", ownerId)
    .gte("scheduled_at", since)
    .order("scheduled_at", { ascending: false })
    .limit(200);
  return { meds: meds ?? [], doses: doses ?? [] };
}

/** Mirrors `caregiverReadJournal` in `care.functions.ts`. */
export async function caregiverReadJournalForUser(caregiverId: string, ownerId: string) {
  await assertScopeForUser(ownerId, caregiverId, "journal:read");
  const { data: rows } = await supabaseAdmin
    .from("journal_entries")
    .select("id, captured_at, kind, text, ai_summary, ai_tags, created_by_kind")
    .eq("user_id", ownerId)
    .is("archived_at", null)
    .order("captured_at", { ascending: false })
    .limit(30);
  return { entries: rows ?? [] };
}

/** Mirrors `caregiverReadSeizures` in `care.functions.ts`. */
export async function caregiverReadSeizuresForUser(caregiverId: string, ownerId: string) {
  await assertScopeForUser(ownerId, caregiverId, "seizures:read");
  const { data: rows } = await supabaseAdmin
    .from("seizure_events")
    .select(
      "id, started_at, ended_at, duration_seconds, type, severity, injury, rescue_med_given, notes, created_by_kind",
    )
    .eq("user_id", ownerId)
    .order("started_at", { ascending: false })
    .limit(30);
  return { events: rows ?? [] };
}

/** Mirrors `caregiverReadReports` in `care.functions.ts`. */
export async function caregiverReadReportsForUser(caregiverId: string, ownerId: string) {
  await assertScopeForUser(ownerId, caregiverId, "reports:read");
  const { data: rows } = await supabaseAdmin
    .from("report_documents")
    .select("id, title, report_type, report_date, file_mime, status, created_at")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(100);
  return { reports: rows ?? [] };
}

/**
 * Mirrors `caregiverReadReport` in `care.functions.ts`, including the
 * `phi_access_log` `caregiver_view` audit write on success.
 */
export async function caregiverReadReportForUser(
  caregiverId: string,
  ownerId: string,
  reportId: string,
) {
  await assertScopeForUser(ownerId, caregiverId, "reports:read");
  const { data: report, error: rErr } = await supabaseAdmin
    .from("report_documents")
    .select(
      "id, title, report_type, report_date, file_mime, status, created_at, summary, ai_summary, ai_summary_at",
    )
    .eq("id", reportId)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (rErr) throw new CareApiError(rErr.message, 500);
  if (!report) throw new CareApiError("Report not found", 404);
  const { data: metrics } = await supabaseAdmin
    .from("report_metrics")
    .select(
      "id, metric_key, display_name, value, value_text, unit, reference_low, reference_high, flag",
    )
    .eq("report_id", reportId)
    .order("metric_key", { ascending: true });
  await supabaseAdmin.from("phi_access_log").insert({
    user_id: ownerId,
    actor_id: caregiverId,
    resource_type: "report_document",
    resource_id: reportId,
    action: "caregiver_view",
  });
  return { report, metrics: metrics ?? [] };
}
