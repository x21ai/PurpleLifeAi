import { useEffect, useState } from "react";
import { Download, Loader2, Trash2, ShieldAlert, Undo2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  exportAllUserData,
  softDeleteUserData,
  restoreUserData,
  checkDeletionStatus,
  RESTORE_WINDOW_DAYS,
  type DeletionStatus,
} from "@/lib/data-export";
import { useAuth } from "@/integrations/supabase/auth-context";

export function DataSection() {
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState<DeletionStatus | null>(null);
  const [restoring, setRestoring] = useState(false);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session?.user?.id) return;
    void checkDeletionStatus(session.user.id).then(setPendingDeletion);
  }, [session?.user?.id]);

  const onExport = async () => {
    setExporting(true);
    try {
      await exportAllUserData();
      toast.success("Your archive is downloading");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setConfirmText("");
    setPassword("");
  };

  const onDelete = async () => {
    if (confirmText.trim() !== "DELETE" || !password) return;
    setDeleting(true);
    try {
      await softDeleteUserData(password);
      toast.success(
        `Deletion scheduled. You have ${RESTORE_WINDOW_DAYS} days to restore by signing back in.`,
      );
      await signOut();
      navigate({ to: "/sign-in" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
      setDeleting(false);
    }
  };

  const onRestore = async () => {
    setRestoring(true);
    try {
      await restoreUserData();
      setPendingDeletion(null);
      toast.success("Your account has been restored.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore");
    } finally {
      setRestoring(false);
    }
  };

  const daysRemaining = pendingDeletion?.purgeAfter
    ? Math.max(
        0,
        Math.ceil(
          (new Date(pendingDeletion.purgeAfter).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-serif text-xl text-foreground">Your data</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Take it with you anytime. Deletion is reversible for {RESTORE_WINDOW_DAYS} days
       , after that, everything is permanently erased.
      </p>

      {pendingDeletion && (
        <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Your account is scheduled for deletion
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Requested {new Date(pendingDeletion.deletedAt).toLocaleDateString()}.
                {daysRemaining != null && (
                  <> Permanent purge in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}.</>
                )}
              </p>
              <div className="mt-3">
                <Button size="sm" onClick={onRestore} disabled={restoring} className="rounded-full">
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
        </div>
      )}

      <TooltipProvider delayDuration={200}>
        <div className="mt-5 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onExport}
                disabled={exporting}
                aria-label="Export all your data"
                className="rounded-full"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export your data</TooltipContent>
          </Tooltip>
          {!pendingDeletion && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Delete account"
                  className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete account</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      <Dialog open={confirmOpen} onOpenChange={(o) => (o ? setConfirmOpen(true) : closeConfirm())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Delete everything?</DialogTitle>
            <DialogDescription className="text-left">
              This schedules every journal entry, biometric reading, medication,
              seizure log, and uploaded file tied to your account for permanent deletion.
              <br /><br />
              You'll have <span className="text-foreground font-medium">{RESTORE_WINDOW_DAYS} days</span>{" "}
              to restore by signing back in. After that, everything is permanently erased
              and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-delete">Type <span className="font-mono text-foreground">DELETE</span> to confirm</Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                placeholder="DELETE"
                disabled={deleting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Re-enter your password</Label>
              <PasswordInput
                id="confirm-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={deleting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We recommend exporting your data first so you have a copy.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={closeConfirm} disabled={deleting}>
              Keep my data
            </Button>
            <Button
              onClick={onDelete}
              disabled={deleting || confirmText.trim() !== "DELETE" || !password}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Schedule deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}