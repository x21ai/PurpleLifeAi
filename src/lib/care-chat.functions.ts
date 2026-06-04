import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** List threads the current user participates in, with previews + unread counts. */
export const listCareThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: parts, error: pErr } = await supabaseAdmin
      .from("care_thread_participants")
      .select("thread_id, role, last_read_at, muted, muted_until")
      .eq("user_id", userId);
    if (pErr) throw new Error(pErr.message);
    if (!parts || parts.length === 0) return { threads: [] as Array<any> };

    const threadIds = parts.map((p) => p.thread_id);
    const lastReadByThread = new Map(parts.map((p) => [p.thread_id, p.last_read_at]));
    const muteByThread = new Map(
      parts.map((p) => {
        const until = p.muted_until ? new Date(p.muted_until).getTime() : 0;
        const active = p.muted || (until > 0 && until > Date.now());
        return [p.thread_id, active];
      }),
    );

    const { data: threads, error: tErr } = await supabaseAdmin
      .from("care_threads")
      .select("id, owner_id, kind, relationship_id, title, last_message_at, created_at")
      .in("id", threadIds)
      .order("last_message_at", { ascending: false });
    if (tErr) throw new Error(tErr.message);

    // Collect all participants for these threads (for names + group rosters)
    const { data: allParts } = await supabaseAdmin
      .from("care_thread_participants")
      .select("thread_id, user_id, role")
      .in("thread_id", threadIds);

    const userIds = Array.from(new Set((allParts ?? []).map((p) => p.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Last message per thread
    const { data: lastMsgs } = await supabaseAdmin
      .from("care_messages")
      .select("thread_id, sender_id, body, created_at")
      .in("thread_id", threadIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    const lastByThread = new Map<string, any>();
    for (const m of lastMsgs ?? []) {
      if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
    }

    // Unread counts
    const unreadByThread = new Map<string, number>();
    for (const t of threads ?? []) {
      const since = lastReadByThread.get(t.id);
      const { count } = await supabaseAdmin
        .from("care_messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", t.id)
        .neq("sender_id", userId)
        .is("deleted_at", null)
        .gt("created_at", since ?? "1970-01-01T00:00:00Z");
      unreadByThread.set(t.id, count ?? 0);
    }

    const enriched = (threads ?? []).map((t) => {
      const ps = (allParts ?? []).filter((p) => p.thread_id === t.id);
      const others = ps
        .filter((p) => p.user_id !== userId)
        .map((p) => {
          const pr = profileById.get(p.user_id);
          const name = pr
            ? [pr.first_name, pr.last_name].filter(Boolean).join(" ").trim() ||
              "Unnamed"
            : "Unnamed";
          return { user_id: p.user_id, name, role: p.role };
        });
      const last = lastByThread.get(t.id);
      return {
        id: t.id,
        owner_id: t.owner_id,
        kind: t.kind as "direct" | "group",
        relationship_id: t.relationship_id,
        title: t.title,
        last_message_at: t.last_message_at,
        others,
        last_message: last
          ? { body: last.body, sender_id: last.sender_id, created_at: last.created_at }
          : null,
        unread: unreadByThread.get(t.id) ?? 0,
        muted: muteByThread.get(t.id) ?? false,
      };
    });

    return { threads: enriched };
  });

/** Total unread care-chat messages across all threads for the current user. */
export const getCareChatUnreadTotal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: parts } = await supabaseAdmin
      .from("care_thread_participants")
      .select("thread_id, last_read_at")
      .eq("user_id", userId);
    if (!parts || parts.length === 0) return { total: 0 };
    let total = 0;
    for (const p of parts) {
      const { count } = await supabaseAdmin
        .from("care_messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", p.thread_id)
        .neq("sender_id", userId)
        .is("deleted_at", null)
        .gt("created_at", p.last_read_at ?? "1970-01-01T00:00:00Z");
      total += count ?? 0;
    }
    return { total };
  });

