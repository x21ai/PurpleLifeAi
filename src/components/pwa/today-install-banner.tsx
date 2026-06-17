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
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as a Mac; detect a touch-capable Apple device too.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document)
  );
}

/** iOS Safari is the only iOS browser that can add to the home screen. */
function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

/**
 * Install prompt shown on Today. Only appears when an install is actually
 * possible: a captured `beforeinstallprompt` (Android, desktop Chrome/Edge) or
 * iOS Safari (manual add). It never shows where install is unsupported, and it
 * removes itself once the app is installed.
 */
export function TodayInstallBanner() {
  const [deferred, setDeferred] = React.useState<BIPEvent | null>(null);
  const [iosEligible, setIosEligible] = React.useState(false);
  const [showIosHelp, setShowIosHelp] = React.useState(false);
  // Hidden by default until we know an install path exists.
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setDismissed(false);

    if (isIOSSafari()) setIosEligible(true);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, "1");
      setDismissed(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") dismiss();
      else setDeferred(null);
      return;
    }
    if (iosEligible) setShowIosHelp(true);
  };

  // Render nothing unless there is a real way to install on this device.
  if (dismissed || (!deferred && !iosEligible)) return null;

  return (
    <>
      <aside
        className="rounded-2xl border border-primary/25 bg-primary/10 p-4 flex items-start gap-3"
        role="note"
        aria-label="Install Purple"
      >
        <Smartphone className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Add Purple to your home screen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Opens like an app, works offline, and keeps your medication reminders reliable.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={install} className="rounded-full">
              <Download className="h-3.5 w-3.5 mr-1" />
              {deferred ? "Add to home screen" : "How to add"}
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
              In Safari, tap the Share button (the square with an up arrow), then choose{" "}
              <strong>Add to Home Screen</strong>. Purple will open like an app from then on.
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
