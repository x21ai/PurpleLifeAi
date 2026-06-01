import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Pill, Activity, BookOpen, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { caregiverReadAlerts, dismissCaregiverAlert } from "@/lib/care.functions";

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
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["care", "alerts", ownerId],
    queryFn: () => fn({ data: { owner_id: ownerId } }),
  });

  const dismiss = useMutation({
    mutationFn: (alert_id: string) =>
      dismissFn({ data: { owner_id: ownerId, alert_id } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["care", "alerts", ownerId] }),
  });

  if (q.isLoading || q.isError) return null;
  const alerts = q.data?.alerts ?? [];
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h2 className="font-serif text-lg text-foreground">
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"} since your last visit
        </h2>
      </div>
      <ul className="mt-4 space-y-2">
        {alerts.map((a) => {
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
  );
}