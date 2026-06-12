import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Friends (Circle): zero-data social connections.
 * Separate from caregivers. A friend cannot see ANY of the other user's data.
 * Friendship rows just record the link so both sides know who's in their circle.
 *
 * Purple never sends friend invites itself. The inviter shares the link or
 * a short refer code from their own iMessage / WhatsApp / email / etc.
 */

function newInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

const emailSchema = z.string().trim().toLowerCase().email().max(255);

// Unambiguous alphabet (no 0/O/1/I/L) for refer codes.
const REFER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newReferCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => REFER_ALPHABET[b % REFER_ALPHABET.length]);
  return chars.slice(0, 4).join("") + "-" + chars.slice(4).join("");
}

function normalizeReferCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) return cleaned;
  return cleaned.slice(0, 4) + "-" + cleaned.slice(4);
}

/* ---------------------------- Invite ---------------------------- */

export const inviteFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email?: string | null; note?: string | null }) =>
    z
      .object({
        email: emailSchema.optional().nullable(),
        note: z.string().trim().min(1).max(60).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const invite_token = newInviteToken();

    // Retry refer-code generation on the very unlikely unique collision.
    let row: any = null;
    let lastErr: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const refer_code = newReferCode();
      const { data: inserted, error } = await supabaseAdmin
        .from("friendships")
        .insert({
          user_a: userId,
          user_b: null,
          requested_by: userId,
          status: "pending",
          invite_email: data.email ?? null,
          invite_token,
          refer_code,
          note_a: data.note ?? null,
        })
        .select()
        .single();
      if (!error) {
        row = inserted;
        break;
      }
      lastErr = error;
      // 23505 = unique violation; retry if it's the refer_code index
      if (error.code !== "23505") throw new Error(error.message);
    }
    if (!row) throw new Error(lastErr?.message ?? "Couldn't create invite.");

    const req = getRequest();
    const origin =
      process.env.PUBLIC_SITE_URL || (req ? new URL(req.url).origin : "https://purplelife.org");
    const acceptUrl = `${origin}/friend/accept?token=${invite_token}`;

    return {
      friendship: row,
      invite_token,
      refer_code: row.refer_code as string,
      acceptUrl,
    };
  });

/* ---------------------------- Accept ---------------------------- */

export const acceptFriendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { invite_token: string }) =>
    z.object({ invite_token: z.string().min(20).max(128) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: row, error } = await supabaseAdmin
      .from("friendships")
      .select("*")
      .eq("invite_token", data.invite_token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This invite link is invalid or has already been used.");
    return acceptPendingRow(row, userId, true);
  });

export const acceptFriendByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().trim().min(4).max(32) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const normalized = normalizeReferCode(data.code);
    const { data: row, error } = await supabaseAdmin
      .from("friendships")
      .select("*")
      .eq("refer_code", normalized)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That code doesn't match an active invite.");
    return acceptPendingRow(row, userId);
  });

async function acceptPendingRow(
  row: { id: string; status: string; user_a: string; invite_email?: string | null },
  userId: string,
  checkEmail = false,
) {
  if (row.status !== "pending") {
    throw new Error("This invite has already been accepted or revoked.");
  }
  if (row.user_a === userId) {
    throw new Error("You can't accept your own invite.");
  }

  if (checkEmail && row.invite_email) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const accepterEmail = (u?.user?.email ?? "").trim().toLowerCase();
    const inviteEmail = String(row.invite_email).trim().toLowerCase();
    if (!accepterEmail || accepterEmail !== inviteEmail) {
      throw new Error("This invite was sent to a different email address.");
    }
  }

  // Prevent duplicate friendships (already linked to inviter, in either direction)
  const inviter = row.user_a;
  const [lo, hi] = inviter < userId ? [inviter, userId] : [userId, inviter];
  const { data: existing } = await supabaseAdmin
    .from("friendships")
    .select("id, status")
    .eq("user_a", lo)
    .eq("user_b", hi)
    .maybeSingle();
  if (existing && existing.id !== row.id) {
    // Drop this duplicate pending row, keep the existing relationship as-is.
    await supabaseAdmin.from("friendships").delete().eq("id", row.id);
    return { ok: true, friendshipId: existing.id, alreadyLinked: true as const };
  }

  const { error: upErr } = await supabaseAdmin
    .from("friendships")
    .update({
      user_b: userId, // trigger will normalize order
      status: "active",
      accepted_at: new Date().toISOString(),
      invite_token: null,
      refer_code: null,
    })
    .eq("id", row.id);
  if (upErr) throw new Error(upErr.message);

  return { ok: true, friendshipId: row.id, alreadyLinked: false as const };
}

/* ---------------------------- List ---------------------------- */

