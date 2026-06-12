/**
 * Trait-driven prompts, questions, and greetings.
 *
 * Public API is unchanged for backwards compatibility. Internally we now
 * read the user's conditions, resolve them through CONDITION_CATALOG to a
 * set of traits, and aggregate prompt/question/tip pools per trait. This
 * lets us cover ~40 conditions without a combinatorial explosion of copy.
 */

import {
  CONDITION_CATALOG,
  getCondition,
  getConditions,
  hasTrait,
  traitsForConditions,
  type ConditionTrait,
} from "./condition-catalog";

/** Kept as a string alias, many call sites still import this type. */
export type ConditionTag = string;

export interface ConditionOption {
  id: ConditionTag;
  label: string;
  hint: string;
}

function hintFor(slug: string): string {
  const def = getCondition(slug);
  if (!def) return "";
  const sx = def.commonSymptoms.slice(0, 3).join(", ");
  return sx ? `${sx[0].toUpperCase()}${sx.slice(1)}.` : "";
}

/**
 * Picker options, derived from the 40-condition catalog. Sorted by the
 * catalog's sortOrder so neuro/mental-health surface first.
 */
export const CONDITION_OPTIONS: ConditionOption[] = [...CONDITION_CATALOG]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => ({ id: c.slug, label: c.label, hint: hintFor(c.slug) }));

export function labelForCondition(id: string): string {
  return getCondition(id)?.label ?? id;
}

/* ------------------------------------------------------------------ */
/* Trait-keyed copy pools                                              */
/* ------------------------------------------------------------------ */

const TRAIT_PROMPTS: Partial<Record<ConditionTrait, string[]>> = {
  seizure_prone: [
    "Any aura or warning signs today?",
    "Sleep last night and how you feel now",
    "Did you take every dose on time?",
  ],
  headache: [
    "How does your head feel right now?",
    "Any triggers today (light, food, stress)?",
    "If pain hit, what helped?",
  ],
  glycemic: [
    "Glucose check and how you felt at the time",
    "Meals and carbs that stood out today",
    "Any lows or highs worth noting?",
  ],
  cardiovascular: [
    "Blood pressure or pulse you noticed today",
    "Any chest, breath, or swelling changes?",
    "Meds taken on time?",
  ],
  autonomic: [
    "How was standing up today?",
    "Fluids, salt, and meals you remember",
    "Heart rate or dizziness moments",
  ],
  inflammatory: [
    "Fatigue level today, and what you did",
    "Any flare signs (joints, skin, gut)?",
    "Sleep and stress in the last 24 hours",
  ],
  respiratory: [
    "How's your breathing right now?",
    "Rescue inhaler uses today?",
    "Cough, wheeze, or sputum changes?",
  ],
  mood: [
    "How is your mood right now, in a few words?",
    "What helped today, even a little?",
    "Anything weighing on you tonight?",
  ],
  cognitive_load: [
    "How clear is your head today?",
    "What demanded the most focus?",
    "Anything you want to remember tomorrow?",
  ],
  neurodevelopmental: [
    "How was your sensory load today?",
    "Routine changes or surprises?",
    "Energy and battery level right now",
  ],
  sensory: [
    "Any sensory overload today?",
    "What environments helped or hurt?",
    "How are your senses feeling now?",
  ],
  routine_sensitive: [
    "Did your routine hold today?",
    "Any unexpected transitions?",
    "What helped you reset?",
  ],
  pacing_required: [
    "Energy level out of 10, and what you spent it on",
    "Any PEM or crash signs?",
    "What did you save energy for?",
  ],
  pain: [
    "Pain level and where, in a few words",
    "What helped today, what didn't",
    "Anything that set it off?",
  ],
  sleep_critical: [
    "How did you sleep last night?",
    "Anything getting in the way of rest?",
    "Wind-down plan for tonight?",
  ],
  gi: [
    "How is your gut today?",
    "Foods that sat well or didn't",
    "Any pain, bloating, or urgency?",
  ],
  nutritional: [
    "Meals and how they felt",
    "Anything you wanted but avoided?",
    "How is your relationship with food today?",
  ],
  motor: [
    "Any tremor, stiffness, or off periods?",
    "Falls, near-falls, or balance moments",
    "How did movement feel today?",
  ],
  autoimmune: [
    "Any flare signs in joints, skin, or gut?",
    "Fatigue level and what you did",
    "Sleep and stress today",
  ],
  caregiver: [
    "How was their day, in your words",
    "Any episodes, meds, or appointments to remember",
    "How are you doing through this?",
  ],
  caregiver_helpful: [
    "Anything they'd want a caregiver to know",
    "Behaviors or moods worth flagging",
    "Med changes or appointments today",
  ],
};

