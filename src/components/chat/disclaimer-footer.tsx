import * as React from "react";
import { X } from "lucide-react";

const KEY = "purple-chat-disclaimer-dismissed";

/**
 * Subtle persistent disclaimer above the chat composer. Always present on
 * first load of a session; dismissible per session.
 */
export function DisclaimerFooter() {
  const [dismissed, setDismissed] = React.useState(true);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(KEY) === "1");
  }, []);
  if (dismissed) return null;
  return (
    <div className="mx-auto max-w-3xl flex items-start gap-2 pb-2 text-[11px] leading-snug text-muted-foreground">
      <p className="flex-1">
        Purple isn't a clinician. Ideas here support your own judgement, talk to
        your care team for anything that needs a decision.
      </p>
      <button
        type="button"
        aria-label="Dismiss disclaimer"
        onClick={() => {
          sessionStorage.setItem(KEY, "1");
          setDismissed(true);
        }}
        className="text-muted-foreground/70 hover:text-foreground shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}