import { traitsForConditions } from "./condition-catalog";

export type RecommendedItem = {
  id: string;
  title: string;
  category: string;
  traits: Record<string, number>;
  cta: string;
  route: string;
  disclaimer?: string;
  showWhen?: (ctx: RecommendedContext) => boolean;
  iconName?: string;
};

export type RecommendedContext = {
  hasLabs: boolean;
};

/** Informational cards only (no SKUs or fake prices). Mirrors preview + Flutter catalog. */
export const recommendedCatalog: RecommendedItem[] = [
  {
    id: "wearable_sync",
    title: "Sync Oura + Apple Health",
    category: "Sleep & recovery",
    traits: { sleep_critical: 3, cardiovascular: 1 },
    cta: "Open in Tools",
    route: "/tools",
    iconName: "ring",
  },
  {
    id: "lab_panel",
    title: "Upload past labs",
    category: "Reports",
    traits: { cardiovascular: 2, sleep_critical: 1 },
    cta: "Upload past labs",
    route: "/reports/new",
    iconName: "doc",
    showWhen: (ctx) => !ctx.hasLabs,
  },
  {
    id: "sleep_hygiene",
    title: "Sleep hygiene protocol",
    category: "Protocol",
    traits: { sleep_critical: 3, seizure_prone: 1 },
    cta: "Learn more",
    route: "/plan",
    disclaimer: "Discuss with your clinician. Informational only.",
    iconName: "moon",
  },
  {
    id: "hrv_monitor",
    title: "HRV + resting HR tracking",
    category: "Cardio & metabolic",
    traits: { cardiovascular: 3, sleep_critical: 2 },
    cta: "Open in Tools",
    route: "/tools",
    iconName: "heart",
  },
  {
    id: "journal_prompts",
    title: "Seizure + sleep journal pack",
    category: "Neurology",
    traits: { seizure_prone: 3, sleep_critical: 2, neuro: 1 },
    cta: "Open journal",
    route: "/journal",
    iconName: "journal",
  },
  {
    id: "caregiver_invite",
    title: "Invite a caregiver",
    category: "Care",
    traits: { seizure_prone: 2 },
    cta: "Open in Tools",
    route: "/tools",
    iconName: "people",
  },
  {
    id: "bp_trend",
    title: "Blood pressure trend",
    category: "Cardio & metabolic",
    traits: { cardiovascular: 2 },
    cta: "Learn more",
    route: "/biometrics",
    iconName: "bp",
  },
];

export function scoreRecommendedItem(
  item: RecommendedItem,
  userTraits: Set<string>,
): number {
  let score = 0;
  for (const trait of userTraits) {
    score += item.traits[trait] ?? 0;
  }
  return score;
}

export function rankedRecommendedItems(
  conditions: string[],
  ctx: RecommendedContext,
): RecommendedItem[] {
  const traits = traitsForConditions(conditions);
  return recommendedCatalog
    .filter((item) => (item.showWhen ? item.showWhen(ctx) : true))
    .map((item) => ({ item, score: scoreRecommendedItem(item, traits) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
