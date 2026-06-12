import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "purple-session-count";
const DISMISSED_KEY = "purple-install-dismissed";
const SESSION_TS_KEY = "purple-session-ts";
const SESSION_GAP_MIN = 30;

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Count distinct sessions (30+ min apart).
    const now = Date.now();
    const last = Number(localStorage.getItem(SESSION_TS_KEY) ?? 0);
    let count = Number(localStorage.getItem(SESSION_KEY) ?? 0);
    if (now - last > SESSION_GAP_MIN * 60 * 1000) {
      count += 1;
      localStorage.setItem(SESSION_KEY, String(count));
      localStorage.setItem(SESSION_TS_KEY, String(now));
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (count >= 3) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:left-8 md:translate-x-0 z-50 max-w-sm rounded-2xl border border-border bg-card shadow-lg p-4 flex items-center gap-3"
      role="dialog"
      aria-label="Install Purple"
    >
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm text-foreground">Keep Purple on your home screen?</p>
        <p className="text-xs text-muted-foreground mt-0.5">Faster to open, works offline.</p>
      </div>
      <Button size="sm" onClick={install} className="rounded-full">
        <Download className="h-3.5 w-3.5 mr-1" /> Install
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="text-muted-foreground hover:text-foreground p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
