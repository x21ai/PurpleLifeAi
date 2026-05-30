import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { processReport } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";

export const Route = createFileRoute("/_app/reports/new")({
  head: () => ({ meta: [{ title: "Upload report — Purple" }] }),
  component: UploadReportPage,
});

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ACCEPT = "application/pdf,image/jpeg,image/png,image/heic,image/webp";

function UploadReportPage() {
  useRouteTheme("light");
  const { session } = useAuth();
  const userId = session?.user.id;
  const navigate = useNavigate();
  const triggerProcess = useServerFn(processReport);

  const [title, setTitle] = React.useState("");
  const [reportDate, setReportDate] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async () => {
    if (!userId || !file) {
      toast.error("Pick a file first");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File is too big (max 15 MB)");
      return;
    }
    if (!title.trim()) {
      toast.error("Give the report a title");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: doc, error: insErr } = await supabase
        .from("report_documents")
        .insert({
          user_id: userId,
          title: title.trim(),
          file_path: path,
          file_mime: file.type || "application/octet-stream",
          report_date: reportDate || null,
          status: "processing",
        })
        .select("id")
        .single();
      if (insErr || !doc) throw insErr ?? new Error("Insert failed");

      // Kick off AI extraction in the background. Don't await full result for UX.
      void triggerProcess({ data: { reportId: doc.id } }).catch((e) => {
        console.error("processReport failed", e);
      });

      toast.success("Uploaded — Purple is extracting the values now");
      navigate({ to: "/reports" });
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
        <ChevronLeft className="h-3.5 w-3.5" /> Reports
      </Link>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground">Upload report</h1>
      <p className="mt-3 text-foreground/75">
        PDF, JPG, or PNG up to 15 MB. Purple uses AI to read the values and
        match them to standard metrics.
      </p>

      <MedicalDisclaimer className="mt-6" />

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="r-title">Title</Label>
          <Input
            id="r-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quest blood panel"
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-date">Report date (optional)</Label>
          <Input
            id="r-date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            If left blank, Purple will try to detect it from the document.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-file">File</Label>
          <Input
            id="r-file"
            type="file"
            accept={ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
        <div className="pt-2">
          <Button onClick={handleUpload} disabled={uploading || !file} className="rounded-full">
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload and extract
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