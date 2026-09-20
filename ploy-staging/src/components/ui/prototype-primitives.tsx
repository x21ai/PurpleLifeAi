import type { ReactNode } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @ployComponent
 * @ployComponentId purplelife-prototype-card
 * @ployComponentType component
 * @ployComponentDescription Shared PurpleLife prototype card with white primary and lavender support surfaces.
 * @ployComponentTags purplelife card prototype
 * @ployComponentStatus stable
 */
export function PrototypeCard({ children, tone = "primary", className }: { children: ReactNode; tone?: "primary" | "support"; className?: string }) {
  return <div className={cn("rounded-[28px] p-5", tone === "primary" ? "bg-white shadow-sm ring-1 ring-purplelife-line" : "bg-purplelife-tint", className)}>{children}</div>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-prototype-empty-state
 * @ployComponentType component
 * @ployComponentDescription Centered empty state for PurpleLife lists and records with an explanatory next-state description.
 * @ployComponentTags purplelife empty-state prototype
 * @ployComponentStatus stable
 */
export function PrototypeEmptyState({ icon, title, description, className }: { icon: ReactNode; title: string; description: string; className?: string }) {
  return <PrototypeCard className={cn("text-center", className)}><span className="mx-auto grid size-11 place-items-center rounded-[16px] bg-purplelife-tint text-purplelife-accent">{icon}</span><h3 className="mt-3 text-[15px] font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-[1.5] text-purplelife-muted">{description}</p></PrototypeCard>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-prototype-state-toggle
 * @ployComponentType component
 * @ployComponentDescription Two-option reviewer control for switching between empty and populated local prototype states.
 * @ployComponentTags purplelife segmented-control prototype
 * @ployComponentStatus stable
 */
export function PrototypeStateToggle({ first, second, value, onChange, label = "Preview state" }: { first: string; second: string; value: "first" | "second"; onChange: (value: "first" | "second") => void; label?: string }) {
  return <div className="flex rounded-[18px] bg-purplelife-rail p-1" aria-label={label}><button type="button" onClick={() => onChange("first")} className={cn("min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold", value === "first" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted")}>{first}</button><button type="button" onClick={() => onChange("second")} className={cn("min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold", value === "second" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted")}>{second}</button></div>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-prototype-toast
 * @ployComponentType component
 * @ployComponentDescription Local prototype status message with neutral, success, and error tones that never implies production persistence.
 * @ployComponentTags purplelife toast status prototype
 * @ployComponentStatus stable
 */
export function PrototypeToast({ title, detail, tone = "info" }: { title: string; detail?: string; tone?: "info" | "success" | "error" }) {
  const Icon = tone === "success" ? Check : tone === "error" ? AlertTriangle : Info;
  return <div role="status" className={cn("flex items-start gap-3 rounded-[20px] p-4 text-left", tone === "success" ? "bg-purplelife-mint/20 text-purplelife-ink" : tone === "error" ? "bg-purplelife-peach text-purplelife-ink" : "bg-purplelife-tint text-purplelife-ink")}><Icon size={18} className={cn("mt-0.5 shrink-0", tone === "success" ? "text-purplelife-mint" : tone === "error" ? "text-purplelife-coral" : "text-purplelife-accent")} /><span><span className="block text-[13px] font-semibold">{title}</span>{detail && <span className="mt-1 block text-[11px] leading-[1.45] text-purplelife-muted">{detail}</span>}</span></div>;
}
