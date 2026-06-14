import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  exportAuthUsers,
  exportStorageManifest,
} from "@/lib/migration-export.functions";

export const Route = createFileRoute("/_app/admin/migration-export")({
  head: () => ({ meta: [{ title: "Migration export · Purple" }] }),
  component: MigrationExportPage,
});

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function MigrationExportPage() {
  const runAuth = useServerFn(exportAuthUsers);
  const runStorage = useServerFn(exportStorageManifest);
  const [status, setStatus] = React.useState<string>("");
  const [busy, setBusy] = React.useState<null | "auth" | "storage">(null);

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

      {status ? (
        <p className="text-muted-foreground text-sm" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}