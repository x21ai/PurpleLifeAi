import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  suggestConditions,
  acceptSuggestion,
  dismissSuggestion,
} from "@/lib/condition-suggestions.functions";
import { EnableTrackersSheet } from "@/components/conditions/enable-trackers-sheet";
import { FEATURE_CATALOG, type FeatureKey } from "@/lib/feature-catalog";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

export function ConditionSuggestionsCard() {
  const fetch = useServerFn(suggestConditions);
  const accept = useServerFn(acceptSuggestion);
  const dismiss = useServerFn(dismissSuggestion);
  const qc = useQueryClient();
  const flags = useFeatureFlags();

  const { data, isLoading } = useQuery({
    queryKey: ["condition-suggestions"],
    queryFn: () => fetch(),
    staleTime: 5 * 60 * 1000,
  });

  const [sheetFor, setSheetFor] = React.useState<{
    conditionKey: string;
    label: string;
    candidateFeatures: FeatureKey[];
  } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const suggestions = data?.suggestions ?? [];
  if (isLoading || suggestions.length === 0) return null;

  const onAccept = (s: (typeof suggestions)[number]) => {
    // Filter to features not already on
    const candidates = (s.enableFeatures as FeatureKey[]).filter(
      (k) => !flags.enabled(k) && FEATURE_CATALOG.some((f) => f.key === k),
    );
    setSheetFor({ conditionKey: s.conditionKey, label: s.label, candidateFeatures: candidates });
  };

  const onDismiss = async (conditionKey: string) => {
    await dismiss({ data: { conditionKey } });
    await qc.invalidateQueries({ queryKey: ["condition-suggestions"] });
  };

  const onConfirmEnable = async (keys: FeatureKey[]) => {
    if (!sheetFor) return;
    setBusy(true);
    try {
      await accept({
        data: { conditionKey: sheetFor.conditionKey, enableFeatureKeys: keys },
      });
      toast.success(`Added ${sheetFor.label} to your profile`);
      setSheetFor(null);
      await qc.invalidateQueries({ queryKey: ["condition-suggestions"] });
    } catch (e) {
      toast.error("Couldn't save, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg text-foreground">Patterns we noticed</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Suggestions only, not a diagnosis. Talk to a clinician for anything that matters.
        </p>

        <ul className="mt-4 space-y-3">
          {suggestions.map((s) => (
            <li
              key={s.conditionKey}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Want to add <span className="text-primary">{s.label}</span> to your profile?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onDismiss(s.conditionKey)}
                  aria-label="Dismiss"
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => onAccept(s)}>
                  Add to my profile
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => void onDismiss(s.conditionKey)}
                >
                  Not now
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {busy && (
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </p>
        )}
      </section>

      <EnableTrackersSheet
        open={!!sheetFor}
        onOpenChange={(v) => !v && setSheetFor(null)}
        conditionLabel={sheetFor?.label ?? ""}
        candidateFeatures={sheetFor?.candidateFeatures ?? []}
        busy={busy}
        onConfirm={onConfirmEnable}
      />
    </>
  );
}