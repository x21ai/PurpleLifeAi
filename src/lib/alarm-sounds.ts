// Web Audio alarm presets, no asset files, all synthesized at runtime.
// Used by the critical-dose alarm modal and the medication form preview button.

export type AlarmSoundId =
  | "gentle-chime"
  | "classic-beep"
  | "urgent-pulse"
  | "rooster"
  | "vibrate-only"
  | "silent";

export const ALARM_SOUNDS: Array<{ id: AlarmSoundId; label: string; description: string }> = [
  { id: "gentle-chime", label: "Gentle chime", description: "Soft two-note bell" },
  { id: "classic-beep", label: "Classic beep", description: "Familiar single tone" },
  {
    id: "urgent-pulse",
    label: "Urgent pulse",
    description: "Fast triple beep, attention-grabbing",
  },
  { id: "rooster", label: "Rooster", description: "Rising crow, hard to sleep through" },
  { id: "vibrate-only", label: "Vibrate only", description: "Silent, vibrates the phone instead" },
  { id: "silent", label: "Silent", description: "Visual prompt only" },
];

type PresetSpec = { freqs: number[]; gap: number; duration: number; type: OscillatorType };

const PRESETS: Record<Exclude<AlarmSoundId, "vibrate-only" | "silent">, PresetSpec> = {
  "gentle-chime": { freqs: [880, 1320], gap: 0.18, duration: 0.6, type: "sine" },
  "classic-beep": { freqs: [880], gap: 0, duration: 0.5, type: "sine" },
  "urgent-pulse": { freqs: [1200, 1200, 1200], gap: 0.08, duration: 0.12, type: "square" },
  rooster: { freqs: [440, 660, 880, 1100, 880], gap: 0.06, duration: 0.18, type: "sawtooth" },
};

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  return new AC();
}

function playPreset(ctx: AudioContext, spec: PresetSpec) {
  let t = ctx.currentTime;
  for (const f of spec.freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type;
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + spec.duration + 0.05);
    t += spec.duration + spec.gap;
  }
}

function vibrate(pattern: number[] = [200, 100, 200]) {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
}

/** Fire a single iteration of the chosen sound. */
export function playAlarmOnce(id: AlarmSoundId) {
  if (id === "silent") return;
  if (id === "vibrate-only") {
    vibrate();
    return;
  }
  const ctx = getCtx();
  if (!ctx) return;
  playPreset(ctx, PRESETS[id]);
  setTimeout(() => {
    try {
      ctx.close();
    } catch {
      /* noop */
    }
  }, 2000);
}

/**
 * Start a looping alarm. Returns a stop function.
 * Vibrate-only uses navigator.vibrate with a continuous pattern.
 */
export function startAlarmLoop(id: AlarmSoundId): () => void {
  if (id === "silent") return () => {};
  if (id === "vibrate-only") {
    const iv = setInterval(() => vibrate([300, 200, 300]), 1500);
    vibrate([300, 200, 300]);
    return () => {
      clearInterval(iv);
      if (typeof navigator !== "undefined" && navigator.vibrate)
        try {
          navigator.vibrate(0);
        } catch {
          /* noop */
        }
    };
  }
  const ctx = getCtx();
  if (!ctx) return () => {};
  const spec = PRESETS[id];
  const intervalMs = Math.max(1500, (spec.freqs.length * (spec.duration + spec.gap) + 0.3) * 1000);
  playPreset(ctx, spec);
  const iv = setInterval(() => playPreset(ctx, spec), intervalMs);
  return () => {
    clearInterval(iv);
    try {
      ctx.close();
    } catch {
      /* noop */
    }
  };
}

export const DEFAULT_ALARM_SOUND: AlarmSoundId = "gentle-chime";
