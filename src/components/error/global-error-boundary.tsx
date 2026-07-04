import { Component, type ReactNode } from "react";
import { isNativeApp } from "@/lib/native/capacitor";
import {
  captureClientError,
  requestDiagnosticsPanelOpen,
  type CapturedClientError,
} from "@/lib/observability/client-errors";
import { AppCrashFallback } from "./app-crash-fallback";

type GlobalErrorBoundaryProps = {
  children: ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
  captured: CapturedClientError | null;
};

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  state: GlobalErrorBoundaryState = {
    hasError: false,
    captured: null,
  };

  static getDerivedStateFromError(): Partial<GlobalErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    const captured = captureClientError(error, {
      source: "react.error-boundary",
      channel: "runtime",
      fatal: true,
      extra: { componentStack: info.componentStack ?? null },
    });
    this.setState({ captured });
  }

  private retry = () => {
    this.setState({ hasError: false, captured: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorId = this.state.captured?.id ?? "unknown";
    const supportHref = `/contact?source=global-error&errorId=${encodeURIComponent(errorId)}`;

    return (
      <AppCrashFallback
        title="Purple could not finish loading"
        description="The app hit an unexpected error. Try again, then share the error ID if this keeps happening."
        errorId={errorId}
        onRetry={this.retry}
        supportHref={supportHref}
        onOpenDiagnostics={requestDiagnosticsPanelOpen}
        showDiagnosticsAction={isNativeApp()}
      />
    );
  }
}
