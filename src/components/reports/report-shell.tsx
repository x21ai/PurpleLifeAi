import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dark "clinical report" shell used by /reports, /reports/new, /reports/:id.
 * Mirrors the reference: teal-green atmospheric glow at top, large tracked
 * title, and a back arrow. An optional `right` slot renders page actions.
 * Content area renders below.
 */
export function ReportShell({
  title,
  back,
  right,
  children,
}: {
  title: string;
  back?: { to: string; label?: string };
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="report-canvas">
      <header className="px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          {back ? (
            <Link
              to={back.to}
              className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-accent hover:text-foreground"
              aria-label={back.label ?? "Back"}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <span className="h-10 w-10" aria-hidden />
          )}
          <h1 className="report-eyebrow text-center text-foreground">{title}</h1>
          <div className="flex items-center justify-end">
            {right ?? <span className="h-10 w-10" aria-hidden />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 pt-6 pb-32">{children}</main>
    </div>
  );
}

export function ReportCard({
  className,
  children,
  strong = false,
}: {
  className?: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <section className={cn(strong ? "report-card-strong" : "report-card", "p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function ReportSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn("font-serif text-2xl text-foreground", className)}>{children}</h2>;
}

export type ReportPillTone = "neutral" | "success" | "warning" | "alert";
export function ReportPill({
  tone = "neutral",
  children,
}: {
  tone?: ReportPillTone;
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "report-pill report-pill-success"
      : tone === "warning"
        ? "report-pill report-pill-warning"
        : tone === "alert"
          ? "report-pill report-pill-alert"
          : "report-pill";
  return <span className={cls}>{children}</span>;
}
