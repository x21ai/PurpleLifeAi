import { cn } from "@/lib/utils";
import { NumberCountUp } from "./number-countup";

export type ScoreBand = "excellent" | "good" | "fair" | "attention";

export function bandForReadiness(readiness: number): ScoreBand {
  if (readiness >= 85) return "excellent";
  if (readiness >= 70) return "good";
  if (readiness >= 50) return "fair";
  return "attention";
}

const BAND_CLASS: Record<ScoreBand, string> = {
  excellent: "grad-excellent",
  good: "grad-good",
  fair: "grad-fair",
  attention: "grad-attention",
};

/**
 * The hero block. One score, one phrase, one paragraph.
 * Edge-to-edge band gradient, no border. Generous whitespace.
 */
export function ScoreHero({
  score,
  label = "Readiness",
  phrase,
  narrative,
  band,
  size = "lg",
  className,
}: {
  score: number;
  label?: string;
  phrase?: string;
  narrative?: string | null;
  band?: ScoreBand;
  size?: "md" | "lg";
  className?: string;
}) {
  const b = band ?? bandForReadiness(score);
  const numberSize = size === "lg" ? "text-[96px] sm:text-[120px]" : "text-[72px] sm:text-[96px]";
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[32px] text-white",
        BAND_CLASS[b],
        size === "lg" ? "min-h-[400px] sm:min-h-[480px]" : "min-h-[320px]",
        className,
      )}
    >
      {/* Decorative mountain silhouette */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 300"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-25"
        preserveAspectRatio="none"
      >
        <path
          d="M0,300 L0,200 L120,120 L200,170 L300,80 L400,160 L500,110 L600,180 L600,300 Z"
          fill="white"
        />
      </svg>

      <div className="relative flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <p
          className={cn(
            "numeric-display text-white",
            numberSize,
          )}
        >
          <NumberCountUp value={Math.round(score)} />
        </p>
        <p className="label-eyebrow mt-3" style={{ color: "rgba(255,255,255,0.85)" }}>
          {label}
        </p>
        {phrase && (
          <p className="font-serif text-[28px] sm:text-[32px] leading-[1.2] mt-8 text-white">
            {phrase}
          </p>
        )}
        {narrative && (
          <p className="body-serif mt-5 max-w-md text-white/90">
            {narrative}
          </p>
        )}
      </div>
    </section>
  );
}