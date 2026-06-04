/**
 * Light, practical, evidence-informed daily tips per condition.
 * Surfaced on /today as a single rotating card. Never medical advice —
 * always pair with the standard disclaimer wherever displayed.
 */
import type { ConditionTag } from "./condition-prompts";

export interface ConditionTip {
  /** Stable per-condition id used for "don't show again today" dedupe. */
  id: string;
  body: string;
}

const TIPS: Record<ConditionTag, ConditionTip[]> = {
  epilepsy: [
    { id: "epi-sleep", body: "Aim for a consistent bedtime — short sleep is the most common seizure trigger people log here." },
    { id: "epi-dose", body: "Even one missed dose can shift your threshold. The Meds tab shows what's still due today." },
    { id: "epi-aura", body: "If you feel an aura, capture it right then — even a one-word note helps the pattern engine." },
    { id: "epi-stress", body: "Notice rising stress? A 4-7-8 breath cycle a few times a day costs nothing and tends to help." },
  ],
  migraine: [
    { id: "mig-water", body: "Mild dehydration is a quiet trigger. A glass of water now, before you forget, often blunts an afternoon attack." },
    { id: "mig-screen", body: "Bright screens at night feed sensitivity. Try warming your display after sunset." },
    { id: "mig-abortive", body: "Abortive meds work best at the first whisper. Don't 'wait and see' if you have one available." },
  ],
  diabetes: [
    { id: "dia-walk", body: "A 10-minute walk after meals smooths out post-meal spikes more than almost anything else free." },
    { id: "dia-protein", body: "Pairing carbs with protein or fat slows the curve. Even a handful of nuts counts." },
    { id: "dia-foot", body: "Tonight's foot check takes 30 seconds. Make it a ritual before bed." },
  ],
  mental_health: [
    { id: "mh-sun", body: "Even 5 minutes of morning daylight helps the rest of the day settle." },
    { id: "mh-name", body: "Name the feeling — anxious, sad, flat. Naming it gives your brain something to work with." },
    { id: "mh-one", body: "Pick one small thing for today. Not a list. One." },
  ],
  autoimmune: [
    { id: "ai-pace", body: "Pacing isn't laziness — it's the work. Bank some energy now, spend it intentionally." },
    { id: "ai-flare", body: "Catch early flare signs in the journal. Patterns become legible after a few weeks." },
  ],
  pots: [
    { id: "pots-salt", body: "Stay ahead on fluids and salt — electrolytes before you feel light-headed, not after." },
    { id: "pots-rise", body: "Sit on the edge of the bed for 30 seconds before standing. It's not weakness, it's physics." },
  ],
  long_covid: [
    { id: "lc-envelope", body: "Stay inside your energy envelope today. PEM is a tax, not a punishment." },
    { id: "lc-rest", body: "Rest before you need to — proactive rest counts more than recovery rest." },
  ],
  chronic_pain: [
    { id: "cp-move", body: "Gentle movement often helps more than stillness — even 5 minutes of walking or stretching." },
    { id: "cp-track", body: "Log what helped today, however small. Patterns are easier to spot than to remember." },
  ],
  caregiver: [
    { id: "cg-self", body: "Your nervous system carries theirs. A short break for you protects them too." },
    { id: "cg-log", body: "Log what you noticed — even hunches. Future-you will thank present-you." },
  ],
  general: [
    { id: "gen-sleep", body: "Sleep is the single biggest lever. A consistent wake time beats a perfect bedtime." },
    { id: "gen-walk", body: "A short walk outside resets more than a long scroll inside." },
  ],
};

const GENERIC: ConditionTip[] = TIPS.general;

/**
 * Pick one tip for today. Stable per (day × conditions) so it doesn't
 * flicker across re-renders or tabs.
 */
export function pickDailyTip(
  conditions: string[] | null | undefined,
  dayMs: number,
): { tag: ConditionTag; tip: ConditionTip } {
  const tags = (conditions ?? []) as ConditionTag[];
  const day = Math.floor(dayMs / 86_400_000);
  // Rotate which condition supplies today's tip when the user has multiple.
  const realTags = tags.filter((t) => t in TIPS && t !== "general");
  if (realTags.length === 0) {
    return { tag: "general", tip: GENERIC[day % GENERIC.length] };
  }
  const tag = realTags[day % realTags.length];
  const list = TIPS[tag] ?? GENERIC;
  return { tag, tip: list[day % list.length] };
}