import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TimePicker12hProps {
  /** Canonical 24h "HH:mm" value. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

function parse(value: string): { h12: number; m: number; period: "AM" | "PM" } {
  const [hStr, mStr] = (value || "").split(":");
  const h = Math.max(0, Math.min(23, parseInt(hStr ?? "0", 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt(mStr ?? "0", 10) || 0));
  const period: "AM" | "PM" = h < 12 ? "AM" : "PM";
  const h12 = ((h + 11) % 12) + 1;
  return { h12, m, period };
}

function format24(h12: number, m: number, period: "AM" | "PM"): string {
  const base = h12 % 12; // 12 -> 0
  const h24 = period === "PM" ? base + 12 : base;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker12h({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: TimePicker12hProps) {
  const { h12, m, period } = parse(value);

  const update = (next: { h12?: number; m?: number; period?: "AM" | "PM" }) => {
    onChange(format24(next.h12 ?? h12, next.m ?? m, next.period ?? period));
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={ariaLabel}
    >
      <Select value={String(h12)} onValueChange={(v) => update({ h12: parseInt(v, 10) })}>
        <SelectTrigger className="h-9 w-[64px] px-2" aria-label="Hour">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={String(m)} onValueChange={(v) => update({ m: parseInt(v, 10) })}>
        <SelectTrigger className="h-9 w-[68px] px-2" aria-label="Minute">
          <SelectValue>{String(m).padStart(2, "0")}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {MINUTES.map((mm) => (
            <SelectItem key={mm} value={String(mm)}>
              {String(mm).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={period}
        onValueChange={(v) => update({ period: v as "AM" | "PM" })}
      >
        <SelectTrigger className="h-9 w-[68px] px-2" aria-label="AM or PM">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}