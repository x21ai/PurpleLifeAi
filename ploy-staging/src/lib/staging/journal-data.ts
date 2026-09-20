import { stagingFrom } from "./api-query";

export type JournalEntryRow = {
  id: string;
  captured_at: string;
  created_at: string;
  kind: string;
  status: string;
  text: string | null;
  voice_transcript: string | null;
  ai_summary: string | null;
};

export type JournalListItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "sleep" | "symptom" | "photo" | "note";
};

const KIND_TO_TYPE: Record<string, JournalListItem["type"]> = {
  sleep: "sleep",
  symptom: "symptom",
  photo: "photo",
  image: "photo",
  voice: "note",
  text: "note",
  general: "note",
  medication: "note",
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  if (Number.isNaN(then)) return iso;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    sleep: "Sleep",
    symptom: "Symptom",
    photo: "Photo",
    image: "Photo",
    voice: "Voice note",
    text: "Note",
    general: "Note",
    medication: "Medication",
  };
  return map[kind] ?? "Entry";
}

export function mapJournalRow(row: JournalEntryRow): JournalListItem {
  const snippet =
    row.text?.trim() ||
    row.voice_transcript?.trim() ||
    row.ai_summary?.trim() ||
    kindLabel(row.kind);
  const title = snippet.length > 80 ? `${snippet.slice(0, 77)}…` : snippet;
  return {
    id: row.id,
    title,
    detail: kindLabel(row.kind),
    time: formatRelativeTime(row.captured_at || row.created_at),
    type: KIND_TO_TYPE[row.kind] ?? "note",
  };
}

export async function fetchJournalEntries(limit = 100): Promise<{
  entries: JournalListItem[];
  total: number;
}> {
  const { data, error } = await stagingFrom("journal_entries")
    .select("id, captured_at, created_at, kind, status, text, voice_transcript, ai_summary")
    .order("captured_at", { ascending: false })
    .limit(limit)
    .list();

  if (error) return { entries: [], total: 0 };
  const rows = (data ?? []) as JournalEntryRow[];
  const entries = rows.map(mapJournalRow);
  return { entries, total: entries.length };
}

export async function createJournalEntry(input: {
  text: string;
  kind?: string;
  capturedAt?: string;
}): Promise<{ id: string | null; error: Error | null }> {
  const id = crypto.randomUUID();
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const { data, error } = await stagingFrom("journal_entries")
    .insert({
      id,
      kind: input.kind ?? "text",
      status: "processing",
      captured_at: capturedAt,
      text: input.text.trim() || null,
      voice_transcript: null,
      media_urls: "[]",
      ai_tags: "[]",
    })
    .list();

  if (error) return { id: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { id: (row as { id?: string } | null)?.id ?? id, error: null };
}
