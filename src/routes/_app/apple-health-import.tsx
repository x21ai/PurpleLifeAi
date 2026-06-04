import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileUp, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetPage, SheetCard } from "@/components/sheet/sheet-page";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useServerFn } from "@tanstack/react-start";
import { applyAppleHealthBackfill } from "@/lib/apple-health.functions";
import { parseHealthExport, type ParseProgress } from "@/lib/apple-health-xml";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/apple-health-import")({
  head: () => ({ meta: [{ title: "Apple Health import — Purple" }] }),
  component: AppleHealthImportPage,
});

function AppleHealthImportPage() {
  useRouteTheme("dark");
  const backfill = useServerFn(applyAppleHealthBackfill);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [phase, setPhase] = useState<"idle" | "unzipping" | "parsing" | "uploading" | "done">("idle");
  const [inserted, setInserted] = useState(0);

  const onFile = async (file: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    let xmlFile: File;
    if (lower.endsWith(".zip")) {
      setPhase("unzipping");
      try {
        const extracted = await extractExportXmlStreaming(file);
        if (!extracted) {
          setPhase("idle");
          toast.error("That zip doesn't look like an Apple Health export — it should contain apple_health_export/export.xml");
          return;
        }
        xmlFile = extracted;
      } catch (e) {
        setPhase("idle");
        toast.error(e instanceof Error ? `Couldn't unzip: ${e.message}` : "Couldn't unzip the file");
        return;
      }
    } else if (lower.endsWith(".xml")) {
      xmlFile = file;
    } else {
      toast.error("Please select export.zip or export.xml from the Apple Health export");
      return;
    }
    setPhase("parsing");
    setProgress({ bytesRead: 0, totalBytes: xmlFile.size, recordsParsed: 0, daysFound: 0 });
    let days;
    try {
      days = await parseHealthExport(xmlFile, setProgress);
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Couldn't parse the XML file");
      return;
    }

    if (days.length === 0) {
      setPhase("idle");
      toast.error("No usable health records found in that file");
      return;
    }

    setPhase("uploading");
    const CHUNK = 500;
    let total = 0;
    try {
      for (let i = 0; i < days.length; i += CHUNK) {
        const slice = days.slice(i, i + CHUNK);
        const r = await backfill({ data: { days: slice } });
        total += r.inserted;
      }
      setInserted(total);
      setPhase("done");
      toast.success(`Imported ${total} days of Apple Health data`);
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  return (
    <SheetPage title="Apple Health import">
      <SheetCard>
        <Link to="/tools" className="inline-flex items-center gap-2 text-[13px] text-[#82B4FF]">
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>
        <h2 className="mt-4 text-[22px] font-light text-[#FAFAFC]">One-time historical backfill</h2>
        <ol className="mt-3 space-y-2 text-[13px] text-white/70 list-decimal pl-5">
          <li>Open the Health app on your iPhone.</li>
          <li>Tap your profile photo (top right) and choose <span className="text-[#FAFAFC]">Export All Health Data</span>.</li>
          <li>Save the <code className="font-mono text-[#FAFAFC]">export.zip</code> to Files (or AirDrop it to your computer).</li>
          <li>Pick that <code className="font-mono">export.zip</code> below — Purple unzips and parses it locally in your browser, then uploads only daily summaries. The raw file never leaves your device.</li>
        </ol>
      </SheetCard>

      <SheetCard>
        {phase === "idle" && (
          <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 p-10 cursor-pointer hover:bg-white/[0.03] transition">
            <FileUp className="h-8 w-8 text-white/70" />
            <p className="text-[15px] text-[#FAFAFC]">Choose export.zip (or export.xml)</p>
            <p className="text-[12px] text-white/60">Drop the file straight from Apple Health. Up to several hundred MB is fine.</p>
            <input
              type="file"
              accept=".zip,.xml,application/zip,text/xml,application/xml"
              className="hidden"
              onChange={(e) => void onFile(e.currentTarget.files?.[0] ?? null)}
            />
          </label>
        )}

        {phase === "unzipping" && (
          <div className="space-y-3 py-6 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/70" />
            <p className="text-[15px] text-[#FAFAFC]">Unzipping your export…</p>
            <p className="text-[12px] text-white/60">Looking for export.xml inside the archive.</p>
          </div>
        )}

        {(phase === "parsing" || phase === "uploading") && progress && (
          <div className="space-y-3 py-6 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/70" />
            <p className="text-[15px] text-[#FAFAFC]">
              {phase === "parsing" ? "Reading your export…" : "Uploading daily summaries…"}
            </p>
            <p className="text-[12px] text-white/60">
              {formatBytes(progress.bytesRead)} / {formatBytes(progress.totalBytes)} ·{" "}
              {progress.recordsParsed.toLocaleString()} records · {progress.daysFound} days
            </p>
            <div className="mx-auto h-1 w-full max-w-md overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white/70 transition-all"
                style={{
                  width: `${Math.min(100, (progress.bytesRead / Math.max(1, progress.totalBytes)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4 py-6 text-center">
            <Check className="mx-auto h-8 w-8 text-[#82B4FF]" />
            <p className="text-[18px] font-light text-[#FAFAFC]">Imported {inserted} days</p>
            <Button asChild variant="outline">
              <Link to="/biometrics" className="text-[#FAFAFC]">View biometrics</Link>
            </Button>
          </div>
        )}
      </SheetCard>
    </SheetPage>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * Stream-unzip the Apple Health export and extract just `export.xml`.
 *
 * Uses fflate's `Unzip` class on the main thread so we never postMessage
 * the whole archive into a Web Worker (which OOMs the structured clone for
 * multi-hundred-MB exports). Memory peak ~= size of export.xml itself.
 */
async function extractExportXmlStreaming(file: File): Promise<File | null> {
  const { Unzip, UnzipInflate } = await import("fflate");

  return await new Promise<File | null>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let total = 0;
    let found = false;
    let done = false;

    const finish = (result: File | null) => {
      if (done) return;
      done = true;
      resolve(result);
    };

    const unzip = new Unzip((stream) => {
      const name = stream.name.toLowerCase();
      const isExport = name === "export.xml" || name.endsWith("/export.xml");
      if (!isExport) return; // skip — fflate discards the data
      found = true;
      stream.ondata = (err, data, final) => {
        if (done) return;
        if (err) {
          done = true;
          reject(err);
          return;
        }
        if (data && data.length) {
          chunks.push(data);
          total += data.length;
        }
        if (final) {
          const merged = new Uint8Array(total);
          let off = 0;
          for (const c of chunks) {
            merged.set(c, off);
            off += c.length;
          }
          chunks.length = 0;
          const ab = merged.buffer.slice(
            merged.byteOffset,
            merged.byteOffset + merged.byteLength,
          ) as ArrayBuffer;
          finish(new File([ab], "export.xml", { type: "application/xml" }));
        }
      };
      stream.start();
    });
    unzip.register(UnzipInflate);

    (async () => {
      const reader = file.stream().getReader();
      try {
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) {
            unzip.push(new Uint8Array(0), true);
            if (!done) finish(found ? null : null);
            return;
          }
          if (value && value.length) {
            unzip.push(value, false);
          }
        }
      } catch (e) {
        if (!done) {
          done = true;
          reject(e);
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          /* noop */
        }
      }
    })();
  });
}