export const listMyCircle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rows, error } = await supabaseAdmin
      .from("friendships")
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId},requested_by.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Hydrate the "other side" display name (profile basic only).
    const otherIds = Array.from(
      new Set(
        (rows ?? [])
          .map((r) => (r.user_a === userId ? r.user_b : r.user_a))
          .filter((v): v is string => !!v),
      ),
    );
    const profiles: Record<string, { first_name: string | null; last_name: string | null }> = {};
    if (otherIds.length > 0) {
      const { data: ps } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", otherIds);
      for (const p of ps ?? []) {
        profiles[p.id] = { first_name: p.first_name, last_name: p.last_name };
      }
    }

    const friendships = (rows ?? []).map((r) => {
      const otherId = r.user_a === userId ? r.user_b : r.user_a;
      const other = otherId ? profiles[otherId] : null;
      const displayName =
        [other?.first_name, other?.last_name].filter(Boolean).join(" ").trim() ||
        r.invite_email ||
        "A friend";
      const myNote = r.user_a === userId ? r.note_a : r.note_b;
      return {
        id: r.id,
        status: r.status as "pending" | "active" | "blocked",
        iInvited: r.requested_by === userId,
        invite_email: r.invite_email,
        invite_token: r.invite_token,
        refer_code: (r as any).refer_code ?? null,
        displayName,
        otherId,
        myNote: myNote ?? null,
        shareBasics: (r as any).share_basics ?? false,
        created_at: r.created_at,
        accepted_at: r.accepted_at,
      };
    });
    return { friendships };
  });

/* ---------------------------- Remove ---------------------------- */

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { friendship_id: string }) =>
    z.object({ friendship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    // RLS scopes the delete to participants only.
    const { error } = await supabase.from("friendships").delete().eq("id", data.friendship_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------------------- Nickname ---------------------------- */

export const setFriendNickname = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { friendship_id: string; note: string | null }) =>
    z
      .object({
        friendship_id: z.string().uuid(),
        note: z.string().trim().min(1).max(60).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row, error } = await supabaseAdmin
      .from("friendships")
      .select("user_a, user_b")
      .eq("id", data.friendship_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Friendship not found.");
    const patch: { note_a?: string | null; note_b?: string | null } =
      row.user_a === userId
        ? { note_a: data.note }
        : row.user_b === userId
          ? { note_b: data.note }
          : {};
    if (Object.keys(patch).length === 0) {
      throw new Error("You're not part of this friendship.");
    }
    const { error: upErr } = await supabaseAdmin
      .from("friendships")
      .update(patch)
      .eq("id", data.friendship_id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

/* -------------------- Social tier (share_basics) -------------------- */

/**
 * The viewer side of an active friendship may, optionally, share a tiny
 * slice of profile info (first name, condition tags). Off by default ,
 * setting this writes `share_basics=true` on the friendship row. The
 * setting is symmetric: if either side turns it on, both sides can see
 * the other's basics via getFriendBasics.
 */
export const setFriendShareBasics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { friendship_id: string; enabled: boolean }) =>
    z
      .object({
        friendship_id: z.string().uuid(),
        enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row, error } = await supabaseAdmin
      .from("friendships")
      .select("user_a, user_b, status")
      .eq("id", data.friendship_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Friendship not found.");
    if (row.user_a !== userId && row.user_b !== userId) {
      throw new Error("You're not part of this friendship.");
    }
    if (row.status !== "active") {
      throw new Error("Both sides need to accept first.");
    }
    const { error: upErr } = await supabaseAdmin
      .from("friendships")
      .update({ share_basics: data.enabled })
      .eq("id", data.friendship_id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true, enabled: data.enabled };
  });

/**
 * Returns the tiny slice of profile info the friend has opted to share.
 * Throws when share_basics is off, or when the caller isn't a participant.
 * Never returns health data.
 */
export const getFriendBasics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { friendship_id: string }) =>
    z.object({ friendship_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row, error } = await supabaseAdmin
      .from("friendships")
      .select("user_a, user_b, status, share_basics")
      .eq("id", data.friendship_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Friendship not found.");
    if (row.user_a !== userId && row.user_b !== userId) {
      throw new Error("You're not part of this friendship.");
    }
    if (row.status !== "active") {
      throw new Error("This friendship isn't active yet.");
    }
    if (!(row as any).share_basics) {
      return { shared: false as const };
    }
    const otherId = row.user_a === userId ? row.user_b : row.user_a;
    if (!otherId) return { shared: false as const };
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, avatar_url, conditions, country")
      .eq("id", otherId)
      .maybeSingle();
    return {
      shared: true as const,
      basics: {
        first_name: (p as any)?.first_name ?? null,
        last_name: (p as any)?.last_name ?? null,
        avatar_url: (p as any)?.avatar_url ?? null,
        conditions: ((p as any)?.conditions ?? []) as string[],
        country: (p as any)?.country ?? null,
      },
    };
  });
