import * as React from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateStripProps {
  value: Date;
  onChange: (d: Date) => void;
  /** How many days back from today to render. Default 30. */
  daysBack?: number;
  className?: string;
}

/**
 * Horizontal, snap-scrolling date strip inspired by health-tracking apps
 * (Olivia, Apple Fitness). Renders `daysBack` rounded day tiles ending at
 * today; the selected tile is highlighted and auto-scrolled into view.
 */
export function DateStrip({ value, onChange, daysBack = 30, className }: DateStripProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const days = React.useMemo(
    () => Array.from({ length: daysBack }, (_, i) => addDays(today, -(daysBack - 1 - i))),
    [today, daysBack],
  );

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [value]);

  const goDelta = (delta: number) => {
    const next = addDays(value, delta);
    if (next > today) return;
    if (next < days[0]) return;
    onChange(next);
  };

  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <section
      className={cn("mt-8", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goDelta(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goDelta(1);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-medium text-foreground tabular-nums">
          {format(value, "MMM d")}
        </span>
        <div className="flex items-center gap-1.5">
          {!isSameDay(value, today) && (
            <button
              type="button"
              onClick={() => onChange(today)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary/60 transition-colors"
            >
              Today
            </button>
          )}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Pick a date"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(d) => {
                  if (d) {
                    onChange(startOfDay(d));
                    setPickerOpen(false);
                  }
                }}
                disabled={(d) => d > today}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Select a date"
      >
        {days.map((d) => {
          const isSelected = isSameDay(d, value);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onChange(d)}
              className={cn(
                "shrink-0 snap-center w-14 sm:w-16 h-[68px] rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-colors",
                isSelected
                  ? "bg-card border-primary ring-1 ring-primary text-foreground shadow-sm"
                  : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:bg-card",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.12em]",
                  isSelected && isToday ? "text-primary font-semibold" : "",
                )}
              >
                {isToday ? "Today" : format(d, "EEE")}
              </span>
              <span
                className={cn(
                  "font-serif text-xl tabular-nums",
                  isSelected ? "text-foreground" : "",
                )}
              >
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}