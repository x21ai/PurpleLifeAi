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
        "flex flex-col items-center justify-center text-center transition outline-none",
        active ? "scale-[1.4] py-6" : "opacity-70 hover:opacity-100 py-3",
      )}
    >
      <span
        className={cn(
          "numeric-display text-foreground",
          active ? "text-[80px] sm:text-[96px]" : "text-[40px] sm:text-[48px]",
        )}
      >
        {typeof value === "number" ? <NumberCountUp value={value} /> : value}
      </span>
      <span
        className={cn(
          "label-eyebrow mt-2",
          active && "text-foreground/70",
        )}
      >
        {label}
      </span>
    </button>
  );
}