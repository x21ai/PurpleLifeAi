import * as React from "react";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import {
  FEATURE_CATALOG,
  defaultForLabels,
  CATEGORY_LABELS,
  isFeatureEnabled,
  type FeatureKey,
  type FeatureCategory,
} from "@/lib/feature-catalog";

/**
 * "What I track", per-feature toggles, grouped by category, with the
 * resolved default explained inline. Writes to profiles.feature_overrides.
 * Defaults are NEVER written retroactively; absence = "use default for my conditions".
 */
export function WhatITrackSection() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [conditions, setConditions] = React.useState<string[]>([]);
  const [overrides, setOverrides] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<FeatureKey | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("conditions, feature_overrides")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setConditions((data?.conditions as string[] | null) ?? []);
      setOverrides(((data as any)?.feature_overrides as Record<string, boolean> | null) ?? {});
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setOverride = async (key: FeatureKey, value: boolean | null) => {
    if (!userId) return;
    const next = { ...overrides };
    if (value === null) delete next[key];
    else next[key] = value;
    setOverrides(next);
    setSavingKey(key);
    const { error } = await supabase
      .from("profiles")
      .update({ feature_overrides: next } as any)
      .eq("id", userId);
    setSavingKey(null);
    if (error) toast.error("Couldn't save preference");
  };

  const resetAll = async () => {
    if (!userId) return;
    setOverrides({});
    const { error } = await supabase
      .from("profiles")
      .update({ feature_overrides: {} } as any)
      .eq("id", userId);
    if (error) toast.error("Couldn't reset");
    else toast.success("Reset to defaults for your conditions");
  };

  // Group catalog by category
  const grouped = React.useMemo(() => {
    const map = new Map<FeatureCategory, typeof FEATURE_CATALOG>();
    for (const f of FEATURE_CATALOG) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl text-foreground">
            <Eye className="h-4 w-4 text-primary" />
            What I track
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-prose">
            Each tracker turns on by default for the conditions it helps with. Turn anything on or
            off, your call, not your diagnosis's.
          </p>
        </div>
        {Object.keys(overrides).length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => void resetAll()} className="text-xs">
            Reset to defaults
          </Button>
        )}
      </div>

      <div className="mt-5 space-y-6">
        {grouped.map(([cat, items]) => (
          <div key={cat}>
            <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-3">
              {items.map((f) => {
                const hasOverride = typeof overrides[f.key] === "boolean";
                const enabled = isFeatureEnabled(f.key, conditions, overrides);
                const reason = f.defaultOnGlobally
                  ? "On for everyone by default"
                  : f.defaultFor.length === 0
                    ? "Off by default, opt in if useful"
                    : `Default-on for ${defaultForLabels(f).toLowerCase()}`;
                return (
                  <div key={f.key} className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`feat-${f.key}`}
                        className="font-serif text-base text-foreground"
                      >
                        {f.label}
                        {f.requiresDevice && (
                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            Device
                          </span>
                        )}
                      </Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                        {reason}
                        {hasOverride && " · You set this manually"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {savingKey === f.key && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        id={`feat-${f.key}`}
                        checked={enabled}
                        disabled={loading}
                        onCheckedChange={(checked) => {
                          // If the new value matches the default, clear the override.
                          const def = isFeatureEnabled(f.key, conditions, null);
                          void setOverride(f.key, checked === def ? null : checked);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
