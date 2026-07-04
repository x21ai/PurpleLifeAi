import { useState } from "react";
import { Button } from "@/components/ui/button";

type AppCrashFallbackProps = {
  title: string;
  description: string;
  errorId: string;
  onRetry: () => void;
  supportHref: string;
  onOpenDiagnostics?: () => void;
  showDiagnosticsAction?: boolean;
};

export function AppCrashFallback({
  title,
  description,
  errorId,
  onRetry,
  supportHref,
  onOpenDiagnostics,
  showDiagnosticsAction = false,
}: AppCrashFallbackProps) {
  const [copied, setCopied] = useState(false);

  const copyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(errorId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Error ID:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{errorId}</code>
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" className="glass-press min-h-11" onClick={onRetry}>
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => void copyErrorId()}
          >
            {copied ? "Copied" : "Copy error ID"}
          </Button>
          {showDiagnosticsAction && onOpenDiagnostics ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={onOpenDiagnostics}
            >
              Open diagnostics
            </Button>
          ) : null}
          <a
            href={supportHref}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
