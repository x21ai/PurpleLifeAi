import * as React from "react";
import { Sparkles, Check, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  suggestFeatures,
  acceptFeatureSuggestion,
  dismissFeatureSuggestion,
} from "@/lib/feature-suggestions.functions";

export function FeatureSuggestionCard() {
  const list = useServerFn(suggestFeatures);
  const accept = useServerFn(acceptFeatureSuggestion);
  const dismiss = useServerFn(dismissFeatureSuggestion);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["feature-suggestions"],
    queryFn: () => list(),
    staleTime: 60_000,
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["feature-suggestions"] });

  const acceptMut = useMutation({
    mutationFn: (feature: string) => accept({ data: { feature } }),
    onSuccess: () => {
      toast.success("Tracker turned on");
      void refresh();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't enable that"),
  });

  const dismissMut = useMutation({
    mutationFn: (feature: string) => dismiss({ data: { feature } }),
    onSuccess: () => void refresh(),
  });

  const s = q.data?.suggestions?.[0];
  if (!s) return null;

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-secondary p-2 shrink-0">
          <Sparkles className="h-4 w-4 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-muted-foreground">Suggested tracker</p>
          <p className="mt-1.5 font-serif text-lg text-foreground">{s.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
          <p className="mt-2 text-xs text-foreground/70">{s.reason}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => acceptMut.mutate(s.feature)}
              disabled={acceptMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Turn on
            </button>
            <button
              type="button"
              onClick={() => dismissMut.mutate(s.feature)}
              disabled={dismissMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
            >
              <X className="h-3.5 w-3.5" /> Not now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}