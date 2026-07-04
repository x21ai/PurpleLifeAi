import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useNativeAppContext } from "@/lib/native-app-context";

type Props = {
  title: string;
  /** Optional override for the close ("X") target. Defaults to history back or /settings. */
  closeTo?: string;
  /** Right side rail content (desktop only). */
  aside?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Oura-like full-bleed dark sheet layout.
 * - Mobile: single column, 20px gutter, sheet-canvas background.
 * - Tablet: centered max-w-2xl.
 * - Desktop: optional two-column with sticky `aside` rail.
 */
export function SheetPage({ title, closeTo, aside, children }: Props) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isNativeApp } = useNativeAppContext();
  const onClose = () => {
    if (closeTo) {
      navigate({ to: closeTo as never });
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/settings" });
  };
  // Hide close on the canonical hub pages so they don't feel modal.
  const showClose = pathname !== "/settings";
  const outerClass = isNativeApp
    ? "mx-auto w-full max-w-xl px-5 pt-4 pb-6"
    : "mx-auto w-full max-w-5xl px-5 pt-6 pb-24 sm:px-8 sm:pt-10 lg:px-12";
  return (
    <div className="sheet-canvas">
      <div className={outerClass}>
        <header className="relative flex items-center justify-center pb-6 sm:pb-10">
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-center text-xl font-normal tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
        </header>
        <div className={aside ? "grid gap-6 lg:grid-cols-[1fr_320px]" : ""}>
          <main className="space-y-4 sm:space-y-5">{children}</main>
          {aside && (
            <aside className="hidden lg:block">
              <div className="sticky top-8 space-y-4">{aside}</div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export function SheetCard({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return <section id={id} className={`sheet-card p-5 sm:p-7 ${className}`}>{children}</section>;
}

export function SheetSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pt-6 pb-3 text-[11px] uppercase tracking-[0.18em] sheet-muted">{children}</p>
  );
}

export function SheetRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7 sheet-link transition-colors">
      <div className="flex min-w-0 items-center gap-4">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] text-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-[13px] sheet-muted">{subtitle}</p>}
        </div>
      </div>
      {trailing && <div className="shrink-0 sheet-muted">{trailing}</div>}
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}
