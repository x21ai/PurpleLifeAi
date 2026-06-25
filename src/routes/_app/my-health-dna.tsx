import { createFileRoute, Link } from "@tanstack/react-router";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  ChevronLeft,
  Upload,
  Loader2,
  Trash2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  EyeOff,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useRouteTheme } from "@/lib/use-route-theme";
import { toast } from "sonner";
import {
  createDnaUpload,
  parseDnaFile,
  listDnaFiles,
  deleteDnaFile,
  setDnaShareWithCaregivers,
} from "@/lib/dna.functions";
import { generateCareProfile } from "@/lib/care-profile.functions";
import { CURATED_RSIDS, getCuratedRsid, type CuratedRsid } from "@/lib/dna-curated-rsids";
import { ProGate } from "@/components/pro/pro-gate";
import { userMessage } from "@/lib/user-message";
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

export const Route = createFileRoute("/_app/my-health-dna")({
  head: () => ({
    meta: [
      { title: "DNA insights · Purple" },
      {
        name: "description",
        content:
          "Upload a raw DNA file. Purple looks at a small, curated set of variants, never a clinical report.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DnaPage,
});

function DnaPage() {
  useRouteTheme("dark");
  const qc = useQueryClient();
  const listFn = useServerFn(listDnaFiles);
  const createFn = useServerFn(createDnaUpload);
  const parseFn = useServerFn(parseDnaFile);
  const deleteFn = useServerFn(deleteDnaFile);
  const shareFn = useServerFn(setDnaShareWithCaregivers);
  const regen = useServerFn(generateCareProfile);

  const [showSensitive, setShowSensitive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data } = useQuery({
    queryKey: ["dna-files"],
    queryFn: () => listFn(),
  });

  const remove = useMutation({
    mutationFn: async (fileId: string) => deleteFn({ data: { fileId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dna-files"] });
      toast.success("Deleted.");
    },
    onError: (e: unknown) => toast.error(userMessage(e, "That didn't delete. Try again in a moment.")),
  });

  const reparse = useMutation({
    mutationFn: async (fileId: string) => parseFn({ data: { fileId } }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["dna-files"] });
      if (result.kind === "bam" || result.kind === "cram" || result.kind === "index") {
        toast.message("Stored, but this file type isn't parsed.");
      } else {
        toast.success(formatParseToast(result.variantCount, result.stats));
      }
      regen({ data: { force: true } }).catch(() => undefined);
    },
    onError: (e: unknown) => toast.error(userMessage(e, "Purple couldn't re-read this just now. Try again in a moment.")),
  });

  const setShare = useMutation({
    mutationFn: async (args: { fileId: string; share: boolean }) => shareFn({ data: args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dna-files"] }),
  });

  async function handleFile(file: File) {
    if (file.size > 500 * 1024 * 1024) {
      toast.error("File too large (max 500 MB).");
      return;
    }
    if (/\.(tbi|crai|bai|csi)$/i.test(file.name)) {
      toast.error(
        "That's an index sidecar (.tbi/.crai/.bai/.csi). Upload the matching .vcf.gz, .bam, or .cram instead.",
      );
      return;
    }
    setUploading(true);
    try {
      const { fileId, storagePath } = await createFn({
        data: { originalFilename: file.name, byteSize: file.size },
      });
      const { error: upErr } = await supabase.storage
        .from("dna-uploads")
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });
      if (upErr) throw upErr;
      toast.message("Reading your file…");
      const result = await parseFn({ data: { fileId } });
      if (result.kind === "bam" || result.kind === "cram") {
        toast.message(
          "Saved. Raw alignment files aren't parsed yet , upload a 23andMe / Ancestry / VCF export for trait insights.",
        );
      } else if (result.kind === "index") {
        toast.message("Saved. Index file noted , we'll need the matching .vcf / .bam / .cram too.");
      } else {
        toast.success(formatParseToast(result.variantCount, result.stats));
      }
      qc.invalidateQueries({ queryKey: ["dna-files"] });
      // Regenerate care profile so prompts are gently informed.
      regen({ data: { force: true } }).catch(() => undefined);
      qc.invalidateQueries({ queryKey: ["care-profile"] });
    } catch (e) {
      toast.error(userMessage(e, "The upload didn't finish. Check your connection and try again; the file is still on your device."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const files = data?.files ?? [];
  const variants = data?.variants ?? [];
  const latest = files[0];
  const latestVariants = latest ? variants.filter((v) => v.file_id === latest.id) : [];
  const latestStats = getParseStats(latest?.parse_stats);
  const variantByRsid = new Map(latestVariants.map((v) => [v.rsid, v.genotype]));

  // Group curated catalog by trait.
  const grouped = new Map<string, CuratedRsid[]>();
  for (const r of CURATED_RSIDS) {
    if (!grouped.has(r.trait)) grouped.set(r.trait, []);
    grouped.get(r.trait)!.push(r);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 pt-6 pb-32">
      <div className="flex items-center justify-between">
        <Link
          to="/my-health"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> My Health
        </Link>
        <h1 className="text-[17px] font-semibold">DNA insights</h1>
        <span className="w-16" />
      </div>

      <section className="mt-10">
        <p className="label-eyebrow text-muted-foreground">Optional</p>
        <h2 className="mt-2 font-serif text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.05]">
          A quiet read of a few
          <br />
          relevant variants.
        </h2>
        <p className="mt-5 body-serif text-foreground/70 max-w-[560px]">
          Upload a raw file from 23andMe, AncestryDNA, MyHeritage, or any standard VCF. Purple only
          looks at a small, curated set of variants tied to traits we already track, never your
          whole genome.
        </p>
      </section>

      <MedicalDisclaimer className="mt-6" />

      {/* Upload */}
      <div className="mt-8">
        <ProGate feature="dna">
          <section
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragging) setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f && !uploading) handleFile(f);
            }}
            className={`rounded-3xl border-2 border-dashed bg-card p-6 sm:p-8 transition ${
              dragging
                ? "border-[color:var(--purple-primary)] bg-[color:var(--purple-primary)]/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-full bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)]">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Drag &amp; drop or choose a DNA file</p>
                <p className="text-xs text-muted-foreground">
                  .txt, .tsv, .csv, .vcf, .json, .gz, .zip, .tar, .tar.gz , up to 500 MB
                </p>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.tsv,.csv,.vcf,.json,.gz,.zip,.tar,.tgz,.bam,.cram"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--purple-primary)] text-white py-3.5 font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Reading…" : dragging ? "Drop to upload" : "Choose file"}
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Private storage. Only you can read it. Alignment
              files (.bam / .cram) are stored but not yet parsed.
            </p>
          </section>
        </ProGate>
      </div>

      {/* What we look at */}
      <details className="mt-8 rounded-2xl border border-border bg-card/40 px-5 py-4">
        <summary className="cursor-pointer text-sm font-medium">What we look at and why</summary>
        <ul className="mt-4 space-y-3">
          {CURATED_RSIDS.map((r) => (
            <li key={r.rsid} className="text-sm">
              <p className="font-medium text-foreground">
                {r.gene} <span className="text-muted-foreground">· {r.trait}</span>
                {r.sensitive && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-400">
                    sensitive
                  </span>
                )}
              </p>
              <p className="text-muted-foreground mt-0.5">{r.plainLanguage}</p>
            </li>
          ))}
        </ul>
      </details>

      {/* Files list */}
      {files.length > 0 && (
        <section className="mt-10">
          <p className="label-eyebrow text-muted-foreground">
            Your file{files.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-3 space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{f.original_filename}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {f.provider} · {statusLabel(f.status, f.kind)}
                    {f.error_message ? ` · ${f.error_message}` : ""}
                  </p>
                  {isUnparseableKind(f.kind) && (
                    <p className="mt-1 text-[11px] text-amber-400/90">
                      Alignment or index file , upload the matching .vcf.gz or your raw genotype
                      export to extract markers.
                    </p>
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={f.share_with_caregivers}
                    onChange={(e) => setShare.mutate({ fileId: f.id, share: e.target.checked })}
                  />
                  Share with caregivers
                </label>
                {!isUnparseableKind(f.kind) && (
                  <button
                    type="button"
                    onClick={() => reparse.mutate(f.id)}
                    disabled={reparse.isPending}
                    className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground disabled:opacity-50"
                    aria-label="Re-analyze"
                    title="Re-analyze"
                  >
                    {reparse.isPending && reparse.variables === f.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(f.id)}
                  className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Results */}
      {latest && latest.status === "parsed" && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <p className="label-eyebrow text-muted-foreground inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> What we found
            </p>
            <button
              type="button"
              onClick={() => setShowSensitive((v) => !v)}
              className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              {showSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showSensitive ? "Hide sensitive" : "Show sensitive"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Rows scanned
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatNumber(latestStats.rowsScanned)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Curated matches
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatNumber(latestStats.curatedMatches)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-8">
            {[...grouped.entries()].map(([trait, entries]) => {
              const rows = entries.filter((r) => {
                if (r.sensitive && !showSensitive) return false;
                return variantByRsid.has(r.rsid);
              });
              if (rows.length === 0) return null;
              return (
                <div key={trait}>
                  <h3 className="text-sm font-semibold text-foreground">{trait}</h3>
                  <ul className="mt-2 divide-y divide-border/60">
                    {rows.map((r) => {
                      const gt = variantByRsid.get(r.rsid)!;
                      const note =
                        r.genotypeNotes[gt] ?? "Pattern noted; ask your clinician for context.";
                      return (
                        <li key={r.rsid} className="py-3">
                          <p className="text-sm">
                            <span className="font-medium">{r.gene}</span>{" "}
                            <span className="text-muted-foreground">({r.rsid})</span>{" "}
                            <span className="tabular-nums text-foreground/80">· {gt}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{note}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {latestVariants.length === 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground inline-flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                The file was read, but none of Purple's small curated variant set was found. This
                can happen with clinical VCFs that omit or shift the exact marker positions we
                currently look for.
              </p>
            </div>
          )}

          {!showSensitive &&
            CURATED_RSIDS.some((r) => r.sensitive && variantByRsid.has(r.rsid)) && (
              <p className="mt-6 text-xs text-muted-foreground">
                Some sensitive findings are hidden. Use “Show sensitive” above when you're ready to
                look.
              </p>
            )}

          {/* Defensive: never recommend treatment from this surface. */}
          <MedicalDisclaimer className="mt-8" />
        </section>
      )}

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this DNA file?</AlertDialogTitle>
            <AlertDialogDescription>
              The stored file and any extracted variants will be removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) remove.mutate(pendingDeleteId);
                setPendingDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function statusLabel(s: string, kind?: string | null): string {
  if (s === "parsed" && isUnparseableKind(kind)) return "Stored · not parsed";
  switch (s) {
    case "uploaded":
      return "Uploaded";
    case "parsing":
      return "Reading…";
    case "parsed":
      return "Parsed";
    case "error":
      return "Error";
    default:
      return s;
  }
}

function isUnparseableKind(kind?: string | null): boolean {
  return kind === "bam" || kind === "cram" || kind === "index";
}

function getParseStats(raw: unknown): { rowsScanned: number; curatedMatches: number } {
  if (!raw || typeof raw !== "object") return { rowsScanned: 0, curatedMatches: 0 };
  const value = raw as Record<string, unknown>;
  const rowsScanned = Number(value.rowsScanned ?? 0);
  const curatedMatches = Number(value.curatedMatches ?? 0);
  return {
    rowsScanned: Number.isFinite(rowsScanned) ? rowsScanned : 0,
    curatedMatches: Number.isFinite(curatedMatches) ? curatedMatches : 0,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatParseToast(variantCount: number, stats?: { rowsScanned?: number }): string {
  const rows = stats?.rowsScanned ?? 0;
  if (rows > 0)
    return `Scanned ${formatNumber(rows)} rows · found ${variantCount} curated variants.`;
  return `Found ${variantCount} curated variants.`;
}

// Keep the linter quiet about unused imports in the helper grid.
void getCuratedRsid;
