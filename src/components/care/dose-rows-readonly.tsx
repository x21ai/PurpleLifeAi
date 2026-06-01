import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CaregiverBadge } from "@/components/care/caregiver-badge";

type Dose = {
  id: string;
  scheduled_at: string;
  taken_at?: string | null;
  status: string;
  medication_id: string;
  created_by_kind?: string | null;
};

type Med = {
  id: string;
  name: string;
  dosage: string | null;
};

function statusPillClass(status: string) {
  switch (status) {
    case "taken":
      return "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/30";
    case "missed":
      return "bg-destructive/15 text-destructive ring-1 ring-destructive/30";
    case "skipped":
      return "bg-muted text-muted-foreground ring-1 ring-border";
    default:
      return "bg-primary/15 text-primary ring-1 ring-primary/30";
  }
}

/**
 * Read-only "today's doses" list mirroring <TodayDoses>. No taken/skip/snooze
 * buttons unless `onAction` is provided (caregiver with meds:write scope).
 */
export function DoseRowsReadOnly({
  doses,
  meds,
  onAction,
  pendingId,
}: {
  doses: Dose[];
  meds: Med[];
  onAction?: (doseId: string, action: "taken" | "skip") => void;
  pendingId?: string | null;
}) {
  if (doses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No doses logged today.</p>
    );
  }
  const medById = new Map(meds.map((m) => [m.id, m]));
  return (
    <ul className="divide-y divide-border">
      {doses.map((d) => {
        const med = medById.get(d.medication_id);
        const busy = pendingId === d.id;
        return (
          <li
            key={d.id}
            className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0"
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                statusPillClass(d.status),
              )}
            >
              {format(new Date(d.scheduled_at), "h:mm a")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                {med?.name ?? "Medication"}
              </p>
              {med?.dosage && (
                <p className="text-xs text-muted-foreground truncate">{med.dosage}</p>
              )}
              <CaregiverBadge createdByKind={d.created_by_kind} className="mt-1" />
            </div>
            {onAction && d.status === "pending" ? (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() => onAction(d.id, "taken")}
                >
                  Taken
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground"
                  disabled={busy}
                  onClick={() => onAction(d.id, "skip")}
                >
                  Skip
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground capitalize">
                {d.status}
                {d.taken_at && d.status === "taken"
                  ? ` · ${format(new Date(d.taken_at), "h:mm a")}`
                  : ""}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}