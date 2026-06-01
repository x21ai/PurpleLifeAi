import { format } from "date-fns";
import { Zap } from "lucide-react";

type Event = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  type: string | null;
  severity: number | null;
  injury: boolean;
  rescue_med_given: boolean;
  notes: string | null;
};

export function SeizureListReadOnly({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <Zap className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No seizures logged.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li
          key={e.id}
          className="rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="font-serif text-lg text-foreground">
                {format(new Date(e.started_at), "EEE, MMM d · h:mm a")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.type ?? "Unspecified"}
                {e.duration_seconds
                  ? ` · ${Math.max(1, Math.round(e.duration_seconds / 60))} min`
                  : ""}
                {typeof e.severity === "number" ? ` · severity ${e.severity}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {e.rescue_med_given && (
                <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Rescue med
                </span>
              )}
              {e.injury && (
                <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Injury
                </span>
              )}
            </div>
          </div>
          {e.notes && (
            <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">
              {e.notes}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}