/**
 * Guards against AI refusals and meta-commentary leaking into the product.
 * The historical anti-pattern: a journal summary reading "I don't see a
 * journal entry provided to analyze." A model talking about its task must
 * never be shown as if it were insight about the user's health.
 *
 * Mirrored in supabase/functions/journal-processor (write side); this is the
 * render-side defense for rows written before the guard existed.
 */
const REFUSAL_PATTERNS: RegExp[] = [
  /\bi (don't|do not|can't|cannot|won't|will not) (see|have|assist|help|provide|analyze)\b/i,
  /\bas an ai\b/i,
  /\bi('m| am) (unable|sorry|not able)\b/i,
  /\bno (journal )?entry (was )?provided\b/i,
  /\bprovided to (analyze|summarize)\b/i,
  /\blanguage model\b/i,
  /\bi need more (context|information)\b/i,
  /\bplease provide\b/i,
];

export function looksLikeAiRefusal(text: string | null | undefined): boolean {
  if (!text) return false;
  return REFUSAL_PATTERNS.some((re) => re.test(text));
}

/** Returns the text, or null when it reads like a refusal/meta-commentary. */
export function cleanAiText(text: string | null | undefined): string | null {
  if (!text) return null;
  return looksLikeAiRefusal(text) ? null : text;
}
