import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { deleteFoodEntry } from "@/lib/food.functions";
import { Button } from "@/components/ui/button";
import { userMessage } from "@/lib/user-message";

export type FoodRow = {
  id: string;
  consumed_at: string;
  name: string;
  portion: string | null;
  calories_kcal: number | null;
  source: string;
  ai_confidence: number | null;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function FoodTodayList({ rows, readOnly }: { rows: FoodRow[]; readOnly?: boolean }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteFoodEntry);
  const m = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      void qc.invalidateQueries({ queryKey: ["food"] });
    },
    onError: (e: Error) => toast.error(userMessage(e, "That didn't work. Try again in a moment.")),
  });

  const totalKcal = rows.reduce((a, r) => a + (r.calories_kcal ?? 0), 0);

  if (!rows.length) {
    return (
      <div className="rounded-2xl ring-1 ring-border p-5 text-sm text-muted-foreground">
        Nothing logged yet. Snap a photo or add an item to start.
      </div>
    );
  }

  return (
    <div className="rounded-2xl ring-1 ring-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2 text-sm">
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Food &amp; drinks</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(totalKcal)} kcal
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground">
                {fmtTime(r.consumed_at)}
                {r.portion ? ` · ${r.portion}` : ""}
                {r.calories_kcal != null ? ` · ${Math.round(r.calories_kcal)} kcal` : ""}
                {r.source === "photo" ? " · AI" : ""}
              </div>
            </div>
            {!readOnly && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => m.mutate(r.id)} disabled={m.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}