import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { isFeatureEnabled, type FeatureKey } from "@/lib/feature-catalog";

type State = {
  loading: boolean;
  conditions: string[];
  overrides: Record<string, boolean>;
};

/**
 * Client hook that resolves per-feature visibility from
 * profiles.conditions + profiles.feature_overrides.
 *
 * Read-time only, never writes defaults back into the DB so existing
 * users keep whatever they already have.
 */
export function useFeatureFlags() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [state, setState] = useState<State>({ loading: true, conditions: [], overrides: {} });

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, conditions: [], overrides: {} });
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("conditions, feature_overrides")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setState({
        loading: false,
        conditions: (data?.conditions as string[] | null) ?? [],
        overrides: (data?.feature_overrides as Record<string, boolean> | null) ?? {},
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    loading: state.loading,
    conditions: state.conditions,
    overrides: state.overrides,
    enabled: (key: FeatureKey) => isFeatureEnabled(key, state.conditions, state.overrides),
  };
}
