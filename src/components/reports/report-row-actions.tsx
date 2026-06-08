import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getReportFileUrl } from "@/lib/reports.functions";

/**
 * Inline View / Download actions for a row in the documents list.
 * Re-signs the URL on demand so links are never stale.
 */
export function ReportRowActions({ reportId }: { reportId: string }) {
  const fetchUrl = useServerFn(getReportFileUrl);
  const [busy, setBusy] = React.useState<"view" | "download" | null>(null);

  async function run(kind: "view" | "download", e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(kind);
    try {
      const { url, title } = await fetchUrl({ data: { id: reportId } });
      if (kind === "view") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = title ?? "report";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open file");
    } finally {
      setBusy(null);
    }
  }

  const btn = "inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50";

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={(e) => void run("view", e)}
        disabled={busy !== null}
        title="Open PDF"
        aria-label="Open PDF"
        className={btn}
      >
        {busy === "view" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={(e) => void run("download", e)}
        disabled={busy !== null}
        title="Download"
        aria-label="Download"
        className={btn}
      >
        {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </button>
    </div>
  );
}