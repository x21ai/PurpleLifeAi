/**
 * Light, practical, evidence-informed daily tips.
 * Surfaced on /today as a single rotating card. Never medical advice -
 * always pair with the standard disclaimer wherever displayed.
 *
 * Trait-driven: tips live in pools keyed by ConditionTrait so any of the
 * ~40 conditions in CONDITION_CATALOG gets relevant copy without us
 * authoring a separate list per condition.
 */
import { hasTrait, traitsForConditions, type ConditionTrait } from "./condition-catalog";
import type { ConditionTag } from "./condition-prompts";
import { localDayIndex } from "./utils";

export interface ConditionTip {
  /** Stable id used for "don't show again today" dedupe. */
  id: string;
  body: string;
}

const TRAIT_TIPS: Partial<Record<ConditionTrait, ConditionTip[]>> = {
  seizure_prone: [
    {
      id: "seiz-sleep",
      body: "Aim for a consistent bedtime, short sleep is the most common seizure trigger people log here.",
    },
    {
      id: "seiz-dose",
      body: "Even one missed dose can shift your threshold. The Meds tab shows what's still due today.",
    },
    {
      id: "seiz-aura",
      body: "If you feel an aura, capture it right then, even a one-word note helps the pattern engine.",
    },
  ],
  headache: [
    {
      id: "head-water",
      body: "Mild dehydration is a quiet trigger. A glass of water now, before you forget, often blunts an afternoon attack.",
    },
    {
      id: "head-screen",
      body: "Bright screens at night feed sensitivity. Try warming your display after sunset.",
    },
    {
      id: "head-abortive",
      body: "Abortive meds work best at the first whisper. Don't 'wait and see' if you have one available.",
    },
  ],
  glycemic: [
    {
      id: "gly-walk",
      body: "A 10-minute walk after meals smooths out post-meal spikes more than almost anything else free.",
    },
    {
      id: "gly-protein",
      body: "Pairing carbs with protein or fat slows the curve. Even a handful of nuts counts.",
    },
    { id: "gly-foot", body: "Tonight's foot check takes 30 seconds. Make it a ritual before bed." },
  ],
  mood: [
    {
      id: "mood-sun",
      body: "Even 5 minutes of morning daylight helps the rest of the day settle.",
    },
    {
      id: "mood-name",
      body: "Name the feeling, anxious, sad, flat. Naming it gives your brain something to work with.",
    },
    { id: "mood-one", body: "Pick one small thing for today. Not a list. One." },
  ],
  inflammatory: [
    {
      id: "inf-pace",
      body: "Pacing isn't laziness, it's the work. Bank some energy now, spend it intentionally.",
    },
    {
      id: "inf-flare",
      body: "Catch early flare signs in the journal. Patterns become legible after a few weeks.",
    },
  ],
  autonomic: [
    {
      id: "auto-salt",
      body: "Stay ahead on fluids and salt, electrolytes before you feel light-headed, not after.",
    },
    {
      id: "auto-rise",
      body: "Sit on the edge of the bed for 30 seconds before standing. It's not weakness, it's physics.",
    },
  ],
  pacing_required: [
    {
      id: "pace-envelope",
      body: "Stay inside your energy envelope today. PEM is a tax, not a punishment.",
    },
    {
      id: "pace-rest",
      body: "Rest before you need to, proactive rest counts more than recovery rest.",
    },
  ],
  pain: [
    {
      id: "pain-move",
      body: "Gentle movement often helps more than stillness, even 5 minutes of walking or stretching.",
    },
    {
      id: "pain-track",
      body: "Log what helped today, however small. Patterns are easier to spot than to remember.",
    },
  ],
  cardiovascular: [
    {
      id: "cv-bp",
      body: "Same-time, same-arm BP readings are the ones your patterns are built from.",
    },
    {
      id: "cv-walk",
      body: "A short daily walk lowers resting BP more reliably than any single tip.",
    },
  ],
  respiratory: [
    {
      id: "resp-rescue",
      body: "Track rescue inhaler use here, frequency is a better signal than how you feel.",
    },
    {
      id: "resp-trigger",
      body: "Note the room and air quality when symptoms start. Triggers hide in environment.",
    },
  ],
  neurodevelopmental: [
    {
      id: "nd-load",
      body: "Sensory load builds quietly. A small quiet break before you need one is the strongest move.",
    },
    {
      id: "nd-routine",
      body: "When a routine breaks, name it in the journal, context turns 'bad day' into a pattern.",
    },
  ],
  sensory: [
    {
      id: "sen-quiet",
      body: "Five minutes of low-light quiet now is cheaper than recovering from overload later.",
    },
    {
      id: "sen-anchor",
      body: "Pick one sensory anchor (headphones, sunglasses, soft texture) you can reach for fast.",
    },
  ],
  routine_sensitive: [
    {
      id: "rout-bridge",
      body: "Transitions are work. A 2-minute bridge between activities helps more than powering through.",
    },
  ],
  cognitive_load: [
    {
      id: "cog-one",
      body: "One open tab in your head at a time. Park the rest in a note for later.",
    },
  ],
  gi: [
    {
      id: "gi-log",
      body: "Foods are easier to spot as triggers when you log them on calm days too, not just flare days.",
    },
  ],
  nutritional: [
    { id: "nut-kind", body: "Notice the food and notice the thought beside it. Both are data." },
  ],
  motor: [
    {
      id: "motor-on",
      body: "Log when meds kick in and wear off, the on/off pattern is gold for clinic visits.",
    },
  ],
  caregiver: [
    {
      id: "cg-self",
      body: "Your nervous system carries theirs. A short break for you protects them too.",
    },
    {
      id: "cg-log",
      body: "Log what you noticed, even hunches. Future-you will thank present-you.",
    },
  ],
  sleep_critical: [
    {
      id: "sleep-anchor",
      body: "A consistent wake time beats a perfect bedtime. Anchor the morning first.",
    },
  ],
};

const GENERIC: ConditionTip[] = [
  {
    id: "gen-sleep",
    body: "Sleep is the single biggest lever. A consistent wake time beats a perfect bedtime.",
  },
  { id: "gen-walk", body: "A short walk outside resets more than a long scroll inside." },
  { id: "gen-one", body: "One small thing today, logged. Patterns are built from small things." },
];

/**
 * Pick one tip for today. Stable per (day × conditions) so it doesn't
 * flicker across re-renders or tabs. The returned `tag` is a label-only
 * hint (a trait or "general") used by the Today card for an "About"
 * caption, it does not need to map to a specific condition.
 */
export function pickDailyTip(
  conditions: string[] | null | undefined,
  dayMs: number,
): { tag: ConditionTag; tip: ConditionTip } {
  const day = localDayIndex(dayMs);
  const traits = [...traitsForConditions(conditions)].filter((t) => TRAIT_TIPS[t]);
  if (traits.length === 0) {
    return { tag: "general", tip: GENERIC[day % GENERIC.length] };
  }
  const trait = traits[day % traits.length];
  const list = TRAIT_TIPS[trait] ?? GENERIC;
  // Keep the public shape but lean on the trait as the displayed tag.
  return { tag: trait, tip: list[day % list.length] };
}

/** Re-export so callers don't need to know it's trait-backed. */
export { hasTrait };
