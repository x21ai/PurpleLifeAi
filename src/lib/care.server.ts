/**
 * Shared care-invite accept/decline logic for the Worker JSON routes
 * (`/api/care/accept`, `/api/care/decline`) used by Flutter and other
 * non-TanStack clients.
 *
 * Mirrors the TanStack server fns in `src/lib/care.functions.ts`
 * (`acceptInvite`, `declineIncomingCareInvite`) exactly: same checks, same
 * order, same messages, same writes. If you change behavior here, change the
 * server fns too (and vice versa).
 *
 * SECURITY: runs with the service role (RLS gives caregivers SELECT-only on
 * `care_relationships`). Never log the raw invite token.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
