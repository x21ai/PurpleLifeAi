import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dark-launch flags for peripheral surfaces (see docs/LAUNCH-AUDIT.md).
 * Stored as boolean columns on the app_settings singleton, anon-readable,
 * super-admin writable, same pattern as pro_free_for_everyone.
 */
export type FeatureFlag = "community" | "dna" | "friends";

type FlagRow = {
  feature_community_enabled?: boolean | null;
  feature_dna_enabled?: boolean | null;
  feature_friends_enabled?: boolean | null;
};

export type FeatureFlags = Record<FeatureFlag, boolean>;

const FLAG_COLUMNS = "feature_community_enabled, feature_dna_enabled, feature_friends_enabled";

async function fetchFeatureFlags(): Promise<FeatureFlags> {
  // Fail closed: flagged surfaces stay dark unless the flag reads true.
  const { data } = await supabase
    .from("app_settings")
    .select(FLAG_COLUMNS)
    .eq("id", true)
    .maybeSingle<FlagRow>();
  return {
    community: data?.feature_community_enabled === true,
    dna: data?.feature_dna_enabled === true,
    friends: data?.feature_friends_enabled === true,
  };
}

export function useFeatureFlags() {
  const q = useQuery({
    queryKey: ["feature-flags"],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60_000,
  });
  return { flags: q.data, loading: q.isLoading };
}

export function useFeatureFlag(flag: FeatureFlag) {
  const { flags, loading } = useFeatureFlags();
  return { enabled: flags?.[flag] ?? false, loading };
}

/**
 * Renders children only when the flag is on; otherwise quietly redirects.
 * Renders nothing while the flag loads so dark surfaces never flash.
 */
export function FeatureGate({
  flag,
  redirectTo,
  children,
}: {
  flag: FeatureFlag;
  redirectTo: string;
  children: React.ReactNode;
}) {
  const { enabled, loading } = useFeatureFlag(flag);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !enabled) {
      void navigate({ to: redirectTo, replace: true });
    }
  }, [loading, enabled, navigate, redirectTo]);

  if (loading || !enabled) return null;
  return <>{children}</>;
}
