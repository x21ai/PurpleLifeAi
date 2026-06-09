import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/integrations/supabase/auth-context";
import {
  getCareProfile,
  type CareProfile,
} from "@/lib/care-profile.functions";

/**
 * Client-side reader for the user's AI Care Profile. Returns `null` while
 * loading or if none has been generated yet, every caller MUST have a
 * trait-based fallback so the UI is never blank.
 */
export function useCareProfile(): CareProfile | null {
  const fetcher = useServerFn(getCareProfile);
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data } = useQuery({
    queryKey: ["care-profile", userId ?? "anon"],
    queryFn: () => fetcher(),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
  return (data?.profile ?? null) as CareProfile | null;
}