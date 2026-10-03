/**
 * Short poll for care-chat inserts. Cloudflare has no Postgres realtime.
 * Callers subscribe and append rows newer than `since` without a reload.
 */
import { d1All, d1First } from "../d1/client";

export type CareLiveMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  body: string | null;
  attachments: unknown;
  created_at: string;
  deleted_at: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parsePayload(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return asRecord(JSON.parse(raw)) ?? {};
    } catch {
      return {};
    }
  }
  return asRecord(raw) ?? {};
}

function messageFromRow(row: Record<string, unknown>): CareLiveMessage | null {
  const payload = parsePayload(row.payload);
  const id = String(row.id ?? payload.id ?? "");
  const threadId = String(row.thread_id ?? payload.thread_id ?? "");
  if (!id || !threadId) return null;
  const created = String(row.created_at ?? payload.created_at ?? "");
  return {
    id,
    thread_id: threadId,
    sender_id: (row.sender_id ?? payload.sender_id ?? null) as string | null,
    body: (row.body ?? payload.body ?? null) as string | null,
    attachments: row.attachments ?? payload.attachments ?? [],
    created_at: created,
    deleted_at: (row.deleted_at ?? payload.deleted_at ?? null) as string | null,
  };
}

async function isParticipant(threadId: string, userId: string): Promise<boolean> {
  try {
    const row = await d1First<{ thread_id?: string; user_id?: string }>(
      `SELECT thread_id, user_id FROM care_thread_participants
       WHERE thread_id = ? AND user_id = ? LIMIT 1`,
      threadId,
      userId,
    );
    return Boolean(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/no such column/i.test(message)) throw error;
  }

  const rows = await d1All<Record<string, unknown>>(
    `SELECT user_id, payload FROM care_thread_participants WHERE user_id = ? LIMIT 200`,
    userId,
  );
  return rows.some((row) => {
    const payload = parsePayload(row.payload);
    const thread = String(row.thread_id ?? payload.thread_id ?? "");
    return thread === threadId;
  });
}

export async function listCareMessagesSince(input: {
  userId: string;
  threadId: string;
  since?: string | null;
}): Promise<CareLiveMessage[] | { error: string; status: number }> {
  const threadId = input.threadId.trim();
  if (!threadId) return { error: "threadId required", status: 400 };
  const allowed = await isParticipant(threadId, input.userId);
  if (!allowed) return { error: "Not found", status: 404 };

  const since = input.since?.trim() || "1970-01-01T00:00:00.000Z";
  try {
    const rows = await d1All<Record<string, unknown>>(
      `SELECT id, thread_id, sender_id, body, attachments, created_at, deleted_at
       FROM care_messages
       WHERE thread_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT 50`,
      threadId,
      since,
    );
    return rows
      .map(messageFromRow)
      .filter((row): row is CareLiveMessage => row != null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/no such column/i.test(message)) throw error;
  }

  const rows = await d1All<Record<string, unknown>>(
    `SELECT id, user_id, payload, created_at FROM care_messages
     WHERE created_at > ?
     ORDER BY created_at ASC
     LIMIT 200`,
    since,
  );
  return rows
    .map(messageFromRow)
    .filter((row): row is CareLiveMessage => row != null && row.thread_id === threadId)
    .slice(0, 50);
}
