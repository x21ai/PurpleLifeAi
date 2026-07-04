type CaptureChannel = "runtime" | "sync";

export type CapturedClientError = {
  id: string;
  message: string;
  name?: string;
  stack?: string;
  source: string;
  channel: CaptureChannel;
  fatal: boolean;
  timestamp: string;
  extra?: Record<string, unknown>;
};

export const LAST_ERROR_STORAGE_KEY = "purple:diag:last-error:v1";
export const LAST_SYNC_ERROR_STORAGE_KEY = "purple:diag:last-sync-error:v1";
export const DIAGNOSTICS_UPDATED_EVENT = "purple:diag:error-updated";
export const DIAGNOSTICS_OPEN_EVENT = "purple:diag:open";

type CaptureOptions = {
  source: string;
  channel?: CaptureChannel;
  fatal?: boolean;
  extra?: Record<string, unknown>;
};

type SentryScope = {
  setTag?: (key: string, value: string) => void;
  setContext?: (key: string, context: Record<string, unknown>) => void;
  setExtra?: (key: string, value: unknown) => void;
  setLevel?: (level: string) => void;
};

type SentryLike = {
  withScope?: (callback: (scope: SentryScope) => void) => void;
  captureException?: (error: Error) => void;
  captureMessage?: (message: string) => void;
};

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error("Unknown error");
  }
}

function createErrorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function writeSessionValue(key: string, value: CapturedClientError): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage issues in restricted webviews.
  }
}

function readSessionValue(key: string): CapturedClientError | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CapturedClientError;
  } catch {
    return null;
  }
}

function sentryClient(): SentryLike | null {
  if (typeof window === "undefined") return null;
  const maybe = (window as Window & { Sentry?: SentryLike }).Sentry;
  if (!maybe) return null;
  if (typeof maybe.captureException !== "function" && typeof maybe.captureMessage !== "function") {
    return null;
  }
  return maybe;
}

function reportToSentry(payload: CapturedClientError, err: Error): void {
  const sentry = sentryClient();
  if (!sentry) return;

  if (typeof sentry.withScope === "function") {
    sentry.withScope((scope) => {
      scope.setTag?.("source", payload.source);
      scope.setTag?.("channel", payload.channel);
      scope.setTag?.("fatal", payload.fatal ? "true" : "false");
      scope.setLevel?.(payload.fatal ? "error" : "warning");
      scope.setContext?.("purple_diagnostics", {
        errorId: payload.id,
        timestamp: payload.timestamp,
        ...payload.extra,
      });
      sentry.captureException?.(err);
    });
    return;
  }

  sentry.captureException?.(err);
}

function announceDiagnosticsUpdate(payload: CapturedClientError): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CapturedClientError>(DIAGNOSTICS_UPDATED_EVENT, {
      detail: payload,
    }),
  );
}

export function requestDiagnosticsPanelOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DIAGNOSTICS_OPEN_EVENT));
}

export function captureClientError(
  errorLike: unknown,
  options: CaptureOptions,
): CapturedClientError {
  const err = toError(errorLike);
  const payload: CapturedClientError = {
    id: createErrorId(),
    name: err.name,
    message: err.message || "Unknown error",
    stack: err.stack,
    source: options.source,
    channel: options.channel ?? "runtime",
    fatal: options.fatal ?? false,
    timestamp: new Date().toISOString(),
    extra: options.extra,
  };

  writeSessionValue(LAST_ERROR_STORAGE_KEY, payload);
  if (payload.channel === "sync") {
    writeSessionValue(LAST_SYNC_ERROR_STORAGE_KEY, payload);
  }
  announceDiagnosticsUpdate(payload);
  reportToSentry(payload, err);
  return payload;
}

export function captureSyncError(
  errorLike: unknown,
  source: string,
  extra?: Record<string, unknown>,
): CapturedClientError {
  return captureClientError(errorLike, {
    source,
    channel: "sync",
    fatal: false,
    extra,
  });
}

export function getLastCapturedError(): CapturedClientError | null {
  return readSessionValue(LAST_ERROR_STORAGE_KEY);
}

export function getLastSyncError(): CapturedClientError | null {
  return readSessionValue(LAST_SYNC_ERROR_STORAGE_KEY);
}

let globalHandlersInstalled = false;

export function installGlobalErrorCapture(): () => void {
  if (typeof window === "undefined") return () => {};
  if (globalHandlersInstalled) return () => {};

  const onError = (event: ErrorEvent) => {
    captureClientError(event.error ?? event.message, {
      source: "window.onerror",
      channel: "runtime",
      fatal: true,
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureClientError(event.reason, {
      source: "window.unhandledrejection",
      channel: "runtime",
      fatal: false,
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  globalHandlersInstalled = true;

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    globalHandlersInstalled = false;
  };
}
