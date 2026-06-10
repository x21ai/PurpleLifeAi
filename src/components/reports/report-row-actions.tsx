import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, ExternalLink, Link2, Loader2, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getReportFileUrl, getReportShareUrl, processReport, deleteReport } from "@/lib/reports.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Inline View / Download actions for a row in the documents list.
 * Re-signs the URL on demand so links are never stale.
 */
export function ReportRowActions({
  reportId,
  status,
  onChanged,
}: {
  reportId: string;
  status?: string;
  onChanged?: () => void;
}) {
  const fetchUrl = useServerFn(getReportFileUrl);
  const fetchShare = useServerFn(getReportShareUrl);
  const reprocess = useServerFn(processReport);
  const remove = useServerFn(deleteReport);
  const [busy, setBusy] = React.useState<null | "view" | "download" | "share" | "retry" | "delete">(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const failed = status === "failed" || status === "needs_credits" || status === "rate_limited";

  async function openFile(kind: "view" | "download") {
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

  async function retry() {
    setBusy("retry");
    try {
      await reprocess({ data: { reportId } });
      toast.success("Re-running extraction…");
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't re-run extraction");
    } finally {
      setBusy(null);
    }
  }

  async function shareLink() {
    setBusy("share");
    try {
      const { url, expiresInDays } = await fetchShare({ data: { id: reportId } });
      try {
        await navigator.clipboard.writeText(url);
        toast.success(`Share link copied — expires in ${expiresInDays} days`);
      } catch {
        window.prompt("Share link (expires in 7 days)", url);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create share link");
    } finally {
      setBusy(null);
    }
  }
    setBusy("retry");
    try {
      await reprocess({ data: { reportId } });
      toast.success("Re-running extraction…");
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't re-run extraction");
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    setBusy("delete");
    try {
      await remove({ data: { id: reportId } });
      toast.success("Report deleted");
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete report");
    } finally {
      setBusy(null);
      setConfirmOpen(false);
    }
  }

  const triggerCls =
    "inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50";

  return (
    <div
      className="flex items-center shrink-0"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy !== null}
            title="Actions"
            aria-label="Actions"
            className={triggerCls}
          >
            {busy !== null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => void openFile("view")}>
            <ExternalLink className="h-4 w-4 mr-2" /> View PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void openFile("download")}>
            <Download className="h-4 w-4 mr-2" /> Download
          </DropdownMenuItem>
          {failed && (
            <DropdownMenuItem onSelect={() => void retry()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Re-run extraction
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              The file and any extracted values will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "delete"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void doDelete();
              }}
              disabled={busy === "delete"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy === "delete" ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}