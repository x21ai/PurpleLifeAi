import * as React from "react";
import { Smartphone, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DISMISSED_KEY = "purple-today-install-dismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function TodayInstallBanner() {
  const [visible, setVisible] = React.useState(false);
  const [deferred, setDeferred] = React.useState<BIPEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") dismiss();
      else setDeferred(null);
      return;
    }
    // Fallback: iOS Safari has no programmatic install.
    setShowIosHelp(true);
  };

  if (!visible) return null;

  return (
    <>
      <aside
        className="rounded-2xl border border-primary/25 bg-primary/10 p-4 flex items-start gap-3"
        role="note"
        aria-label="Install Purple"
      >
        <Smartphone className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            For reliable medication reminders, add Purple to your home screen.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={install} className="rounded-full">
              <Download className="h-3.5 w-3.5 mr-1" />
              {isIOS() ? "How to add" : "Add to home screen"}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground p-1 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </aside>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Purple to your home screen</DialogTitle>
            <DialogDescription>
              In Safari, tap the Share button (the square with an up arrow) at the bottom of the
              screen, then choose <strong>Add to Home Screen</strong>.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowIosHelp(false)} className="rounded-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
