import * as React from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { userMessage } from "@/lib/user-message";

export function PasswordSection() {
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const onSave = async () => {
    if (pwd.length < 8) return toast.error("Use at least 8 characters");
    if (pwd !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error(userMessage(error, "That didn't work. Try again in a moment."));
    setPwd("");
    setConfirm("");
    toast.success("Password updated");
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-[#B084D1]" />
        <p className="text-[15px] text-foreground">Change password</p>
      </div>
      <p className="mt-1 text-[13px] sheet-muted">Minimum 8 characters.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-pwd" className="sr-only">
            New password
          </Label>
          <PasswordInput
            id="new-pwd"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="New password"
            className="bg-foreground/[0.04] border-foreground/10 text-foreground placeholder:text-foreground/30"
          />
        </div>
        <div>
          <Label htmlFor="confirm-pwd" className="sr-only">
            Confirm password
          </Label>
          <PasswordInput
            id="confirm-pwd"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm"
            className="bg-foreground/[0.04] border-foreground/10 text-foreground placeholder:text-foreground/30"
          />
        </div>
      </div>
      <div className="mt-3">
        <Button
          onClick={onSave}
          disabled={busy || !pwd || !confirm}
          variant="outline"
          className="bg-foreground/[0.04] border-foreground/10 text-foreground hover:bg-foreground/10"
        >
          {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Update password
        </Button>
      </div>
    </div>
  );
}
