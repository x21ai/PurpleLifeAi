import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

export type FreshAccountSnapshot = {
  isFresh: boolean;
  journalCount: number;
  biometricsCount: number;
  seizureCount: number;
  doseCount: number;
};

async function loadFreshAccount(userId: string): Promise<FreshAccountSnapshot> {
  const [journal, bio, seizures, doses] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("biometrics")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("seizure_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("medication_doses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const journalCount = journal.count ?? 0;
  const biometricsCount = bio.count ?? 0;
  const seizureCount = seizures.count ?? 0;
  const doseCount = doses.count ?? 0;
  const isFresh =
    journalCount === 0 &&
    biometricsCount === 0 &&
    seizureCount === 0 &&
    doseCount === 0;

  return { isFresh, journalCount, biometricsCount, seizureCount, doseCount };
}

/**
 * True when the signed-in user has no journal entries, biometrics, seizures,
 * or medication doses yet. Used for first-day empty states across core routes.
 */
export function useFreshAccount() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["fresh-account", userId],
    enabled: !!userId,
    queryFn: () => loadFreshAccount(userId!),
    staleTime: 30_000,
  });
}
