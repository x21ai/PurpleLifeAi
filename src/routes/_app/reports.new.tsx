import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Loader2, X, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { processReport } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ReportShell, ReportCard } from "@/components/reports/report-shell";

export const Route = createFileRoute("/_app/reports/new")({
  head: () => ({ meta: [{ title: "Upload report · Purple" }] }),
  component: UploadReportPage,
});

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ACCEPT = "application/pdf,image/jpeg,image/png,image/heic,image/webp";

function UploadReportPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigate = useNavigate();
  const triggerProcess = useServerFn(processReport);

  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const tooBig = arr.filter((f) => f.size > MAX_SIZE);
    const ok = arr.filter((f) => f.size <= MAX_SIZE);
    if (tooBig.length > 0) {
      toast.error(`${tooBig.length} file${tooBig.length === 1 ? "" : "s"} skipped, over 15 MB`);
    }
    setFiles((prev) => [...prev, ...ok]);
  };

  const removeAt = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!userId) return;
    if (files.length === 0) {
      toast.error("Pick at least one file");
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
          const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("reports").upload(path, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });
          if (upErr) throw upErr;

          // Placeholder title from filename; AI will overwrite once it reads the doc.
          const placeholderTitle = file.name.replace(/\.[^.]+$/, "").slice(0, 200);

          const { data: doc, error: insErr } = await supabase
            .from("report_documents")
            .insert({
              user_id: userId,
              title: placeholderTitle || "Untitled report",
              file_path: path,
              file_mime: file.type || "application/octet-stream",
              status: "processing",
            })
            .select("id")
            .single();
          if (insErr || !doc) throw insErr ?? new Error("Insert failed");

          // Fire AI extraction. We await so we can surface decision-memory
          // blocks (e.g. "previously rejected") inline before navigating.
          try {
            const res = await triggerProcess({ data: { reportId: doc.id } });
            const blocked = (res as { blocked?: string } | undefined)?.blocked;
            if (blocked === "previously_rejected") {
              return { blocked: "previously_rejected" as const, name: file.name };
            }
          } catch (e) {
            console.error("processReport failed", e);
          }
          return { ok: true as const, name: file.name };
        }),
      );
      const fulfilled = results.filter((r) => r.status === "fulfilled") as Array<
        PromiseFulfilledResult<{ blocked?: "previously_rejected"; ok?: true; name?: string }>
      >;
      const blockedCount = fulfilled.filter(
        (r) => r.value?.blocked === "previously_rejected",
      ).length;
      const okCount = fulfilled.length - blockedCount;
      const failCount = results.length - fulfilled.length;
      if (okCount > 0) {
        toast.success(
          `${okCount} report${okCount === 1 ? "" : "s"} uploading · Purple is reading ${okCount === 1 ? "it" : "them"} now`,
        );
      }
      if (blockedCount > 0) {
        toast.info(
          `${blockedCount} file${blockedCount === 1 ? "" : "s"} matched a report you previously rejected, not re-added.`,
        );
      }
      if (failCount > 0) {
        toast.error(`${failCount} file${failCount === 1 ? "" : "s"} failed to upload`);
      }
      if (okCount > 0) navigate({ to: "/reports/documents" });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ReportShell
      title="Upload report"
      back={{ to: "/reports/documents", label: t("reportsNew.back") }}
    >
      <section className="report-card-strong p-6 sm:p-8">
        <p className="report-eyebrow text-white/70">Add a report</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl text-white leading-tight">
          {t("reportsNew.title")}
        </h2>
        <p className="mt-3 text-[15px] text-white/65 max-w-[520px]">
          Drop one or more PDF / JPG / PNG files. Purple reads each one and fills in the title,
          date, and values automatically. Extraction typically takes under a minute.
        </p>
      </section>

      <section className="mt-6 report-card p-5 sm:p-6 space-y-4">
        <label
          htmlFor="r-files"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-[#5CE0AC] bg-[#5CE0AC]/5"
              : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]",
          )}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/80">
            <Upload className="h-5 w-5" />
          </span>
          <p className="text-[15px] text-white mt-2">
            Drop files here, or <span className="text-[#5CE0AC] underline">browse</span>
          </p>
          <p className="text-xs text-white/55">
            PDF, JPG, PNG, HEIC, WEBP · 15 MB each · multiple files OK
          </p>
          <input
            id="r-files"
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5"
              >
                <FileText className="h-4 w-4 text-white/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{f.name}</p>
                  <p className="text-[11px] text-white/55">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  disabled={uploading}
                  className="rounded-full p-1 text-white/55 hover:bg-white/5 hover:text-white"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2">
          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="rounded-full bg-white text-[#07090C] hover:bg-white/90 disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {files.length > 1 ? `Upload ${files.length} reports` : "Upload and extract"}
          </Button>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        <ReportCard>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/75 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-white text-base font-medium">Stored privately</h3>
              <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
                Your file is encrypted at rest and only readable through a short-lived link to you.
                You can delete the file and its extracted values from the report's page at any time.
              </p>
            </div>
          </div>
        </ReportCard>
        <ReportCard>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/75 shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-white text-base font-medium">How Purple reads it</h3>
              <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
                Once uploaded, Purple extracts title, date, panels, and structured values. You will
                see the report appear as "Extracting…" and update to "Ready" automatically when it's
                done.
              </p>
            </div>
          </div>
        </ReportCard>
        <MedicalDisclaimer className="text-white/70 [&_*]:text-white/70" />
      </div>
    </ReportShell>
  );
}
