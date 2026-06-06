/**
 * Tiny localStorage-backed queue for text-only journal entries captured
 * while offline. Media uploads still require connectivity, so this is
 * limited to plain text/voice-transcript entries.
 */
import { supabase } from "@/integrations/supabase/client";

const KEY = "purple.offline.journal.queue.v1";

export type QueuedEntry = {
  id: string; // client-side id
  userId: string;
  kind: string;
  text: string | null;
  voiceTranscript: string | null;
  capturedAt: string; // ISO
};

function read(): QueuedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: QueuedEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent("purple:offline-journal-changed"));
  } catch {
    // quota / private mode, swallow
  }
}

export function getQueuedEntries(): QueuedEntry[] {
  return read();
}

export function queueEntry(input: Omit<QueuedEntry, "id" | "capturedAt"> & {
  capturedAt?: string;
}): QueuedEntry {
  const entry: QueuedEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: input.userId,
    kind: input.kind,
    text: input.text,
    voiceTranscript: input.voiceTranscript,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  };
  const all = read();
  all.push(entry);
  write(all);
  return entry;
}

export function removeQueuedEntry(id: string) {
  write(read().filter((e) => e.id !== id));
}

export async function flushOfflineJournalQueue(): Promise<{
  sent: number;
  failed: number;
}> {
  const pending = read();
  if (pending.length === 0) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  for (const entry of pending) {
    try {
      const { error } = await supabase.from("journal_entries").insert({
        user_id: entry.userId,
        kind: entry.kind,
        status: "processing",
        text: entry.text,
        voice_transcript: entry.voiceTranscript,
        captured_at: entry.capturedAt,
      });
      if (error) {
        failed += 1;
        continue;
      }
      removeQueuedEntry(entry.id);
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed };
}