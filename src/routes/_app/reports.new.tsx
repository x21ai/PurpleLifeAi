import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Upload, Loader2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { processReport } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reports/new")({
  head: () => ({ meta: [{ title: "Upload report · Purple" }] }),
  component: UploadReportPage,
});

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ACCEPT = "application/pdf,image/jpeg,image/png,image/heic,image/webp";

function UploadReportPage() {
  useRouteTheme("light");
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
      toast.error(
        `${tooBig.length} file${tooBig.length === 1 ? "" : "s"} skipped — over 15 MB`,
      );
    }
    setFiles((prev) => [...prev, ...ok]);
  };

  const removeAt = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

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
          const { error: upErr } = await supabase.storage
            .from("reports")
            .upload(path, file, {
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

          // Fire AI extraction; don't await — UX shows "processing" on the list page.
          void triggerProcess({ data: { reportId: doc.id } }).catch((e) => {
            console.error("processReport failed", e);
          });
        }),
      );
      const okCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - okCount;
      if (okCount > 0) {
        toast.success(
          `${okCount} report${okCount === 1 ? "" : "s"} uploading · Purple is reading ${okCount === 1 ? "it" : "them"} now`,
        );
      }
      if (failCount > 0) {
        toast.error(`${failCount} file${failCount === 1 ? "" : "s"} failed to upload`);
      }
      if (okCount > 0) navigate({ to: "/reports" });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <Link
        to="/reports"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-1"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {t("reportsNew.back")}
      </Link>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground">{t("reportsNew.title")}</h1>
      <p className="mt-3 text-foreground/75">
        Drop one or more PDF / JPG / PNG files. Purple reads each one and fills in
        the title, date, and values automatically.
      </p>

      <MedicalDisclaimer className="mt-6" />

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
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
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-background/40 hover:bg-secondary/30",
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-foreground">
            Drop files here, or <span className="text-primary underline">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">
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
                className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  disabled={uploading}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2">
          <Button onClick={handleUpload} disabled={uploading || files.length === 0} className="rounded-full">
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {files.length > 1
              ? `Upload ${files.length} reports`
              : "Upload and extract"}
          </Button>
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Your file is stored privately and never shared. You can delete it any
        time from the report's page.
      </p>
    </div>
  );
}