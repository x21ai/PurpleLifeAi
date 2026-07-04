import { cn } from "@/lib/utils";
import { NumberCountUp } from "./number-countup";

/**
 * Today screen three-up score row. One tile is the active focus (1.4x).
 * Tap → opens detail.
 */
export function ScoreTile({
  value,
  label,
  active,
  onClick,
}: {
  value: number | string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center text-center outline-none glass-press rounded-[18px] transition-[transform,opacity,box-shadow] duration-200",
        active
          ? "glass-card scale-[1.02] py-5 sm:py-6 ring-1 ring-primary/35 shadow-[0_0_28px_rgba(176,132,209,0.12)]"
          : "py-4 opacity-70 hover:opacity-100 hover:bg-white/[0.03]",
      )}
    >
      <span
        className={cn(
          "numeric-display text-foreground",
          active ? "text-[56px] sm:text-[72px]" : "text-[36px] sm:text-[44px]",
        )}
      >
        {typeof value === "number" ? <NumberCountUp value={value} /> : value}
      </span>
      <span
        className={cn(
          "label-eyebrow mt-2",
          active ? "text-foreground/85 font-semibold" : "text-muted-foreground font-medium",
        )}
      >
        {label}
      </span>
    </button>
  );
}