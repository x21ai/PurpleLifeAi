import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light "metric drilldown" shell used by /reports/trends/:metric (and aligned
 * for any biomarker detail). Warm-white background, oversized title, sheet
 * card with chart, AI prompt rail beneath.
 */
export function MetricShell({
  back,
  children,
}: {
  back?: { to: string; label?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="metric-canvas">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-6 pb-32">
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {back.label ?? "Back"}
          </Link>
        )}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function MetricTitle({
  title,
  status,
}: {
  title: string;
  status?: { tone: "alert" | "warn" | "good" | "neutral"; label: string; value?: string };
}) {
  const cls =
    status?.tone === "alert"
      ? "metric-pill-alert"
      : status?.tone === "warn"
        ? "metric-pill-warn"
        : status?.tone === "good"
          ? "metric-pill-good"
          : "bg-secondary text-foreground";
  return (
    <div className="metric-sheet p-6 sm:p-8">
      <h1 className="font-serif text-[34px] sm:text-5xl leading-[1.05] tracking-tight text-foreground capitalize">
        {title}
      </h1>
      {status && (
        <div className={cn("mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5", cls)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="text-sm font-medium">
            {status.label}
            {status.value ? (
              <span className="ml-1.5 text-foreground/70 font-normal">{status.value}</span>
            ) : null}
          </span>
        </div>
      )}
    </div>
  );
}

export function MetricStatCards({
  latest,
  optimal,
}: {
  latest: {
    value: React.ReactNode;
    unit?: string | null;
    tone?: "alert" | "warn" | "good" | "neutral";
  };
  optimal: { value: React.ReactNode; unit?: string | null };
}) {
  const valCls =
    latest.tone === "alert"
      ? "metric-value-alert"
      : latest.tone === "warn"
        ? "metric-value-warn"
        : latest.tone === "good"
          ? "metric-value-good"
          : "text-foreground";
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="metric-card px-5 py-4">
        <p className="text-sm text-foreground/60">Latest result</p>
        <p className="mt-2 text-3xl font-medium">
          <span className={cn("numeric", valCls)}>{latest.value}</span>
          {latest.unit && (
            <span className="ml-1.5 text-base text-foreground/60 font-normal">{latest.unit}</span>
          )}
        </p>
      </div>
      <div className="metric-card px-5 py-4">
        <p className="text-sm text-foreground/60">Optimal range</p>
        <p className="mt-2 text-3xl font-medium">
          <span className="numeric metric-value-good">{optimal.value}</span>
          {optimal.unit && (
            <span className="ml-1.5 text-base text-foreground/60 font-normal">{optimal.unit}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function AskPurpleRail({
  title = "Ask Purple",
  prompts,
  onPick,
}: {
  title?: string;
  prompts: string[];
  onPick?: (q: string) => void;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3">
        {prompts.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onPick?.(p)}
              className="metric-prompt flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--purple-soft)] text-[color:var(--purple-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-[15px] text-foreground leading-snug">{p}</span>
              <ArrowRight className="h-4 w-4 text-foreground/40" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-foreground/55">
        Purple's answers are not medical advice. Speak to a licensed provider for personal guidance.
      </p>
    </section>
  );
}
