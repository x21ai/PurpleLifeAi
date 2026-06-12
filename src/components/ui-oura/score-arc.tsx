import { useId } from "react";

/**
 * Curved score arc, the lower 200° of a circle, traced with a track + fill.
 * Used on the hero score card; sits centered over a landscape image.
 */
export function ScoreArc({
  score,
  size = 260,
  stroke = 6,
  tone = "ink",
  ariaLabel,
}: {
  score: number;
  size?: number;
  stroke?: number;
  tone?: "ink" | "alert" | "cream";
  ariaLabel?: string;
}) {
  const id = useId();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke;

  // Arc from 170° to 10° going clockwise across the bottom (200° of sweep).
  const start = polar(cx, cy, r, 170);
  const end = polar(cx, cy, r, 370); // 10° + 360
  const trackD = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const pct = Math.max(0, Math.min(100, score)) / 100;
  // approximate path length: π * r * (200/180)
  const length = Math.PI * r * (200 / 180);
  const dash = `${length * pct} ${length}`;
  const endPoint = polar(cx, cy, r, 170 + 200 * pct);

  const stroking =
    tone === "alert"
      ? "stroke-[color:var(--data-alert)]"
      : tone === "cream"
        ? "stroke-[color:var(--background)]"
        : "stroke-[color:var(--foreground)]";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel ?? `Score ${score}`}
      className="block"
    >
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {/* Track */}
      <path
        d={trackD}
        fill="none"
        strokeLinecap="round"
        strokeWidth={stroke}
        className="stroke-[color:var(--ring-track)] opacity-70"
      />
      {/* Fill */}
      <path
        d={trackD}
        fill="none"
        strokeLinecap="round"
        strokeWidth={stroke}
        strokeDasharray={dash}
        className={`${stroking} transition-[stroke-dasharray] duration-1000 ease-out`}
      />
      {/* Endpoint dot */}
      <circle
        cx={endPoint.x}
        cy={endPoint.y}
        r={stroke * 0.9}
        className={`fill-[color:var(--background)] ${stroking}`}
        strokeWidth={stroke * 0.5}
      />
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
