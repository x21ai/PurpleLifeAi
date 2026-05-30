import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/integrations/supabase/auth-context";
import {
  checkDeletionStatus,
  restoreUserData,
  type DeletionStatus,
} from "@/lib/data-export";

/**
 * Shown at the top of Today (and any signed-in page that includes it) when
 * the user has a pending soft-delete. One-tap restore inside the 60-day
 * window; after that the purge cron removes the data permanently.
 */
export function RestoreBanner() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!userId) return;
    void checkDeletionStatus(userId).then(setStatus);
  }, [userId]);

  if (!status) return null;

  const daysRemaining = status.purgeAfter
    ? Math.max(
        0,
        Math.ceil(
          (new Date(status.purgeAfter).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const onRestore = async () => {
    setRestoring(true);
    try {
      await restoreUserData();
      setStatus(null);
      toast.success("Your account has been restored.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <aside
      role="alert"
      className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Your account is scheduled for deletion
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {daysRemaining != null ? (
              <>
                Everything will be permanently erased in{" "}
                <span className="text-foreground font-medium">
                  {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
                </span>
                . Restore now to keep your data.
              </>
            ) : (
              <>Restore now to keep your data.</>
            )}
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              onClick={onRestore}
              disabled={restoring}
              className="rounded-full"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 mr-2" />
              )}
              Restore my account
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}