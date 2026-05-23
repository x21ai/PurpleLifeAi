import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { Zap, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { cn } from "@/lib/utils";

type SeizureRow = {
  id: string;
  started_at: string;
  type: string | null;
  duration_seconds: number | null;
  severity: number | null;
  witnessed: boolean;
  injury: boolean;
  notes: string | null;
};

export const Route = createFileRoute("/_app/insights")({
  head: () => ({ meta: [{ title: "Patterns — Purple" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-8 sm:pt-12 pb-24">
      <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Patterns</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Purple quietly notices what changes around hard days.
      </p>

      <Tabs defaultValue="seizures" className="mt-8">
        <TabsList>
          <TabsTrigger value="seizures">Seizures</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="seizures" className="mt-6">
          <SeizuresTab />
        </TabsContent>
        <TabsContent value="trends" className="mt-6">
          <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
            Trends across sleep, mood, and triggers are coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeizuresTab() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [events, setEvents] = React.useState<SeizureRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("seizure_events")
        .select("id, started_at, type, duration_seconds, severity, witnessed, injury, notes")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(500);
      if (active) {
        setEvents((data as SeizureRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-foreground">Last 90 days</h2>
        <Button asChild size="sm" variant="outline">
          <Link to="/seizures/new">
            <Plus className="h-4 w-4 mr-1" /> Log
          </Link>
        </Button>
      </div>

      <Heatmap events={events} days={90} />

      <h2 className="font-serif text-lg text-foreground mt-10 mb-3">All events</h2>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Zap className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
          <p className="font-serif text-foreground">No events logged.</p>
          <p className="text-sm text-muted-foreground mt-1">
            When something happens, log it — it only takes a tap.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => <SeizureRowItem key={e.id} event={e} />)}
        </ul>
      )}
    </div>
  );
}

function SeizureRowItem({ event }: { event: SeizureRow }) {
  const d = parseISO(event.started_at);
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-foreground">
            {event.type ? event.type.replace(/_/g, " ") : "Seizure"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(d, "EEE, MMM d · h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {event.duration_seconds ? (
            <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              {event.duration_seconds}s
            </span>
          ) : null}
          {event.severity ? (
            <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              sev {event.severity}
            </span>
          ) : null}
          {event.injury ? (
            <span className="text-xs rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
              injury
            </span>
          ) : null}
        </div>
      </div>
      {event.notes && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.notes}</p>
      )}
    </li>
  );
}

function Heatmap({ events, days }: { events: SeizureRow[]; days: number }) {
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = format(startOfDay(parseISO(e.started_at)), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const today = startOfDay(new Date());
  const cells: { date: Date; key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    cells.push({ date: d, key, count: counts.get(key) ?? 0 });
  }

  // Pad so first column starts on Sunday
  const firstDow = cells[0]?.date.getDay() ?? 0;
  const pad = Array.from({ length: firstDow }, () => null);
  const grid: (typeof cells[0] | null)[] = [...pad, ...cells];

  const intensity = (n: number) => {
    if (n === 0) return "bg-secondary/50";
    if (n === 1) return "bg-primary/30";
    if (n === 2) return "bg-primary/55";
    if (n === 3) return "bg-primary/75";
    return "bg-primary";
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
      >
        {grid.map((cell, idx) =>
          cell ? (
            <div
              key={cell.key}
              title={`${format(cell.date, "MMM d")} — ${cell.count} ${cell.count === 1 ? "event" : "events"}`}
              className={cn("aspect-square rounded-[3px]", intensity(cell.count))}
            />
          ) : (
            <div key={`pad-${idx}`} className="aspect-square" />
          ),
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-secondary/50" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/30" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/55" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/75" />
        <span className="h-3 w-3 rounded-[3px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}