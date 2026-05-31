import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Zap, BookOpen, Pill, Download, FileText, Copy, Share2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/timeline")({
  head: () => ({ meta: [{ title: "Timeline — Purple" }] }),
  component: TimelinePage,
});

type Range = "day" | "week" | "month" | "year" | "custom";

function rangeStart(r: Range): Date {
  const now = new Date();
  switch (r) {
    case "day": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "year": return startOfYear(now);
    case "custom": return startOfDay(now);
  }
}

type Row = {
  id: string;
  at: string;
  kind: "seizure" | "journal" | "dose";
  title: string;
  body?: string | null;
};

function TimelinePage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [range, setRange] = React.useState<Range>("week");
  const [search, setSearch] = React.useState("");
  const [customFrom, setCustomFrom] = React.useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return startOfDay(d);
  });
  const [customTo, setCustomTo] = React.useState<Date>(() => new Date());

  const sinceISO = React.useMemo(
    () => (range === "custom" ? customFrom.toISOString() : rangeStart(range).toISOString()),
    [range, customFrom],
  );
  const untilISO = React.useMemo(
    () => (range === "custom" ? customTo.toISOString() : new Date().toISOString()),
    [range, customTo],
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["timeline", userId, sinceISO, untilISO],
    enabled: !!userId,
    queryFn: async (): Promise<Row[]> => {
      const [{ data: seizures }, { data: entries }, { data: doses }] = await Promise.all([
        supabase
          .from("seizure_events")
          .select("id, started_at, type, severity, notes")
          .eq("user_id", userId!)
          .gte("started_at", sinceISO)
          .lte("started_at", untilISO)
          .order("started_at", { ascending: false }),
        supabase
          .from("journal_entries")
          .select("id, captured_at, text, voice_transcript, ai_summary, kind")
          .eq("user_id", userId!)
          .is("archived_at", null)
          .gte("captured_at", sinceISO)
          .lte("captured_at", untilISO)
          .order("captured_at", { ascending: false }),
        supabase
          .from("medication_doses")
          .select("id, scheduled_at, taken_at, status, medication_id, medications(name)")
          .eq("user_id", userId!)
          .gte("scheduled_at", sinceISO)
          .lte("scheduled_at", untilISO)
          .order("scheduled_at", { ascending: false })
          .limit(200),
      ]);
      const out: Row[] = [];
      for (const s of seizures ?? []) {
        out.push({
          id: `s-${s.id}`,
          at: s.started_at,
          kind: "seizure",
          title: `Seizure${s.type ? ` · ${s.type}` : ""}${s.severity ? ` · sev ${s.severity}` : ""}`,
          body: s.notes,
        });
      }
      for (const e of entries ?? []) {
        out.push({
          id: `j-${e.id}`,
          at: e.captured_at,
          kind: "journal",
          title: e.ai_summary ?? (e.text?.slice(0, 80) ?? e.voice_transcript?.slice(0, 80) ?? "Journal entry"),
          body: null,
        });
      }
      for (const d of doses ?? []) {
        const name = (d as any).medications?.name ?? "Medication";
        out.push({
          id: `d-${d.id}`,
          at: d.taken_at ?? d.scheduled_at,
          kind: "dose",
          title: `${name} · ${d.status}`,
        });
      }
      out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
      return out;
    },
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        (r.title + " " + (r.body ?? "")).toLowerCase().includes(q),
      )
    : rows;

  // ---- Exports ----
  const toCSV = (data: Row[]) => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const head = ["When", "Kind", "Title", "Notes"].join(",");
    const lines = data.map((r) =>
      [
        esc(format(new Date(r.at), "yyyy-MM-dd HH:mm")),
        esc(r.kind),
        esc(r.title),
        esc(r.body ?? ""),
      ].join(","),
    );
    return head + "\n" + lines.join("\n");
  };
  const toText = (data: Row[]) =>
    data
      .map(
        (r) =>
          `${format(new Date(r.at), "EEE, MMM d, yyyy h:mm a")}  [${r.kind}]  ${r.title}${
            r.body ? "\n    " + r.body.replace(/\n/g, "\n    ") : ""
          }`,
      )
      .join("\n\n");

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const stamp = format(new Date(), "yyyy-MM-dd");
  const onExportCSV = () => {
    download(`purple-timeline-${stamp}.csv`, toCSV(filtered), "text/csv");
    toast.success("Downloaded CSV");
  };
  const onExportTxt = () => {
    download(`purple-timeline-${stamp}.txt`, toText(filtered), "text/plain");
    toast.success("Downloaded text report");
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(toText(filtered));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };
  const onShare = async () => {
    const text = toText(filtered);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Purple timeline", text });
      } catch { /* user cancelled */ }
    } else {
      onCopy();
    }
  };
  const onPrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rowsHtml = filtered
      .map(
        (r) => `
          <li>
            <small>${format(new Date(r.at), "EEE, MMM d, yyyy · h:mm a")}</small>
            <strong style="text-transform:capitalize">${r.kind}</strong>
            <div>${r.title.replace(/</g, "&lt;")}</div>
            ${r.body ? `<p>${r.body.replace(/</g, "&lt;")}</p>` : ""}
          </li>`,
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>Purple timeline ${stamp}</title>
      <style>
        body{font-family:Georgia,serif;max-width:720px;margin:32px auto;padding:0 20px;color:#222}
        h1{font-size:28px;margin-bottom:4px}
        small{display:block;color:#777;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
        li{list-style:none;margin:0 0 18px;padding:14px 16px;border:1px solid #e5e5e5;border-radius:12px}
        strong{display:inline-block;margin:4px 0;color:#6b3ec9}
        p{margin:6px 0 0;color:#444;white-space:pre-wrap}
        ul{padding:0}
      </style></head><body>
      <h1>Purple timeline</h1>
      <p>Generated ${format(new Date(), "EEE, MMM d, yyyy h:mm a")}. ${filtered.length} entries.</p>
      <ul>${rowsHtml}</ul>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="label-eyebrow text-muted-foreground">{t("timeline.eyebrow")}</p>
          <h1 className="mt-3 font-serif text-[40px] sm:text-6xl leading-[1.05] tracking-[-0.02em] text-foreground">
            {t("timeline.title1")}<br />{t("timeline.title2")}
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2">
              <Download className="h-4 w-4 mr-2" /> {t("timeline.export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onExportCSV}>
              <FileText className="h-4 w-4 mr-2" /> {t("timeline.downloadCsv")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportTxt}>
              <FileText className="h-4 w-4 mr-2" /> {t("timeline.downloadText")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint}>
              <FileText className="h-4 w-4 mr-2" /> {t("timeline.print")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="h-4 w-4 mr-2" /> {t("timeline.copy")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" /> {t("timeline.share")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mt-5 body-serif text-foreground/75 max-w-[560px]">
        {t("timeline.intro")}
      </p>

      {/* Quick add */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">{t("timeline.add")}</span>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/journal/new" })}>
          <BookOpen className="h-3.5 w-3.5 mr-1.5" /> {t("timeline.journalEntry")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/seizures/new" })}>
          <Zap className="h-3.5 w-3.5 mr-1.5" /> {t("timeline.seizure")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/meds" })}>
          <Pill className="h-3.5 w-3.5 mr-1.5" /> {t("timeline.dose")}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["day", "week", "month", "year", "custom"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm border transition-colors capitalize",
              range === r
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-secondary/60",
            )}
          >
            {t(`timeline.${r}`)}
          </button>
        ))}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("timeline.search")}
          className="ml-auto h-9 max-w-[220px]"
        />
      </div>
      {range === "custom" && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card/60 p-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t("timeline.from")}</p>
            <DateTimePicker value={customFrom} onChange={(d) => d && setCustomFrom(d)} disableFuture />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t("timeline.to")}</p>
            <DateTimePicker value={customTo} onChange={(d) => d && setCustomTo(d)} disableFuture />
          </div>
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("timeline.emptyRange")}</p>
        ) : (
          <ol className="relative border-l border-border pl-6 space-y-5">
            {filtered.map((r) => (
              <li key={r.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 grid h-6 w-6 place-items-center rounded-full bg-card border border-border text-primary">
                  {r.kind === "seizure" && <Zap className="h-3.5 w-3.5" />}
                  {r.kind === "journal" && <BookOpen className="h-3.5 w-3.5" />}
                  {r.kind === "dose" && <Pill className="h-3.5 w-3.5" />}
                </span>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {format(new Date(r.at), "EEE, MMM d · h:mm a")}
                  </p>
                  <p className="mt-1 font-serif text-[15px] leading-relaxed text-foreground">
                    {r.title}
                  </p>
                  {r.body && (
                    <p className="mt-1 text-sm text-foreground/75 whitespace-pre-wrap">{r.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Want to add older history? Go to{" "}
        <Link to="/meds" className="underline">Medications</Link> or{" "}
        <Link to="/seizures/new" className="underline">Log past event</Link>{" "}
        — both accept any date.
      </p>
    </div>
  );
}
