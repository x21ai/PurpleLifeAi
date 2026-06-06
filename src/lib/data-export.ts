import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Array.from(
    rows.reduce<Set<string>>((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set()),
  );
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return `${head}\n${body}\n`;
}

function safeFile(s: string): string {
  return s.replace(/[^a-z0-9-_]/gi, "_");
}

export async function exportAllUserData(): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const user = sess.session?.user;
  if (!user) throw new Error("Not signed in");

  const zip = new JSZip();

  const [profile, journal, biometrics, meds, doses, seizures, forecasts, alerts] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("journal_entries").select("*").eq("user_id", user.id).order("captured_at"),
    supabase.from("biometrics").select("*").eq("user_id", user.id).order("recorded_at"),
    supabase.from("medications").select("*").eq("user_id", user.id),
    supabase.from("medication_doses").select("*").eq("user_id", user.id).order("scheduled_at"),
    supabase.from("seizure_events").select("*").eq("user_id", user.id).order("started_at"),
    supabase.from("risk_forecasts").select("*").eq("user_id", user.id).order("for_date"),
    supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at"),
  ]);

  zip.file("README.md", [
    "# Your Purple export",
    "",
    `Exported ${new Date().toISOString()} for ${user.email ?? user.id}.`,
    "",
    "Folders:",
    "- journal/, one markdown file per entry",
    "- biometrics.csv, every biometric reading we have on file",
    "- medications.json, your medication list",
    "- medication_doses.json, every scheduled, taken, missed, or skipped dose",
    "- seizures.json, every event you have logged",
    "- profile.json, risk_forecasts.json, alerts.json, supporting context",
    "",
    "Your data is yours. Take it with you anywhere.",
  ].join("\n"));

  zip.file("profile.json", JSON.stringify(profile.data ?? null, null, 2));
  zip.file("biometrics.csv", toCsv((biometrics.data ?? []) as Record<string, unknown>[]));
  zip.file("medications.json", JSON.stringify(meds.data ?? [], null, 2));
  zip.file("medication_doses.json", JSON.stringify(doses.data ?? [], null, 2));
  zip.file("seizures.json", JSON.stringify(seizures.data ?? [], null, 2));
  zip.file("risk_forecasts.json", JSON.stringify(forecasts.data ?? [], null, 2));
  zip.file("alerts.json", JSON.stringify(alerts.data ?? [], null, 2));

  const journalDir = zip.folder("journal")!;
  for (const entry of (journal.data ?? []) as Array<Record<string, any>>) {
    const date = new Date(entry.captured_at);
    const slug = `${date.toISOString().slice(0, 10)}_${safeFile(entry.id).slice(0, 8)}`;
    const lines: string[] = [];
    lines.push(`# ${date.toLocaleString()}`);
    lines.push("");
    if (entry.ai_tags?.length) lines.push(`Tags: ${entry.ai_tags.join(", ")}`);
    lines.push(`Kind: ${entry.kind} · Status: ${entry.status}`);
    lines.push("");
    if (entry.text) {
      lines.push("## Text");
      lines.push(entry.text);
      lines.push("");
    }
    if (entry.voice_transcript) {
      lines.push("## Voice transcript");
      lines.push(entry.voice_transcript);
      lines.push("");
    }
    if (entry.ai_summary) {
      lines.push("## AI summary");
      lines.push(entry.ai_summary);
      lines.push("");
    }
    if (entry.media_urls?.length) {
      lines.push("## Media");
      for (const url of entry.media_urls) lines.push(`![](${url})`);
      lines.push("");
    }
    journalDir.file(`${slug}.md`, lines.join("\n"));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `purple-export-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function deleteAllUserData(): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const user = sess.session?.user;
  if (!user) throw new Error("Not signed in");

  // Best-effort: delete rows in all per-user tables. RLS scopes to this user.
  const tables: Array<[string, string]> = [
    ["ai_memory", "user_id"],
    ["alerts", "user_id"],
    ["biometrics", "user_id"],
    ["journal_entries", "user_id"],
    ["medication_doses", "user_id"],
    ["medications", "user_id"],
    ["oura_tokens", "user_id"],
    ["whoop_tokens", "user_id"],
    ["risk_forecasts", "user_id"],
    ["seizure_events", "user_id"],
    ["profiles", "id"],
  ];
  for (const [t, col] of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(t as any) as any).delete().eq(col, user.id);
  }
}

/** How many days users have to undo a "delete everything" before purge. */
export const RESTORE_WINDOW_DAYS = 60;

/**
 * Soft-delete: marks the profile with a deletion request and a purge date
 * 60 days in the future. The user is then signed out by the caller. They
 * can sign back in within the window to restore. Requires the user's
 * password to be re-entered (verified by re-authenticating).
 */
export async function softDeleteUserData(password: string): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const user = sess.session?.user;
  if (!user?.email) throw new Error("Not signed in");

  // Re-validate password by re-signing in. This does not invalidate the
  // existing session, but throws if the password is wrong.
  const { error: pwErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (pwErr) throw new Error("Password is incorrect");

  const now = new Date();
  const purgeAfter = new Date(
    now.getTime() + RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const { error } = await supabase
    .from("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ deleted_at: now.toISOString(), purge_after: purgeAfter.toISOString() } as any)
    .eq("id", user.id);
  if (error) throw new Error(error.message);
}

/** Clear the deletion request, restores full access. */
export async function restoreUserData(): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const user = sess.session?.user;
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ deleted_at: null, purge_after: null } as any)
    .eq("id", user.id);
  if (error) throw new Error(error.message);
}

export type DeletionStatus = { deletedAt: string; purgeAfter: string | null };

/** Returns deletion status if the user has a pending soft-delete, else null. */
export async function checkDeletionStatus(
  userId: string,
): Promise<DeletionStatus | null> {
  const { data } = await supabase
    .from("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("deleted_at, purge_after" as any)
    .eq("id", userId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  if (!row?.deleted_at) return null;
  return { deletedAt: row.deleted_at, purgeAfter: row.purge_after ?? null };
}