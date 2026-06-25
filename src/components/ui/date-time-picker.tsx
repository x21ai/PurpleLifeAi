import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TimePicker12h } from "@/components/ui/time-picker-12h";

export interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  allowNow?: boolean;
  disableFuture?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  placeholder = "Pick a date & time",
  allowNow = true,
  disableFuture = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const timeStr = value ? format(value, "HH:mm") : "";

  const setDate = (d: Date | undefined) => {
    if (!d) return;
    const next = new Date(d);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    } else {
      const now = new Date();
      next.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
    onChange(next);
  };

  const setTime = (t: string) => {
    const [h, m] = t.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const base = value ? new Date(value) : new Date();
    base.setHours(h, m, 0, 0);
    onChange(base);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {value ? format(value, "EEE, MMM d, yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => { setDate(d); }}
            disabled={(d) => (disableFuture ? d > new Date() : false)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <div className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <TimePicker12h value={timeStr} onChange={setTime} aria-label="Time" />
      </div>
      {allowNow && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(new Date())}
          className="h-9 text-xs text-muted-foreground"
        >
          Now
        </Button>
      )}
    </div>
  );
}