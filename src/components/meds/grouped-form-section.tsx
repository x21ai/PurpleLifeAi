import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function GroupedFormLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-6 mb-2 px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground first:mt-0",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function GroupedFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function GroupedFormRow({
  label,
  subtitle,
  children,
  className,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-3.5", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="shrink-0 flex justify-end max-w-[60%]">{children}</div>
      </div>
    </div>
  );
}

export function GroupedFormField({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3.5 space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function GroupedFormSwitchRow({
  label,
  subtitle,
  checked,
  onCheckedChange,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="pr-3 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function GroupedFormInsetButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-5 py-3.5 text-sm font-medium text-primary hover:bg-secondary/40 transition-colors text-left",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FormSectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden>
      <div className="h-3 w-20 rounded bg-muted" />
      <div className="h-32 rounded-2xl bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="h-24 rounded-2xl bg-muted" />
    </div>
  );
}
