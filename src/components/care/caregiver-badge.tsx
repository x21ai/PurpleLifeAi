import { HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small badge shown wherever `created_by_kind === 'caregiver'`. Lets owners
 * (and caregivers re-reading data) see which rows were authored by a caregiver
 * rather than the patient themselves or a system source.
 */
export function CaregiverBadge({
  createdByKind,
  className,
}: {
  createdByKind: string | null | undefined;
  className?: string;
}) {
  if (createdByKind !== "caregiver") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        className,
      )}
      title="Logged by a caregiver"
    >
      <HandHeart className="h-2.5 w-2.5" />
      Logged by caregiver
    </span>
  );
}