import * as React from "react";

/**
 * Condition-aware follow-up chips rendered under an assistant reply.
 */
export function FollowUpChips({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (s: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left text-xs rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary px-3 py-1.5 transition text-foreground/85"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
