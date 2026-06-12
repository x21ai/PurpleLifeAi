import { cn } from "@/lib/utils";

/**
 * Three pulsing purple dots used as the live-recording indicator.
 */
export function VoiceWave({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-[var(--purple-primary)] animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
