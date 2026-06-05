import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "full" | "split" | "band";

interface CalmHeroProps {
  image: string;
  alt?: string;
  eyebrow?: string;
  headline: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  variant?: Variant;
  /** "fade" = sign-in style background-fade. "dim" = uniform dark overlay so light type reads over photo. */
  overlay?: "fade" | "dim";
  align?: "bottom-left" | "center";
  className?: string;
  /** Heading tag for the headline. Default h1. Use "div" to render no heading (e.g. when the page already has an h1). */
  as?: "h1" | "h2" | "div";
}

/**
 * CalmHero — the calm-nature image treatment shared by /sign-in and /home2.
 * A full-bleed landscape, a quiet gradient, an eyebrow, and a serif headline.
 */
export function CalmHero({
  image,
  alt = "",
  eyebrow,
  headline,
  body,
  children,
  variant = "full",
  overlay = "fade",
  align = "bottom-left",
  className,
  as = "h1",
}: CalmHeroProps) {
  const heightCls =
    variant === "split"
      ? "h-[42vh] sm:h-[52vh] lg:h-screen lg:sticky lg:top-0"
      : variant === "band"
        ? "h-[60vh] min-h-[420px]"
        : "h-[88vh] min-h-[560px] max-h-[920px]";

  // Overlay: "fade" keeps the photo visible and fades to background so type sits on the page color.
  // "dim" tints the photo so light type reads anywhere.
  const overlayCls =
    overlay === "fade"
      ? variant === "split"
        ? "bg-gradient-to-b lg:bg-gradient-to-r from-background/0 via-background/0 to-background/85"
        : "bg-gradient-to-b from-background/0 via-background/10 to-background/90"
      : "bg-foreground/45";

  const useLightType = overlay === "dim";

  const alignCls =
    align === "center"
      ? "items-center justify-center text-center"
      : "items-end justify-start";

  const innerCls =
    align === "center"
      ? "mx-auto max-w-3xl px-6 sm:px-10"
      : variant === "split"
        ? "p-6 sm:p-10 lg:p-14 flex flex-col justify-end h-full"
        : "mx-auto w-full max-w-6xl px-6 sm:px-10 pb-14 sm:pb-20";

  return (
    <section className={cn("relative overflow-hidden", heightCls, className)}>
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1280}
      />
      <div className={cn("absolute inset-0", overlayCls)} aria-hidden="true" />
      <div className={cn("absolute inset-0 flex", alignCls)}>
        <div className={innerCls}>
          {eyebrow ? (
            <p
              className="label-eyebrow"
              style={useLightType ? { color: "var(--background)", opacity: 0.85 } : undefined}
            >
              {eyebrow}
            </p>
          ) : null}
          {(() => {
            const Tag = as as keyof JSX.IntrinsicElements;
            return (
              <Tag
            className={cn(
              "font-serif tracking-tight",
              eyebrow ? "mt-5" : "",
              variant === "full"
                ? "text-5xl sm:text-7xl lg:text-[6.5rem] leading-[0.98] max-w-4xl"
                : variant === "band"
                  ? "text-4xl sm:text-6xl leading-[1.05]"
                  : "text-4xl sm:text-5xl lg:text-6xl leading-[1.02]",
            )}
            style={useLightType ? { color: "var(--background)" } : undefined}
          >
            {headline}
              </Tag>
            );
          })()}
          {body ? (
            <p
              className={cn(
                "mt-6 text-base sm:text-lg leading-relaxed",
                align === "center" ? "max-w-xl mx-auto" : "max-w-xl",
                !useLightType && "text-foreground/75",
              )}
              style={useLightType ? { color: "var(--background)", opacity: 0.85 } : undefined}
            >
              {body}
            </p>
          ) : null}
          {children ? <div className="mt-9">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

interface CalmBandProps {
  image: string;
  eyebrow?: string;
  headline: ReactNode;
  body?: ReactNode;
  className?: string;
}

/** CalmBand — a quieter mid-page atmospheric band. Light type over a dimmed landscape. */
export function CalmBand(props: CalmBandProps) {
  return (
    <CalmHero
      image={props.image}
      eyebrow={props.eyebrow}
      headline={props.headline}
      body={props.body}
      variant="band"
      overlay="dim"
      align="center"
      className={props.className}
    />
  );
}