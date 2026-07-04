import * as React from "react";
import { X, Smartphone } from "lucide-react";
import { dismissReminderBanner, shouldShowReminderBanner } from "@/lib/med-notifications";
import { isNativeApp } from "@/lib/native/capacitor";

export function MedRemindersBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isNativeApp()) return;
    setVisible(shouldShowReminderBanner());
  }, []);

  if (isNativeApp() || !visible) return null;

  const dismiss = () => {
    dismissReminderBanner();
    setVisible(false);
  };

  return (
    <aside
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
      role="note"
      aria-label="Medication reminder tip"
    >
      <Smartphone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          Reminders are most reliable when Purple is installed as an app on your phone.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add to home screen for the best experience.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss reminder tip"
        className="text-muted-foreground hover:text-foreground p-1 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
