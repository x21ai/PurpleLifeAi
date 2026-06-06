import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Med = {
  id: string;
  name: string;
  dosage: string | null;
  times_of_day: string[];
  is_rescue: boolean;
  active: boolean;
  notes?: string | null;
  pills_remaining?: number | null;
  refill_date?: string | null;
};

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const am = h < 12;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

/**
 * Read-only medications list mirroring <MedRow> on /meds. No edit/archive
 * dropdown, caregiver writes come in Step 3.
 */
export function MedsListReadOnly({
  meds,
  trailing,
}: {
  meds: Med[];
  /** Optional slot for actions (e.g. "Propose change" dialog). */
  trailing?: (med: Med) => React.ReactNode;
}) {
  if (meds.length === 0) {
    return <p className="text-sm text-muted-foreground">No active medications.</p>;
  }
  return (
    <ul className="space-y-2">
      {meds.map((m) => {
        const lowStock =
          m.pills_remaining != null && m.pills_remaining <= 7;
        return (
          <li
            key={m.id}
            className={cn(
              "block rounded-2xl border border-border bg-card p-5",
              !m.active && "opacity-70",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-serif text-lg text-foreground truncate">{m.name}</p>
                  {lowStock && (
                    <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Refill soon
                    </span>
                  )}
                  {m.is_rescue && (
                    <span className="rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Rescue
                    </span>
                  )}
                </div>
                {m.dosage && (
                  <p className="text-sm text-muted-foreground">{m.dosage}</p>
                )}
                {!m.is_rescue && m.times_of_day?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.times_of_day.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-secondary-foreground"
                      >
                        {formatTime(t)}
                      </span>
                    ))}
                  </div>
                )}
                {m.notes && (
                  <p className="mt-2 text-xs text-foreground/70 whitespace-pre-wrap">
                    {m.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {m.pills_remaining != null && (
                  <div
                    className={`text-right ${
                      lowStock ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    <p className="label-eyebrow">Pills</p>
                    <p className="font-serif text-2xl tabular-nums flex items-center gap-1 justify-end mt-1">
                      {lowStock && <AlertCircle className="h-3.5 w-3.5" />}
                      {m.pills_remaining}
                    </p>
                  </div>
                )}
                {trailing?.(m)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}