import { getConditions, traitsForConditions, type ConditionTrait } from "./condition-catalog";

/** What Purple highlights for a given trait. Kept short, scannable. */
const TRAIT_BULLETS: Partial<Record<ConditionTrait, string[]>> = {
  seizure_prone: [
    "One-tap seizure logging from Today",
    "Aura tracking that links to the next event",
    "Med adherence with dose reminders",
    "Patterns from sleep, stress and missed doses",
  ],
  headache: [
    "Attack and abortive-use tracking",
    "Trigger patterns (light, food, stress, sleep)",
    "Med adherence with dose reminders",
  ],
  glycemic: [
    "Glucose, meals and time-in-range trends",
    "Insulin and medication tracking",
    "Patterns between meals and highs/lows",
  ],
  cardiovascular: [
    "Blood pressure and heart-rate tracking",
    "Med adherence with dose reminders",
    "Trends across days and weeks",
  ],
  autonomic: [
    "Standing heart rate and orthostatic notes",
    "Fluids, salt and pacing",
    "Daily symptom patterns",
  ],
  inflammatory: [
    "Flare logging with severity and duration",
    "Fatigue and sleep trends",
    "Med adherence and side-effect notes",
  ],
  autoimmune: [
    "Flare logging and recovery time",
    "Med adherence and side-effect notes",
    "Fatigue and sleep trends",
  ],
  respiratory: [
    "Rescue inhaler use and breath changes",
    "Trigger patterns (allergens, exercise, weather)",
    "Med adherence",
  ],
  mood: [
    "Daily mood and energy check-ins",
    "What helps on harder days, surfaced over time",
    "Sleep and med-adherence patterns",
  ],
  cognitive_load: [
    "Focus and clarity check-ins",
    "What drains and restores your attention",
    "Sleep-and-focus patterns",
  ],
  neurodevelopmental: [
    "Sensory load and energy battery tracking",
    "Routine and transition logging",
    "Daily patterns without judgment",
  ],
  sensory: ["Sensory overload and shutdown logging", "Environments that help or hurt"],
  routine_sensitive: ["Routine tracking and disruptions", "What helps you reset"],
  pacing_required: [
    "Energy envelope and PEM tracking",
    "Pacing patterns by activity",
    "What you saved energy for",
  ],
  pain: [
    "Pain level, location and what helped",
    "Trigger patterns from your journal",
    "Med adherence with dose reminders",
  ],
  sleep_critical: ["Sleep quality and duration trends", "What gets in the way of rest"],
  gi: ["Symptom and food logging", "Patterns between meals and bad days"],
  nutritional: [
    "Gentle meal logging, no calorie shaming",
    "Patterns between food and how you feel",
  ],
  motor: [
    "On/off period and tremor logging",
    "Falls and balance notes",
    "Med adherence and timing",
  ],
  caregiver: [
    "Notes from the day, in your words",
    "Episodes, meds and appointments",
    "How they're doing, and how you are",
  ],
  caregiver_helpful: [
    "Things a caregiver would want to know",
    "Behaviors and moods worth flagging",
  ],
};

const GENERAL_BULLETS = [
  "A private journal you can write, speak, or snap",
  "Med tracking with dose reminders",
  "Patterns across sleep, mood, meds and symptoms",
  "Export everything you've ever logged, any time",
];

export function welcomeBulletsForConditions(
  conditions: string[] | null | undefined,
  cap = 5,
): string[] {
  const traits = traitsForConditions(conditions);
  if (traits.size === 0) return GENERAL_BULLETS.slice(0, cap);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const trait of traits) {
    const list = TRAIT_BULLETS[trait];
    if (!list) continue;
    for (const item of list) {
      if (seen.has(item)) continue;
      seen.add(item);
      out.push(item);
      if (out.length >= cap) return out;
    }
  }
  if (out.length === 0) return GENERAL_BULLETS.slice(0, cap);
  return out;
}

export function welcomeTitleForConditions(conditions: string[] | null | undefined): string {
  const defs = getConditions(conditions);
  if (defs.length === 0) return "Purple is set up for you.";
  const first = defs[0].shortLabel;
  if (defs.length === 1) return `Purple is set up for ${first}.`;
  return `Purple is set up for ${first} +${defs.length - 1} more.`;
}
