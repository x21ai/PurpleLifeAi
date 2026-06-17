import { useCallback, useEffect, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sync-mode picker shared by every pull-based wearable connection card.
 * Reads and writes the provider's token row, storing both `sync_mode` and
 * `sync_interval_hours`. Non-interval modes keep `sync_interval_hours = 0` so
 * the provider's cron (which skips interval 0) never auto-syncs them.
 */
type SyncTokenTable = "oura_tokens" | "whoop_tokens";

const SYNC_LABEL: Record<string, string> = {
  visit: "Sync when you open Purple",
  pull: "Sync on pull to refresh",
  manual: "Manual sync only",
  "1": "Sync every hour",
  "6": "Sync every 6 hours",
  "12": "Sync every 12 hours",
};

export function SyncModeSelect({ table }: { table: SyncTokenTable }) {
  const [value, setValue] = useState<string>("visit");

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { data } = await supabase
      .from(table)
      .select("sync_mode, sync_interval_hours")
      .eq("user_id", sess.session.user.id)
      .maybeSingle();
    if (!data) return;
    const mode = (data as { sync_mode?: string }).sync_mode ?? "visit";
    setValue(mode === "interval" ? String(data.sync_interval_hours ?? 12) : mode);
  }, [table]);

  useEffect(() => { void load(); }, [load]);

  const onChange = async (v: string) => {
    setValue(v);
    const isInterval = v === "1" || v === "6" || v === "12";
    const mode = isInterval ? "interval" : v; // visit | pull | manual
    const hours = isInterval ? Number(v) : 0;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { error } = await supabase
      .from(table)
      .update({ sync_mode: mode, sync_interval_hours: hours })
      .eq("user_id", sess.session.user.id);
    if (error) toast.error("Could not save preference");
    else toast.success(SYNC_LABEL[v] ?? "Sync preference saved");
  };

  return (
    <Select value={value} onValueChange={(v) => void onChange(v)}>
      <SelectTrigger className="h-8 w-[190px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="visit">When I open Purple (every 3h)</SelectItem>
        <SelectItem value="pull">Pull to refresh</SelectItem>
        <SelectItem value="1">Every hour</SelectItem>
        <SelectItem value="6">Every 6 hours</SelectItem>
        <SelectItem value="12">Every 12 hours</SelectItem>
        <SelectItem value="manual">Manual only</SelectItem>
      </SelectContent>
    </Select>
  );
}