const GENERAL_PROMPTS = [
  "How are you, honestly?",
  "Sleep, food, movement worth noting",
  "Anything you want to remember tomorrow",
];

const TRAIT_QUESTIONS: Partial<Record<ConditionTrait, string[]>> = {
  seizure_prone: [
    "Show my seizures from the last 30 days",
    "Any patterns before my recent episodes?",
    "Have I been taking every dose on time?",
  ],
  headache: [
    "When did my last bad headache hit and what helped?",
    "Which triggers show up most often in my journal?",
    "How often am I using abortive meds this month?",
  ],
  glycemic: [
    "Show my recent highs and lows",
    "Which meals seemed to push my glucose up?",
    "How is my time-in-range trending?",
  ],
  mood: [
    "How has my mood been this week?",
    "What seems to help on harder days?",
    "Am I sleeping enough?",
  ],
  inflammatory: [
    "When did my last flare start and how long did it last?",
    "What patterns show up before a flare?",
    "How is fatigue trending this month?",
  ],
  autonomic: [
    "How is my heart rate on standing this week?",
    "Which days were hardest for orthostatic symptoms?",
    "Am I getting enough fluids and salt?",
  ],
  pacing_required: [
    "Show signs of PEM after activity",
    "How is my energy envelope this week?",
    "Which activities seem to cost me the most?",
  ],
  pain: [
    "How has my pain trended this week?",
    "What helped most on flare days?",
    "Any triggers worth noting recently?",
  ],
  cardiovascular: [
    "How is my blood pressure trending?",
    "Any concerning patterns in my readings?",
    "How is my med adherence?",
  ],
  respiratory: [
    "How often am I using rescue inhaler this month?",
    "Are night symptoms getting worse?",
    "What triggers show up most?",
  ],
  sensory: [
    "When am I most overloaded lately?",
    "What environments seem to help?",
    "Any patterns around shutdowns?",
  ],
  cognitive_load: [
    "When is my focus best lately?",
    "What seems to drain attention?",
    "Any link between sleep and focus?",
  ],
  gi: [
    "Which foods come up around bad days?",
    "How is symptom frequency this month?",
    "Any patterns around stress?",
  ],
  caregiver: [
    "Summarize this week for me",
    "Any episodes or missed doses this week?",
    "What changed compared to last week?",
  ],
};

const GENERAL_QUESTIONS = [
  "How am I sleeping?",
  "Show last week's events",
  "What patterns do you see in my journal?",
];

function aggregateByTrait<T extends string>(
  pool: Partial<Record<ConditionTrait, T[]>>,
  conditions: string[] | null | undefined,
  fallback: T[],
  cap: number,
): T[] {
  const traits = traitsForConditions(conditions);
  if (traits.size === 0) return fallback.slice(0, cap);
  const seen = new Set<string>();
  const out: T[] = [];
  for (const trait of traits) {
    const list = pool[trait];
    if (!list) continue;
    for (const item of list) {
      if (seen.has(item)) continue;
      seen.add(item);
      out.push(item);
      if (out.length >= cap) return out;
    }
  }
  if (out.length === 0) return fallback.slice(0, cap);
  return out;
}

export function promptsForConditions(conditions: string[] | null | undefined): string[] {
  return aggregateByTrait(TRAIT_PROMPTS, conditions, GENERAL_PROMPTS, 6);
}

export function getSuggestedQuestions(conditions: string[] | null | undefined): string[] {
  return aggregateByTrait(TRAIT_QUESTIONS, conditions, GENERAL_QUESTIONS, 5);
}

export function showsSeizureFeatures(conditions: string[] | null | undefined): boolean {
  return hasTrait(conditions, "seizure_prone");
}

/**
 * Condition-aware greeting + first journal prompt for the Today empty state.
 * Picks a tone bucket based on the user's dominant trait, with sane time-of-
 * day defaults so every one of the 40 conditions gets something warm.
 */
