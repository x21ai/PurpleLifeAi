import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ScoreBand } from "./score-hero";

const STATUS_COLOR: Record<ScoreBand, string> = {
  excellent: "text-[#6FB394]",
  good: "text-[#82A4D4]",
  fair: "text-[#E8C39E]",
  attention: "text-[#E8745C]",
};

/**
 * 1:1.2 card — title top, status (band color), large value bottom-left.
 * Optional tap target via `to`.
 */
export function MetricCard({
  title,
  status,
  band,
  value,
  unit,
  to,
  className,
}: {
  title: string;
  status?: string;
  band?: ScoreBand;
  value: React.ReactNode;
  unit?: string;
  to?: string;
  className?: string;
}) {
  const Body = (
    <div
      className={cn(
        "group relative flex h-full flex-col justify-between rounded-[24px] bg-card p-5 ring-1 ring-inset ring-border/60 transition",
        to && "hover:ring-foreground/30",
        className,
      )}
      style={{ aspectRatio: "1 / 1.2" }}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="label-eyebrow">{title}</p>
          {status && (
            <p
              className={cn(
                "mt-2 font-serif text-[18px] leading-snug",
                band ? STATUS_COLOR[band] : "text-foreground",
              )}
            >
              {status}
            </p>
          )}
        </div>
        {to && (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
        )}
      </header>
      <div>
        <p className="numeric-display text-[48px] leading-none text-foreground">
          {value}
          {unit && <span className="ml-1 text-[18px] text-muted-foreground">{unit}</span>}
        </p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {Body}
      </Link>
    );
  }
  return Body;
}