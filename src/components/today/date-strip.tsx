import * as React from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateStripProps {
  value: Date;
  onChange: (d: Date) => void;
  /** Past days to show (not counting today). Default 7. */
  daysBack?: number;
  /** Future days to show after today (visible, not selectable). Default 7. */
  daysForward?: number;
  className?: string;
}

/**
 * Nudge scroll until the tile's visual center matches the scroller's center.
 * Uses getBoundingClientRect so padding and responsive widths stay correct.
 */
function scrollTileToCenter(scroller: HTMLElement, tile: HTMLElement) {
  const scrollerRect = scroller.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
  const tileCenter = tileRect.left + tileRect.width / 2;
  scroller.scrollLeft += tileCenter - scrollerCenter;
}

/**
 * Horizontal date strip: symmetric past/today/future tiles; today centered on load
 * and on resize at any viewport width.
 */
export function DateStrip({
  value,
  onChange,
  daysBack = 7,
  daysForward = 7,
  className,
}: DateStripProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const days = React.useMemo(() => {
    const past = Array.from({ length: daysBack }, (_, i) =>
      addDays(today, -(daysBack - i)),
    );
    const future = Array.from({ length: daysForward }, (_, i) =>
      addDays(today, i + 1),
    );
    return [...past, today, ...future];
  }, [today, daysBack, daysForward]);

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const selectedRef = React.useRef<HTMLButtonElement>(null);
  const todayRef = React.useRef<HTMLButtonElement>(null);
  /** Half the scroller width minus half a tile; lets any day scroll to true center. */
  const [edgePad, setEdgePad] = React.useState(0);

  const measureEdgePad = React.useCallback(() => {
    const scroller = scrollerRef.current;
    const tile = todayRef.current ?? selectedRef.current;
    if (!scroller) return;
    const tileW = tile?.offsetWidth ?? 56;
    setEdgePad(Math.max(0, scroller.clientWidth / 2 - tileW / 2));
  }, []);

  const centerActiveTile = React.useCallback(() => {
    const scroller = scrollerRef.current;
    const target = isSameDay(value, today) ? todayRef.current : selectedRef.current;
    if (!scroller || !target) return;
    scrollTileToCenter(scroller, target);
  }, [value, today]);

  React.useLayoutEffect(() => {
    centerActiveTile();
    const id = requestAnimationFrame(() => {
      centerActiveTile();
      requestAnimationFrame(centerActiveTile);
    });
    return () => cancelAnimationFrame(id);
  }, [centerActiveTile, days]);

  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const ro = new ResizeObserver(() => {
      measureEdgePad();
      centerActiveTile();
    });
    ro.observe(scroller);
    measureEdgePad();
    return () => ro.disconnect();
  }, [centerActiveTile, measureEdgePad]);

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
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-sm font-semibold text-foreground tabular-nums tracking-tight">
          {format(value, "MMM d")}
        </span>
        <div className="flex items-center gap-1.5">
          {!isSameDay(value, today) && (
            <button
              type="button"
              onClick={() => onChange(today)}
              className="glass-pill glass-press px-2.5 py-1 text-[11px] font-medium text-foreground hover:text-primary transition-colors"
            >
              Today
            </button>
          )}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Pick a date"
                className="glass-pill glass-press inline-flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
        className="-mx-5 sm:-mx-8 overflow-x-auto snap-x snap-mandatory scroll-px-[50%] px-5 sm:px-8 scrollbar-none [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Select a date"
      >
        <div
          className="flex w-max gap-2"
          style={{ paddingLeft: edgePad, paddingRight: edgePad }}
        >
          {days.map((d) => {
            const isSelected = isSameDay(d, value);
            const isToday = isSameDay(d, today);
            const isFuture = d > today;
            return (
              <button
                key={d.toISOString()}
                ref={isToday ? todayRef : isSelected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={isFuture}
                disabled={isFuture}
                onClick={() => {
                  if (!isFuture) onChange(d);
                }}
                className={cn(
                  "shrink-0 snap-center w-14 sm:w-16 h-[72px] rounded-[18px] flex flex-col items-center justify-center gap-1 transition-all duration-200 glass-press",
                  isFuture &&
                    "opacity-30 cursor-default glass-surface text-muted-foreground border-transparent",
                  !isFuture &&
                    (isSelected
                      ? "glass-card ring-1 ring-primary/40 text-foreground shadow-[0_0_24px_rgba(176,132,209,0.15)]"
                      : "glass-surface text-muted-foreground hover:text-foreground hover:ring-1 hover:ring-white/10"),
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
                    isSelected && !isFuture ? "text-foreground" : "",
                  )}
                >
                  {format(d, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
