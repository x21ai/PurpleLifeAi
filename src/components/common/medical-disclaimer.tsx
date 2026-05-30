import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HIPAA-aware educational disclaimer. Render anywhere the app shows AI-generated
 * health insights, lab interpretations, supplement suggestions, or trends.
 */
export function MedicalDisclaimer({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <p
        className={cn(
          "text-[11px] leading-snug text-muted-foreground flex items-start gap-1.5",
          className,
        )}
      >
        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
        <span>Educational only — not medical advice. Always consult your medical practitioner.</span>
      </p>
    );
  }
  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-200 p-3 flex items-start gap-2 text-xs",
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <p className="leading-relaxed">
        <strong className="font-medium">Educational information only.</strong> This is not medical
        advice, diagnosis, or treatment. Always consult your physician or qualified medical
        practitioner before changing medications, starting supplements, or acting on any insight
        shown here.
      </p>
    </div>
  );
}