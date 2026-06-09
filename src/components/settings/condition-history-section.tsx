import * as React from "react";
import { Archive, Plus, RotateCcw, Users, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { CONDITION_OPTIONS } from "@/lib/condition-prompts";
import { ConditionPicker } from "@/components/conditions/condition-picker";
import { useServerFn } from "@tanstack/react-start";
import { generateCareProfile } from "@/lib/care-profile.functions";

const LABELS = new Map<string, string>(CONDITION_OPTIONS.map((o) => [o.id, o.label]));
const labelOf = (id: string) => LABELS.get(id) ?? id;

type ArchivedItem = {
  id: string;
  label?: string;
  status: "resolved" | "remission";
  archived_at: string;
};

type FamilyItem = {
  id: string; // uuid-ish key
  condition: string;
  relation?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ConditionHistorySection() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [active, setActive] = React.useState<string[]>([]);
  const [archived, setArchived] = React.useState<ArchivedItem[]>([]);
  const [family, setFamily] = React.useState<FamilyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [famDraft, setFamDraft] = React.useState("");
  const [famRelation, setFamRelation] = React.useState("");
  const [picking, setPicking] = React.useState(false);
  const regenerateCareProfile = useServerFn(generateCareProfile);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("conditions, conditions_archived, family_history")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled || !data) return;
      setActive(Array.isArray(data.conditions) ? (data.conditions as string[]) : []);
      setArchived(Array.isArray(data.conditions_archived) ? (data.conditions_archived as unknown as ArchivedItem[]) : []);
      setFamily(Array.isArray(data.family_history) ? (data.family_history as unknown as FamilyItem[]) : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function persist(next: {
    conditions?: string[];
    conditions_archived?: ArchivedItem[];
    family_history?: FamilyItem[];
  }) {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(next as any)
      .eq("id", userId);
    setSaving(false);
    if (error) toast.error("Couldn't save");
    else if (next.conditions) {
      // Regenerate the AI care profile when the condition list changes
      // so Today/Journal/Ask Purple stay personalized.
      void regenerateCareProfile({ data: { force: true } }).catch(() => {});
    }
  }

  async function archive(condition: string, status: "resolved" | "remission") {
    const nextActive = active.filter((c) => c !== condition);
    const nextArchived = [
      ...archived.filter((a) => a.id !== condition),
      { id: condition, label: labelOf(condition), status, archived_at: new Date().toISOString() },
    ];
    setActive(nextActive);
    setArchived(nextArchived);
    await persist({ conditions: nextActive, conditions_archived: nextArchived });
    toast.success(status === "resolved" ? "Marked as resolved" : "Marked as in remission");
  }

  async function restore(item: ArchivedItem) {
    const nextArchived = archived.filter((a) => a.id !== item.id);
    const nextActive = active.includes(item.id) ? active : [...active, item.id];
    setActive(nextActive);
    setArchived(nextArchived);
    await persist({ conditions: nextActive, conditions_archived: nextArchived });
    toast.success(`Restored ${item.label ?? item.id}`);
  }

  async function removeArchived(item: ArchivedItem) {
    const nextArchived = archived.filter((a) => a.id !== item.id);
    setArchived(nextArchived);
    await persist({ conditions_archived: nextArchived });
  }

  async function addFamily() {
    const condition = famDraft.trim().slice(0, 80);
    if (!condition) return;
    const next = [...family, { id: uid(), condition, relation: famRelation.trim().slice(0, 40) || undefined }];
    setFamily(next);
    setFamDraft("");
    setFamRelation("");
    await persist({ family_history: next });
  }

  async function removeFamily(id: string) {
    const next = family.filter((f) => f.id !== id);
    setFamily(next);
    await persist({ family_history: next });
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Archive className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl text-foreground">Health history</h2>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Conditions evolve. Mark something as resolved or in remission, or note what runs in the family.
      </p>

      {/* Active → resolve */}
      <div className="mt-5">
        <Label className="text-sm font-medium text-foreground">Currently active</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Resolve removes it from prompts and trackers; in remission keeps it visible but quiet.
        </p>
        {active.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground italic">Nothing active yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {active.map((c) => (
              <li
                key={c}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-2"
              >
                <span className="text-sm text-foreground">{labelOf(c)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void archive(c, "remission")}
                    disabled={loading}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-secondary"
                  >
                    In remission
                  </button>
                  <button
                    type="button"
                    onClick={() => void archive(c, "resolved")}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-secondary"
                  >
                    <Check className="h-3 w-3" /> Resolved
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
          >
            <Plus className="h-3 w-3" /> {picking ? "Done" : "Add condition"}
          </button>
        </div>
        {picking && (
          <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
            <ConditionPicker
              value={active}
              onChange={(next) => {
                setActive(next);
                void persist({ conditions: next });
              }}
            />
          </div>
        )}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <Label className="text-sm font-medium text-foreground">Past / resolved</Label>
          <ul className="mt-3 space-y-2">
            {archived.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">{a.label ?? labelOf(a.id)}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {a.status === "resolved" ? "Resolved" : "In remission"} ·{" "}
                    {new Date(a.archived_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void restore(a)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-secondary"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeArchived(a)}
                    aria-label="Remove"
                    className="rounded-full border border-border p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Family history */}
      <div className="mt-6 border-t border-border pt-5">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="h-4 w-4 text-primary" /> Family history
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          What runs in your family. Used as context for patterns and AI suggestions, never shared.
        </p>
        {family.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {family.map((f) => (
              <li
                key={f.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-foreground"
              >
                <span>{f.condition}</span>
                {f.relation && <span className="text-muted-foreground">· {f.relation}</span>}
                <button
                  type="button"
                  onClick={() => void removeFamily(f.id)}
                  aria-label={`Remove ${f.condition}`}
                  className="rounded-full hover:bg-secondary"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={famDraft}
            onChange={(e) => setFamDraft(e.target.value.slice(0, 80))}
            placeholder="Condition (e.g. Heart attack)"
            disabled={loading}
            className="flex-1 min-w-[180px]"
          />
          <Input
            value={famRelation}
            onChange={(e) => setFamRelation(e.target.value.slice(0, 40))}
            placeholder="Relation (e.g. Father)"
            disabled={loading}
            className="w-40"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addFamily();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void addFamily()}
            disabled={loading || !famDraft.trim()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </section>
  );
}