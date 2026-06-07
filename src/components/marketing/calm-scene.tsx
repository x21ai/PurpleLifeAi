import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ResponsiveImage, type PictureAsset } from "@/components/marketing/responsive-image";

type Variant = "full" | "split" | "band";

interface CalmHeroProps {
  image: PictureAsset;
  /** Override alt text from the asset when context demands it. */
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
  /** Mark this hero as the LCP image. Loads eager with fetchpriority="high". */
  priority?: boolean;
  /** Override the sizes attribute. Defaults to full-bleed (100vw). */
  sizes?: string;
}

/**
 * CalmHero, the calm-nature image treatment shared by /sign-in and /home2.
 * A full-bleed landscape, a quiet gradient, an eyebrow, and a serif headline.
 */
export function CalmHero({
  image,
  alt,
  eyebrow,
  headline,
  body,
  children,
  variant = "full",
  overlay = "fade",
  align = "bottom-left",
  className,
  as = "h1",
  priority = false,
  sizes,
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
      <ResponsiveImage
        asset={image}
        alt={alt}
        priority={priority}
        sizes={
          sizes ?? (variant === "split" ? "(min-width: 1024px) 55vw, 100vw" : "100vw")
        }
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className={cn("absolute inset-0", overlayCls)} aria-hidden="true" />
      <div className={cn("absolute inset-0 flex", alignCls)}>
        <div className={innerCls}>
          {eyebrow ? (
            <p
              className="label-eyebrow"
              style={{
                color: "#FFFFFF",
                opacity: 0.92,
                textShadow: "0 1px 2px rgba(0,0,0,0.45), 0 0 12px rgba(0,0,0,0.25)",
              }}
            >
              {eyebrow}
            </p>
          ) : null}
          {(() => {
            const Tag = as as ElementType;
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
  image: PictureAsset;
  eyebrow?: string;
  headline: ReactNode;
  body?: ReactNode;
  className?: string;
}

/** CalmBand, a quieter mid-page atmospheric band. Light type over a dimmed landscape. */
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
      sizes="100vw"
    />
  );
}

/**
 * HumanMoment, a portrait/hand/detail photo paired with one quiet sentence.
 * Two layouts: "portrait" (image left, caption right) and "quote" (image as
 * backdrop with a centered pull-quote).
 */
interface HumanMomentProps {
  image: PictureAsset;
  /** Override alt text from the asset. Optional — asset carries its own. */
  alt?: string;
  quote: ReactNode;
  attribution?: ReactNode;
  layout?: "portrait" | "quote";
  reverse?: boolean;
  className?: string;
}

export function HumanMoment({
  image,
  alt,
  quote,
  attribution,
  layout = "portrait",
  reverse = false,
  className,
}: HumanMomentProps) {
  if (layout === "quote") {
    return (
      <section
        data-reveal
        className={cn(
          "relative overflow-hidden h-[70vh] min-h-[480px] max-h-[820px]",
          className,
        )}
      >
        <ResponsiveImage
          asset={image}
          alt={alt}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/55" aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto max-w-3xl px-6 sm:px-10 text-center">
            <p
              className="font-serif text-3xl sm:text-5xl leading-[1.15] tracking-tight"
              style={{ color: "var(--background)" }}
            >
              &ldquo;{quote}&rdquo;
            </p>
            {attribution ? (
              <p
                className="mt-8 text-sm tracking-wide uppercase"
                style={{ color: "var(--background)", opacity: 0.75 }}
              >
                {attribution}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section data-reveal className={cn("mx-auto max-w-6xl px-6 sm:px-10 py-24 sm:py-32", className)}>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div className={cn("relative overflow-hidden rounded-3xl aspect-[4/5]", reverse && "lg:order-2")}>
          <ResponsiveImage
            asset={image}
            alt={alt}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className={cn(reverse && "lg:order-1")}>
          <p className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.12] tracking-tight text-foreground max-w-[20ch]">
            &ldquo;{quote}&rdquo;
          </p>
          {attribution ? (
            <p className="mt-8 text-sm tracking-wide uppercase text-muted-foreground">
              {attribution}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * QuietStat, a single oversized phrase, Apple-style, with one line of context.
 * Use sparingly. Once per page at most.
 */
interface QuietStatProps {
  stat: ReactNode;
  caption?: ReactNode;
  className?: string;
}

export function QuietStat({ stat, caption, className }: QuietStatProps) {
  return (
    <section data-reveal className={cn("mx-auto max-w-4xl px-6 sm:px-10 py-28 sm:py-40 text-center", className)}>
      <p className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[1.02] tracking-tight text-foreground">
        {stat}
      </p>
      {caption ? (
        <p className="mt-8 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {caption}
        </p>
      ) : null}
    </section>
  );
}

/**
 * StillLife, a small detail shot used as a punctuation mark between sections.
 * No headline; just the image and breathing room.
 */
interface StillLifeProps {
  image: PictureAsset;
  alt?: string;
  className?: string;
}

export function StillLife({ image, alt, className }: StillLifeProps) {
  return (
    <section
      data-reveal
      className={cn(
        "relative overflow-hidden h-[55vh] min-h-[360px] max-h-[640px]",
        className,
      )}
    >
      <ResponsiveImage
        asset={image}
        alt={alt}
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </section>
  );
}