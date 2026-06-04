import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { pickDailyTip } from "@/lib/condition-tips";

const STORAGE_KEY = "purple-tip-dismissed";

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function ConditionTipCard({
  conditions,
}: {
  conditions: string[] | null | undefined;
}) {
  const [now, setNow] = React.useState<Date | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const d = new Date();
    setNow(d);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { id, day } = JSON.parse(raw) as { id: string; day: string };
        const { tip } = pickDailyTip(conditions ?? null, d.getTime());
        if (id === tip.id && day === dayKey(d)) setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, [conditions]);

  if (!now || dismissed) return null;

  const { tip } = pickDailyTip(conditions ?? null, now.getTime());

  return (
    <section className="mt-8 rounded-2xl ring-1 ring-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-secondary p-2 shrink-0">
          <Sparkles className="h-4 w-4 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-muted-foreground">A small thing for today</p>
          <p className="mt-1.5 text-sm text-foreground leading-relaxed">{tip.body}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss tip for today"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ id: tip.id, day: dayKey(now) }),
              );
            } catch {
              // ignore
            }
            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}