/** Open or create a 1:1 thread for a given care_relationships row. */
export const getOrCreateDirectThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { relationshipId: string }) =>
    z.object({ relationshipId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rel, error } = await supabaseAdmin
      .from("care_relationships")
      .select("id, owner_id, caregiver_id, status")
      .eq("id", data.relationshipId)
      .single();
    if (error || !rel) throw new Error("Relationship not found");
    if (rel.owner_id !== userId && rel.caregiver_id !== userId) {
      throw new Error("Not authorized");
    }
    if (rel.status !== "active" || !rel.caregiver_id) {
      throw new Error("Relationship is not active");
    }

    const { data: existing } = await supabaseAdmin
      .from("care_threads")
      .select("id")
      .eq("owner_id", rel.owner_id)
      .eq("relationship_id", rel.id)
      .eq("kind", "direct")
      .maybeSingle();
    if (existing) return { threadId: existing.id };

    const { data: created, error: cErr } = await supabaseAdmin
      .from("care_threads")
      .insert({
        owner_id: rel.owner_id,
        kind: "direct",
        relationship_id: rel.id,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);

    const { error: pErr } = await supabaseAdmin
      .from("care_thread_participants")
      .insert([
        { thread_id: created.id, user_id: rel.owner_id, role: "owner" },
        { thread_id: created.id, user_id: rel.caregiver_id, role: "caregiver" },
      ]);
    if (pErr) throw new Error(pErr.message);

    return { threadId: created.id };
  });

/** Owner-only: open or create the single group thread that includes all active caregivers. */
export const getOrCreateGroupThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: existing } = await supabaseAdmin
      .from("care_threads")
      .select("id")
      .eq("owner_id", userId)
      .eq("kind", "group")
      .maybeSingle();

    const { data: rels } = await supabaseAdmin
      .from("care_relationships")
      .select("caregiver_id, status")
      .eq("owner_id", userId)
      .eq("status", "active");
    const caregiverIds = Array.from(
      new Set((rels ?? []).map((r) => r.caregiver_id).filter((id): id is string => !!id)),
    );

    let threadId: string;
    if (existing) {
      threadId = existing.id;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("care_threads")
        .insert({ owner_id: userId, kind: "group", title: "Care team" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      threadId = created.id;
      await supabaseAdmin
        .from("care_thread_participants")
        .insert({ thread_id: threadId, user_id: userId, role: "owner" });
    }

    // Sync participants: ensure each active caregiver is in the thread.
    if (caregiverIds.length > 0) {
      const { data: currentParts } = await supabaseAdmin
        .from("care_thread_participants")
        .select("user_id")
        .eq("thread_id", threadId);
      const have = new Set((currentParts ?? []).map((p) => p.user_id));
      const toAdd = caregiverIds
        .filter((id) => !have.has(id))
        .map((id) => ({ thread_id: threadId, user_id: id, role: "caregiver" as const }));
      if (toAdd.length > 0) {
        await supabaseAdmin.from("care_thread_participants").insert(toAdd);
      }
    }

    return { threadId };
  });

/** Paginated messages for a thread (newest last). */
export const getCareMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string; limit?: number; before?: string }) =>
    z
      .object({
        threadId: z.string().uuid(),
        limit: z.number().int().min(1).max(200).optional(),
        before: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const limit = data.limit ?? 100;

    const { data: part } = await supabaseAdmin
      .from("care_thread_participants")
      .select("thread_id")
      .eq("thread_id", data.threadId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!part) throw new Error("Not a participant");

    let query = supabaseAdmin
      .from("care_messages")
      .select("id, thread_id, sender_id, body, attachments, created_at, deleted_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.before) query = query.lt("created_at", data.before);
    const { data: msgs, error } = await query;
    if (error) throw new Error(error.message);

    return { messages: (msgs ?? []).slice().reverse() };
  });

/** Send a message to a thread. */
export const sendCareMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string; body: string }) =>
    z
      .object({
        threadId: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: part } = await supabaseAdmin
      .from("care_thread_participants")
      .select("thread_id")
      .eq("thread_id", data.threadId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!part) throw new Error("Not a participant");

    const { data: msg, error } = await supabaseAdmin
      .from("care_messages")
      .insert({
        thread_id: data.threadId,
        sender_id: userId,
        body: data.body,
      })
      .select("id, thread_id, sender_id, body, attachments, created_at, deleted_at")
      .single();
    if (error) throw new Error(error.message);

    // Mark the sender as read up to now.
    await supabaseAdmin
      .from("care_thread_participants")
      .update({ last_read_at: msg.created_at })
      .eq("thread_id", data.threadId)
      .eq("user_id", userId);

    return { message: msg };
  });

/** Mark a thread as read up to now. */
export const markCareThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string }) =>
    z.object({ threadId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("care_thread_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("thread_id", data.threadId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });