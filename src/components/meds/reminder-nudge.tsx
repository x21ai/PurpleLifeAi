import * as React from "react";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissReminderBanner,
  notificationsSupported,
  requestPermission,
  shouldShowReminderBanner,
} from "@/lib/med-notifications";

/**
 * Slim, dismissible "enable notifications" banner. Rendered at the page level
 * (not inside the Today's doses card) and self-hides once permission is granted.
 */
export function ReminderNudge({ className }: { className?: string }) {
  const [visible, setVisible] = React.useState(false);
  const [perm, setPerm] = React.useState<NotificationPermission | "unsupported">("default");

  React.useEffect(() => {
    setVisible(shouldShowReminderBanner());
    if (!notificationsSupported()) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  if (!visible || perm === "granted" || perm === "unsupported") return null;

  const dismiss = () => {
    dismissReminderBanner();
    setVisible(false);
  };

  return (
    <div
      className={`rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2 ${className ?? ""}`}
    >
      <Smartphone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0 text-sm">
        <p className="text-foreground">Turn on reminders so you never miss a dose.</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 rounded-full h-8"
          onClick={() => void requestPermission().then((p) => setPerm(p))}
        >
          Enable notifications
        </Button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground p-1 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
