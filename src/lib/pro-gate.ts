import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySubscription } from "./billing.functions";

export type ProFeature = "dna" | "ask_unlimited" | "report_sharing" | "caregiver_seats";

export function useIsPro() {
  const fetchSub = useServerFn(getMySubscription);
  const q = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => fetchSub(),
    staleTime: 60_000,
  });
  return {
    isPro: q.data?.isPro ?? false,
    freeForEveryone: q.data?.freeForEveryone ?? false,
    hasPaidSubscription: q.data?.hasPaidSubscription ?? false,
    loading: q.isLoading,
    data: q.data,
  };
}