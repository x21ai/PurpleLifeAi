/**
 * Canonical journal tag namespaces (Devyn item 7):
 *   event:   discrete happenings (seizure, fall, er_visit)
 *   symptom: how the body felt (headache, nausea)
 *   trigger: likely contributors (alcohol, poor_sleep)
 *   place:   where it happened (hospital, home, work)
 *   context: ongoing states or settings (sleep, exercise, dinner)
 *   mood:    emotional state (tired, anxious)
 *   med:     medication mentions (keppra_taken)
 *
 * Chips render with human labels ("Place: hospital"), never raw namespace
 * strings ("context:hospital"). Migration 20260612012000 remapped legacy
 * tags (event:sleep -> context:sleep, context:hospital -> place:hospital).
 */
const NAMESPACE_LABELS: Record<string, string> = {
  event: "Event",
  symptom: "Symptom",
  trigger: "Trigger",
  place: "Place",
  context: "Context",
  mood: "Mood",
  med: "Med",
};

export function formatTagChip(tag: string): string {
  const idx = tag.indexOf(":");
  if (idx === -1) return tag.replace(/_/g, " ");
  const ns = tag.slice(0, idx);
  const value = tag.slice(idx + 1).replace(/_/g, " ");
  const label = NAMESPACE_LABELS[ns];
  return label ? `${label}: ${value}` : tag.replace(/_/g, " ");
}