export function getTodayGreeting(
  conditions: string[] | null | undefined,
  hour: number,
): { greetingSuffix: string; journalPrompt: string } {
  const tod: "morning" | "afternoon" | "evening" =
    hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  // Trait-based tone buckets, ordered by salience.
  const TONE: Array<{
    trait: ConditionTrait;
    suffix: Record<typeof tod, string>;
  }> = [
    {
      trait: "seizure_prone",
      suffix: {
        morning: "How did you sleep, and any aura?",
        afternoon: "How's the day feeling so far?",
        evening: "Any warning signs today?",
      },
    },
    {
      trait: "headache",
      suffix: {
        morning: "How's your head this morning?",
        afternoon: "Any triggers showing up today?",
        evening: "How's your head tonight?",
      },
    },
    {
      trait: "glycemic",
      suffix: {
        morning: "How are your numbers this morning?",
        afternoon: "Any highs or lows so far?",
        evening: "How did the day go, numbers-wise?",
      },
    },
    {
      trait: "neurodevelopmental",
      suffix: {
        morning: "How's your battery and senses starting today?",
        afternoon: "How's the sensory load right now?",
        evening: "How did your day add up?",
      },
    },
    {
      trait: "pacing_required",
      suffix: {
        morning: "How's your battery starting today?",
        afternoon: "How's the energy envelope so far?",
        evening: "Any crash or PEM signs from today?",
      },
    },
    {
      trait: "autonomic",
      suffix: {
        morning: "How was standing up this morning?",
        afternoon: "How's your energy holding up?",
        evening: "How did your body do today?",
      },
    },
    {
      trait: "pain",
      suffix: {
        morning: "How's the pain this morning?",
        afternoon: "Where's pain sitting right now?",
        evening: "How did your body hold up today?",
      },
    },
    {
      trait: "inflammatory",
      suffix: {
        morning: "Any flare signs this morning?",
        afternoon: "How's fatigue treating you?",
        evening: "How did your body do today?",
      },
    },
    {
      trait: "respiratory",
      suffix: {
        morning: "How's your breathing this morning?",
        afternoon: "Any wheeze or breath changes?",
        evening: "How did breathing hold up today?",
      },
    },
    {
      trait: "cardiovascular",
      suffix: {
        morning: "How's your morning BP or pulse?",
        afternoon: "How's your heart feeling today?",
        evening: "How did your numbers land today?",
      },
    },
    {
      trait: "mood",
      suffix: {
        morning: "How are you waking up today?",
        afternoon: "How's your headspace right now?",
        evening: "How are you, honestly, tonight?",
      },
    },
    {
      trait: "caregiver",
      suffix: {
        morning: "How are they starting the day?",
        afternoon: "How are they, and how are you?",
        evening: "How was their day, in your words?",
      },
    },
  ];

  const traits = traitsForConditions(conditions);
  const bucket = TONE.find((b) => traits.has(b.trait));
  const greetingSuffix = bucket?.suffix[tod] ?? "How's today feeling?";

  // Use the first condition's first prompt as a primer when we can; else generic.
  const defs = getConditions(conditions);
  const prompts = promptsForConditions(conditions);
  const journalPrompt =
    prompts[0] ??
    (defs[0] ? `How is ${defs[0].shortLabel.toLowerCase()} today?` : "How are you, honestly?");
  return { greetingSuffix, journalPrompt };
}

/**
 * Follow-up chip suggestions to render under an assistant reply.
 * Lightweight: combines condition-flavored questions with topic hints
 * pulled from the user's last message.
 */
export function getFollowUps(
  conditions: string[] | null | undefined,
  lastUserMessage: string,
): string[] {
  const base = getSuggestedQuestions(conditions);
  const msg = lastUserMessage.toLowerCase();
  const topical: string[] = [];
  if (/sleep|slept|rest/.test(msg)) topical.push("How is sleep trending this month?");
  if (/pain|ache|hurt/.test(msg)) topical.push("What helped most on flare days?");
  if (/mood|anxious|down|sad/.test(msg)) topical.push("What seems to help on harder days?");
  if (/med|dose|pill/.test(msg)) topical.push("Have I been taking every dose on time?");
  if (/trigger|caused|why/.test(msg)) topical.push("What patterns do you see in my journal?");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of [...topical, ...base]) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
    if (out.length >= 3) break;
  }
  return out;
}
