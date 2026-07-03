import * as React from "react";
import { Smartphone, X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/native";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  installCapability,
  isStandalonePwa,
  type InstallCapability,
} from "@/lib/pwa-platform";

const DISMISSED_KEY = "purple-today-install-dismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Install prompt shown on Today. Uses the native `beforeinstallprompt` when
 * available (Android, desktop Chrome/Edge). On iOS Safari it opens step-by-step
 * guidance. On other iOS browsers it explains that Safari is required.
 */
export function TodayInstallBanner() {
  const [deferred, setDeferred] = React.useState<BIPEvent | null>(null);
  const [capability, setCapability] = React.useState<InstallCapability>({ kind: "none" });
  const [showHelp, setShowHelp] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativeApp() || isStandalonePwa()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setDismissed(false);
    setCapability(installCapability());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setCapability({ kind: "native-prompt" });
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
    if (capability.kind === "ios-safari-manual" || capability.kind === "ios-open-safari") {
      setShowHelp(true);
    }
  };

  const canShow =
    !dismissed &&
    (deferred !== null ||
      capability.kind === "ios-safari-manual" ||
      capability.kind === "ios-open-safari");

  if (!canShow) return null;

  const subtitle =
    capability.kind === "ios-open-safari"
      ? "Install works in Safari on iPhone. Tap below for steps."
      : "Opens like an app, works offline, and keeps your medication reminders reliable.";

  const buttonLabel = deferred ? "Add to home screen" : "Add to Home Screen";

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
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void install()} className="rounded-full">
              <Download className="h-3.5 w-3.5 mr-1" />
              {buttonLabel}
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

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Purple to your home screen</DialogTitle>
            {capability.kind === "ios-open-safari" ? (
              <DialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    iOS only allows home screen installs from <strong>Safari</strong>, not Chrome or
                    other browsers.
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>
                      Copy this page URL, open <strong>Safari</strong>, and paste it in the address
                      bar.
                    </li>
                    <li>
                      Tap the Share button{" "}
                      <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> (square
                      with an up arrow).
                    </li>
                    <li>
                      Scroll down and tap <strong>Add to Home Screen</strong>, then Add.
                    </li>
                  </ol>
                </div>
              </DialogDescription>
            ) : (
              <DialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>
                      Tap the Share button{" "}
                      <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> at the
                      bottom of Safari (square with an up arrow).
                    </li>
                    <li>
                      Scroll the sheet and tap <strong>Add to Home Screen</strong>.
                    </li>
                    <li>
                      Tap <strong>Add</strong> in the top corner. Purple opens full screen from your
                      home screen.
                    </li>
                  </ol>
                  <p className="text-xs">
                    Apple Health sync is separate: after installing, connect via Health Auto Export
                    on the Tools page (web apps cannot show a HealthKit permission dialog).
                  </p>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          <Button onClick={() => setShowHelp(false)} className="rounded-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
