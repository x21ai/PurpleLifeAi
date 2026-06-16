import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  exportAuthUsers,
  exportStorageManifest,
  exportAllTablesZip,
} from "@/lib/migration-export.functions";

export const Route = createFileRoute("/_app/admin/migration-export")({
  head: () => ({ meta: [{ title: "Migration export · Purple" }] }),
  component: MigrationExportPage,
});

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(filename, blob);
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function base64ToBlob(base64: string, type: string): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

function MigrationExportPage() {
  const runAuth = useServerFn(exportAuthUsers);
  const runStorage = useServerFn(exportStorageManifest);
  const runAllTables = useServerFn(exportAllTablesZip);
  const [status, setStatus] = React.useState<string>("");
  const [busy, setBusy] = React.useState<null | "auth" | "storage" | "tables">(
    null,
  );

  async function handleAuth() {
    setBusy("auth");
    setStatus("Exporting auth.users...");
    try {
      const res: any = await runAuth();
      download("auth-users.json", res);
      setStatus(`Downloaded auth-users.json (${res.count} users).`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleStorage() {
    setBusy("storage");
    setStatus("Listing buckets and signing URLs (this can take a minute)...");
    try {
      const res: any = await runStorage();
      download("storage-manifest.json", res);
      setStatus(
        `Downloaded storage-manifest.json (${res.count} objects, ${(res.totalBytes / 1024 / 1024).toFixed(1)} MB).`,
      );
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleTables() {
    setBusy("tables");
    setStatus("Exporting all public tables to CSV zip (this may take a few minutes)...");
    try {
      const res: any = await runAllTables();
      const blob = base64ToBlob(res.base64, "application/zip");
      triggerDownload(res.filename, blob);
      const errMsg = res.errors?.length
        ? ` (with ${res.errors.length} table error(s): ${res.errors.map((e: any) => e.table).join(", ")})`
        : "";
      setStatus(
        `Downloaded ${res.filename}: ${res.table_count} tables, ${res.total_rows} rows, ${(res.bytes / 1024 / 1024).toFixed(2)} MB${errMsg}.`,
      );
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Migration export</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One-shot exports for moving Purple off Lovable Cloud. Super-admin
          only. Both files download to your machine. Signed storage URLs are
          valid for 7 days; re-run if your migration script does not finish in
          that window.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">1. Auth users</h2>
        <p className="text-muted-foreground text-sm">
          Exports every <code>auth.users</code> row (id, email, metadata) so
          the import script can recreate them in the new project with the
          same UUIDs.
        </p>
        <button
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={handleAuth}
          disabled={busy !== null}
        >
          {busy === "auth" ? "Exporting..." : "Download auth-users.json"}
        </button>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">2. Storage manifest</h2>
        <p className="text-muted-foreground text-sm">
          Lists every object in journal-media, reports, medical-reports,
          care-chat-attachments, and dna-uploads, and signs each one for 7
          days. The local migrate-storage script streams these to the new
          project.
        </p>
        <button
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={handleStorage}
          disabled={busy !== null}
        >
          {busy === "storage" ? "Exporting..." : "Download storage-manifest.json"}
        </button>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">3. All public tables (CSV zip)</h2>
        <p className="text-muted-foreground text-sm">
          Dumps every row of every public table to CSV using the service role
          (RLS bypassed). Includes <code>row-counts-source.txt</code> for the
          cutover verifier. No database password required.
        </p>
        <button
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={handleTables}
          disabled={busy !== null}
        >
          {busy === "tables" ? "Exporting..." : "Download all-tables.zip"}
        </button>
      </section>

      {status ? (
        <p className="text-muted-foreground text-sm" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}