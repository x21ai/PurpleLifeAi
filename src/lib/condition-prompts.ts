/**
 * Condition tags and light per-condition tailoring.
 * Used by onboarding, Today, Journal, and the Ask-Purple system prompt.
 */

export type ConditionTag =
  | "epilepsy"
  | "migraine"
  | "diabetes"
  | "mental_health"
  | "autoimmune"
  | "pots"
  | "long_covid"
  | "chronic_pain"
  | "caregiver"
  | "general";

export interface ConditionOption {
  id: ConditionTag;
  label: string;
  hint: string;
}

export const CONDITION_OPTIONS: ConditionOption[] = [
  { id: "epilepsy", label: "Epilepsy / seizures", hint: "Auras, episodes, rescue meds." },
  { id: "migraine", label: "Migraine", hint: "Attacks, triggers, abortives." },
  { id: "diabetes", label: "Diabetes", hint: "Glucose, insulin, carbs." },
  { id: "mental_health", label: "Mental health", hint: "Mood, anxiety, sleep." },
  { id: "autoimmune", label: "Autoimmune", hint: "Flares, fatigue, inflammation." },
  { id: "pots", label: "POTS / dysautonomia", hint: "Heart rate, dizziness, salt." },
  { id: "long_covid", label: "Long COVID / ME-CFS", hint: "Energy envelope, PEM." },
  { id: "chronic_pain", label: "Chronic pain", hint: "Pain levels, flare triggers." },
  { id: "caregiver", label: "Caregiving for someone", hint: "Tracking on their behalf." },
  { id: "general", label: "General wellness", hint: "Sleep, stress, habits." },
];

const PROMPTS: Record<ConditionTag, string[]> = {
  epilepsy: [
    "Any aura or warning signs today?",
    "Sleep last night and how you feel now",
    "Did you take every dose on time?",
  ],
  migraine: [
    "How does your head feel right now?",
    "Any triggers today (light, food, stress)?",
    "If a migraine hit, what helped?",
  ],
  diabetes: [
    "Glucose check and how you felt at the time",
    "Meals and carbs that stood out today",
    "Any lows or highs worth noting?",
  ],
  mental_health: [
    "How is your mood right now, in a few words?",
    "What helped today, even a little?",
    "Anything weighing on you tonight?",
  ],
  autoimmune: [
    "Fatigue level today, and what you did",
    "Any flare signs (joints, skin, gut)?",
    "Sleep and stress in the last 24 hours",
  ],
  pots: [
    "How was standing up today?",
    "Fluids, salt, and meals you remember",
    "Heart rate or dizziness moments",
  ],
  long_covid: [
    "Energy level out of 10, and what you spent it on",
    "Any PEM signs after activity?",
    "Sleep quality and brain fog notes",
  ],
  chronic_pain: [
    "Pain level and where, in a few words",
    "What helped today, what didn't",
    "Anything that set it off?",
  ],
  caregiver: [
    "How was their day, in your words",
    "Any episodes, meds, or appointments to remember",
    "How are you doing through this?",
  ],
  general: [
    "How are you, honestly?",
    "Sleep, food, movement worth noting",
    "Anything you want to remember tomorrow",
  ],
};

export function promptsForConditions(conditions: string[] | null | undefined): string[] {
  const tags = (conditions ?? []).filter((c): c is ConditionTag => c in PROMPTS);
  if (tags.length === 0) return PROMPTS.general;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    for (const p of PROMPTS[tag]) {
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  return out.slice(0, 6);
}

export function labelForCondition(id: string): string {
  return CONDITION_OPTIONS.find((c) => c.id === id)?.label ?? id;
}

/**
 * Suggested questions for Ask Purple, by condition. These are questions
 * the *user asks Purple* (analytical), not journal prompts.
 */
const QUESTIONS: Record<ConditionTag, string[]> = {
  epilepsy: [
    "Show my seizures from the last 30 days",
    "Any patterns before my recent episodes?",
    "Have I been taking every dose on time?",
  ],
  migraine: [
    "When did my last migraine hit and what helped?",
    "Which triggers show up most often in my journal?",
    "How often am I using abortive meds this month?",
  ],
  diabetes: [
    "Show my recent highs and lows",
    "Which meals seemed to push my glucose up?",
    "How is my time-in-range trending?",
  ],
  mental_health: [
    "How has my mood been this week?",
    "What seems to help on the harder days?",
    "Am I sleeping enough?",
  ],
  autoimmune: [
    "When did my last flare start and how long did it last?",
    "What patterns show up before a flare?",
    "How is fatigue trending this month?",
  ],
  pots: [
    "How is my heart rate on standing this week?",
    "Which days were hardest for orthostatic symptoms?",
    "Am I getting enough fluids and salt?",
  ],
  long_covid: [
    "Show signs of PEM after activity",
    "How is my energy envelope this week?",
    "Which activities seem to cost me the most?",
  ],
  chronic_pain: [
    "How has my pain trended this week?",
    "What helped most on flare days?",
    "Any triggers worth noting recently?",
  ],
  caregiver: [
    "Summarize this week for me",
    "Any episodes or missed doses this week?",
    "What changed compared to last week?",
  ],
  general: [
    "How am I sleeping?",
    "Anything unusual this week?",
    "What patterns do you see in my journal?",
  ],
};

const GENERAL_FALLBACK = [
  "How am I sleeping?",
  "Show last week's events",
  "What patterns do you see in my journal?",
];

export function getSuggestedQuestions(
  conditions: string[] | null | undefined,
): string[] {
  const tags = (conditions ?? []).filter(
    (c): c is ConditionTag => c in QUESTIONS,
  );
  if (tags.length === 0) return GENERAL_FALLBACK;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    for (const q of QUESTIONS[tag]) {
      if (!seen.has(q)) {
        seen.add(q);
        out.push(q);
      }
    }
  }
  return out.slice(0, 5);
}

/**
 * Conditions for which seizure tracking surfaces should appear.
 * Today only `epilepsy`; expand if we add seizure-prone conditions
 * (e.g. certain neurological diagnoses) later.
 */
const SEIZURE_PRONE: ReadonlySet<ConditionTag> = new Set(["epilepsy"]);

export function showsSeizureFeatures(
  conditions: string[] | null | undefined,
): boolean {
  if (!conditions || conditions.length === 0) return false;
  return conditions.some((c): c is ConditionTag => SEIZURE_PRONE.has(c as ConditionTag));
}