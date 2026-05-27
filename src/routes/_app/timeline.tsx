import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Zap, BookOpen, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/timeline")({
  head: () => ({ meta: [{ title: "Timeline — Purple" }] }),
  component: TimelinePage,
});

type Range = "day" | "week" | "month" | "year";

function rangeStart(r: Range): Date {
  const now = new Date();
  switch (r) {
    case "day": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "year": return startOfYear(now);
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
  const { session } = useAuth();
  const userId = session?.user.id;
  const [range, setRange] = React.useState<Range>("week");
  const [search, setSearch] = React.useState("");

  const sinceISO = React.useMemo(() => rangeStart(range).toISOString(), [range]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["timeline", userId, sinceISO],
    enabled: !!userId,
    queryFn: async (): Promise<Row[]> => {
      const [{ data: seizures }, { data: entries }, { data: doses }] = await Promise.all([
        supabase
          .from("seizure_events")
          .select("id, started_at, type, severity, notes")
          .eq("user_id", userId!)
          .gte("started_at", sinceISO)
          .order("started_at", { ascending: false }),
        supabase
          .from("journal_entries")
          .select("id, captured_at, text, voice_transcript, ai_summary, kind")
          .eq("user_id", userId!)
          .is("archived_at", null)
          .gte("captured_at", sinceISO)
          .order("captured_at", { ascending: false }),
        supabase
          .from("medication_doses")
          .select("id, scheduled_at, taken_at, status, medication_id, medications(name)")
          .eq("user_id", userId!)
          .gte("scheduled_at", sinceISO)
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

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <p className="label-eyebrow text-muted-foreground">Timeline</p>
      <h1 className="mt-3 font-serif text-[40px] sm:text-6xl leading-[1.05] tracking-[-0.02em] text-foreground">
        Everything,<br />in order.
      </h1>
      <p className="mt-5 body-serif text-foreground/75 max-w-[560px]">
        Seizures, journal entries, and doses, side by side. Filter by range or search.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["day", "week", "month", "year"] as const).map((r) => (
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
            {r}
          </button>
        ))}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="ml-auto h-9 max-w-[220px]"
        />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in this range yet.</p>
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
