import * as React from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { searchMedDictionary, searchUserMedNames, type MedDictEntry } from "@/lib/med-dictionary";

export type MedNameSelection = {
  name: string;
  entry: MedDictEntry | null;
};

export function MedNameSearch({
  value,
  onChange,
  onSelectEntry,
  onCommit,
  userMedNames = [],
  disabled = false,
}: {
  value: string;
  onChange: (name: string) => void;
  onSelectEntry: (entry: MedDictEntry) => void;
  onCommit?: (name: string) => void;
  userMedNames?: string[];
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const dictResults = React.useMemo(
    () => (query.trim().length >= 1 ? searchMedDictionary(query, 8) : []),
    [query],
  );
  const userResults = React.useMemo(
    () => (query.trim().length >= 1 ? searchUserMedNames(userMedNames, query, 4) : []),
    [query, userMedNames],
  );

  const flatItems = React.useMemo(() => {
    const items: Array<{ type: "user"; name: string } | { type: "dict"; entry: MedDictEntry }> = [];
    for (const name of userResults) {
      if (!dictResults.some((d) => d.label.toLowerCase() === name.toLowerCase())) {
        items.push({ type: "user", name });
      }
    }
    for (const entry of dictResults) {
      items.push({ type: "dict", entry });
    }
    return items;
  }, [userResults, dictResults]);

  React.useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const pickDict = (entry: MedDictEntry) => {
    onChange(entry.label);
    onSelectEntry(entry);
    onCommit?.(entry.label);
    setQuery("");
    setOpen(false);
    setEditing(false);
  };

  const pickUser = (name: string) => {
    onChange(name);
    onCommit?.(name);
    setQuery("");
    setOpen(false);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || flatItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (!item) return;
      if (item.type === "dict") pickDict(item.entry);
      else pickUser(item.name);
    } else if (e.key === "Escape") {
      setOpen(false);
      setEditing(false);
    }
  };

  const showChip = value.trim().length > 0 && !editing && !open;

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground px-1">
        {t("meds.form.searchLabel")}
      </p>

      {showChip ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setEditing(true);
              setQuery(value);
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors max-w-full"
          >
            <span className="truncate">{value}</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-label={t("meds.form.clearName")}
            onClick={() => {
              onChange("");
              setQuery("");
              setEditing(true);
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={editing || !value ? query : value}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
              setOpen(true);
              setEditing(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("meds.form.searchPlaceholder")}
            autoComplete="off"
            aria-label={t("meds.form.searchPlaceholder")}
            aria-expanded={open && flatItems.length > 0}
            aria-controls="med-name-results"
            className="w-full rounded-full border border-border bg-card pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {query && (
            <button
              type="button"
              aria-label={t("meds.form.clearSearch")}
              onClick={() => {
                setQuery("");
                onChange("");
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {open && flatItems.length > 0 && (
        <ul
          id="med-name-results"
          ref={listRef}
          role="listbox"
          className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border shadow-lg max-h-64 overflow-y-auto"
        >
          {flatItems.map((item, idx) => {
            const active = idx === activeIdx;
            if (item.type === "user") {
              return (
                <li key={`user-${item.name}`} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickUser(item.name)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-secondary/40 transition-colors ${active ? "bg-secondary/50" : ""}`}
                  >
                    <span className="text-foreground">{item.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t("meds.form.yourMed")}
                    </span>
                  </button>
                </li>
              );
            }
            return (
              <li key={item.entry.label} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickDict(item.entry)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-secondary/40 transition-colors ${active ? "bg-secondary/50" : ""}`}
                >
                  <span className="text-foreground">{item.entry.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                    {item.entry.kind}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
