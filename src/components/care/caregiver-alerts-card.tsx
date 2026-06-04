import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Pill, Activity, BookOpen, Zap, X, Radio } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  caregiverReadAlerts,
  dismissCaregiverAlert,
  dismissAllCaregiverAlerts,
} from "@/lib/care.functions";

type Tab = "today" | "meds" | "biometrics" | "journal" | "seizures" | "reports";

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  missed_dose: Pill,
  seizure: Zap,
  biometric: Activity,
  journal: BookOpen,
};

export function CaregiverAlertsCard({
  ownerId,
  onJump,
}: {
  ownerId: string;
  onJump?: (tab: Tab) => void;
}) {
  const fn = useServerFn(caregiverReadAlerts);
  const dismissFn = useServerFn(dismissCaregiverAlert);
  const dismissAllFn = useServerFn(dismissAllCaregiverAlerts);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["care", "alerts", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });

  // Live: refresh alerts on any new owner-side activity.
  useEffect(() => {
    const filter = `user_id=eq.${ownerId}`;
    const channel = supabase
      .channel(`care-alerts-${ownerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seizure_events", filter }, () =>
        qc.invalidateQueries({ queryKey: ["care", "alerts", ownerId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "medication_doses", filter }, () =>
        qc.invalidateQueries({ queryKey: ["care", "alerts", ownerId] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter }, () =>
        qc.invalidateQueries({ queryKey: ["care", "alerts", ownerId] }))
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ownerId, qc]);

  const dismiss = useMutation({
    mutationFn: (alert_id: string) =>
      dismissFn({ data: { owner_id: ownerId, alert_id } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["care", "alerts", ownerId] }),
  });
  const dismissAll = useMutation({
    mutationFn: (ids: string[]) =>
      dismissAllFn({ data: { owner_id: ownerId, alert_ids: ids } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["care", "alerts", ownerId] }),
  });

  if (q.isLoading || q.isError) return null;
  const alerts = q.data?.alerts ?? [];
  if (alerts.length === 0) return null;

  // Group by local day for readability
  const groups = new Map<string, typeof alerts>();
  for (const a of alerts) {
    const day = new Date(a.at).toLocaleDateString();
    const list = groups.get(day) ?? [];
    list.push(a);
    groups.set(day, list);
  }

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="font-serif text-lg text-foreground">
            {alerts.length} {alerts.length === 1 ? "alert" : "alerts"} since your last visit
          </h2>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
            title="Updates in real time"
          >
            <Radio className="h-2.5 w-2.5" />
            Live
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => dismissAll.mutate(alerts.map((a) => a.id))}
          disabled={dismissAll.isPending}
        >
          Dismiss all
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {Array.from(groups.entries()).map(([day, items]) => (
          <div key={day}>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {day}
            </p>
            <ul className="space-y-2">
              {items.map((a) => {
          const Icon = ICON[a.kind] ?? AlertTriangle;
          return (
            <li
              key={a.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                {a.body && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onJump && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => onJump(a.tab as Tab)}
                  >
                    View
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Dismiss"
                  onClick={() => dismiss.mutate(a.id)}
                  disabled={dismiss.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}