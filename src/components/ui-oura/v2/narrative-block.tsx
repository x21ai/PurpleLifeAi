import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The AI daily insight. System sans body with the Sparkles marker.
 * Always max-w-prose for reading comfort.
 */
export function NarrativeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-ai rounded-[24px] p-6 max-w-[600px]",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 text-[color:var(--purple-primary)] mb-3" />
      <p className="body-serif text-foreground/85 m-0">{children}</p>
    </div>
  );
}