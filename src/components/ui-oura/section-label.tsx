import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
  as: As = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <As
      className={cn(
        "font-serif text-foreground tracking-tight",
        As === "h1" && "text-3xl sm:text-4xl leading-tight",
        As === "h2" && "text-xl sm:text-2xl",
        As === "h3" && "text-lg",
        className,
      )}
    >
      {children}
    </As>
  );
}
