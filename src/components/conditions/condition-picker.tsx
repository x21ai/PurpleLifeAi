import * as React from "react";
import { Search, X, Check } from "lucide-react";
import {
  CONDITION_CATALOG,
  searchConditions,
  type ConditionCategory,
  type ConditionDef,
} from "@/lib/condition-catalog";

const CATEGORY_LABELS: Record<ConditionCategory, string> = {
  neuro: "Neurological",
  neurodevelopmental: "Neurodevelopmental",
  mental_health: "Mental health",
  cardio_metabolic: "Heart & metabolic",
  autoimmune: "Autoimmune & inflammatory",
  respiratory: "Respiratory",
  pain_fatigue: "Pain & fatigue",
  gi: "Gut & digestive",
  oncology: "Cancer",
  caregiver: "Caregiver context",
  general: "Other",
};

const CATEGORY_ORDER: ConditionCategory[] = [
  "neuro",
  "neurodevelopmental",
  "mental_health",
  "pain_fatigue",
  "cardio_metabolic",
  "autoimmune",
  "respiratory",
  "gi",
  "oncology",
  "caregiver",
  "general",
];

/**
 * Search-first picker over the full 40-condition catalog. When the user
 * starts typing it filters across labels + aka aliases; otherwise it shows
 * the catalog grouped by category. Selected conditions surface at the top
 * as removable chips so the user can always see what's on their list.
 */
export function ConditionPicker({
  value,
  onChange,
  max = 12,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo<ConditionDef[]>(() => {
    if (query.trim().length === 0) return [];
    return searchConditions(query).slice(0, 20);
  }, [query]);

  const grouped = React.useMemo(() => {
    const map = new Map<ConditionCategory, ConditionDef[]>();
    for (const c of [...CONDITION_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const arr = map.get(c.category) ?? [];
      arr.push(c);
      map.set(c.category, arr);
    }
    return CATEGORY_ORDER.filter((cat) => map.has(cat)).map((cat) => ({
      cat,
      items: map.get(cat)!,
    }));
  }, []);

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  function toggle(slug: string) {
    if (selectedSet.has(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      if (value.length >= max) return;
      onChange([...value, slug]);
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 40+ conditions — e.g. autism, migraine, lupus"
          className="w-full rounded-full border border-border bg-card pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search conditions"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {value.map((slug) => {
            const def = CONDITION_CATALOG.find((c) => c.slug === slug);
            const label = def?.label ?? slug;
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs"
              >
                {label}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => toggle(slug)}
                  className="rounded-full hover:bg-primary-foreground/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search results */}
      {query.trim().length > 0 ? (
        <div className="mt-4">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No matches. Try a different spelling, or add it as a free-text note below.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {filtered.map((def) => {
                const active = selectedSet.has(def.slug);
                return (
                  <li key={def.slug}>
                    <button
                      type="button"
                      onClick={() => toggle(def.slug)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-secondary/40"
                      aria-pressed={active}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-foreground">{def.label}</span>
                        {def.aka.length > 0 && (
                          <span className="block text-[11px] text-muted-foreground truncate">
                            also: {def.aka.join(", ")}
                          </span>
                        )}
                      </span>
                      {active ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {CATEGORY_LABELS[def.category]}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {grouped.map(({ cat, items }) => (
            <section key={cat}>
              <p className="label-eyebrow text-muted-foreground">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((def) => {
                  const active = selectedSet.has(def.slug);
                  return (
                    <button
                      key={def.slug}
                      type="button"
                      onClick={() => toggle(def.slug)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {def.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted-foreground">
        {value.length}/{max} selected. Each one personalizes your prompts, tips, and Ask&nbsp;Purple.
      </p>
    </div>
  );
}