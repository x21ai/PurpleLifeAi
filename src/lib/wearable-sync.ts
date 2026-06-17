/**
 * Registry of pull-based wearable providers that share the sync-mode model
 * (manual / interval / visit / pull). Apple Health is push-only and is not
 * listed here.
 *
 * To add a new pull-based device:
 *   1. Create its `<id>_tokens` table with sync_mode (default 'visit'),
 *      sync_interval_hours (default 0), and last_sync_at, plus RLS.
 *   2. Add a cron that skips sync_interval_hours === 0.
 *   3. Add an entry here and a trigger case in triggerProviderSync().
 *   4. Drop <SyncModeSelect table="<id>_tokens" /> on its connection card.
 * It then inherits on-open (3h throttle), pull-to-refresh, manual, and
 * interval behavior automatically.
 */
export type WearableTokenTable = "oura_tokens" | "whoop_tokens";

export type WearableProvider = {
  id: "oura" | "whoop";
  tokensTable: WearableTokenTable;
  label: string;
};

export const WEARABLE_PROVIDERS: readonly WearableProvider[] = [
  { id: "oura", tokensTable: "oura_tokens", label: "Oura" },
  { id: "whoop", tokensTable: "whoop_tokens", label: "Whoop" },
];

/** On-open sync throttle: do not auto-sync a "visit" provider more than this. */
export const SYNC_THROTTLE_MS = 3 * 60 * 60 * 1000; // 3h
