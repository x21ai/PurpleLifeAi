import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Camera, ChevronRight, MoonStar, NotebookPen, Plus, Search, Sparkles, X } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { JournalRibbon } from "../components/mobile-graphics";

interface JournalEntry {
  id: number;
  title: string;
  detail: string;
  time: string;
  type: "sleep" | "symptom" | "photo" | "note";
}

const defaultEntries: JournalEntry[] = [];

const iconMap = { sleep: MoonStar, symptom: Sparkles, photo: Camera, note: NotebookPen };
const colorMap = {
  sleep: "bg-purplelife-indigo/15 text-purplelife-indigo",
  symptom: "bg-purplelife-pink/15 text-purplelife-pink",
  photo: "bg-purplelife-yellow/20 text-purplelife-coral",
  note: "bg-purplelife-blue/15 text-purplelife-blue",
};

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-journal-page
 * @ployComponentType page
 * @ployComponentDescription Mobile-first Journal led by a weekly visual story, fluid color graphic, search, chronological entries, and an in-memory composer.
 * @ployComponentTags purplelife pilot mobile journal
 * @ployComponentStatus experimental
 */
export function PilotJournalPage() {
  const [entries, setEntries] = useState(defaultEntries);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? entries.filter((entry) => `${entry.title} ${entry.detail}`.toLowerCase().includes(term)) : entries;
  }, [entries, query]);

  function saveNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setEntries((current) => [{ id: Date.now(), title: note.trim(), detail: "Note", time: "Just now", type: "note" }, ...current]);
    setNote("");
    setComposeOpen(false);
  }

  return (
    <PilotAppShell active="journal" landscape="journal">
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[34px] font-semibold leading-none tracking-[-0.045em]">Journal</h1>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search journal" className="purplelife-glass-clear grid size-11 place-items-center rounded-full transition-transform duration-300 active:scale-95"><Search size={20} /></button>
            <button type="button" onClick={() => setComposeOpen(true)} aria-label="Compose note" className="purplelife-glass-clear grid size-11 place-items-center rounded-full text-purplelife-accent transition-transform duration-300 active:scale-95"><Plus size={22} /></button>
          </div>
        </div>
        {searchOpen && <div className="relative mt-4"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purplelife-muted" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your journal" className="h-12 w-full rounded-[18px] border border-purplelife-line bg-white pl-11 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35" /></div>}
      </header>

      <section className="mt-6 px-5">
        <div className="overflow-hidden rounded-[32px] bg-white p-4 shadow-sm ring-1 ring-purplelife-line">
          <div className="overflow-hidden rounded-[26px] bg-purplelife-tint p-3">
            <JournalRibbon className="aspect-[16/9] w-full" />
          </div>
          <div className="px-1 pb-1 pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">This week</p>
            <h2 className="mt-2 text-[27px] font-semibold leading-[1.04] tracking-[-0.04em]">Your week takes shape here.</h2>
            <p className="mt-3 text-[15px] leading-[1.4] text-purplelife-muted">Notes, photos, symptoms, and sleep records will form a private timeline as you add them.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 px-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[22px] font-semibold tracking-[-0.035em]">Recent</h2><span className="text-[13px] font-medium text-purplelife-muted">{filtered.length} entries</span></div>
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
          {filtered.length === 0 && <div className="px-6 py-10 text-center"><NotebookPen size={25} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[15px] font-semibold">{query ? "No matching entries" : "No journal entries yet"}</p><p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-[1.45] text-purplelife-muted">{query ? "Try a different word or clear your search." : "Add one detail when something feels worth remembering."}</p></div>}
          {filtered.map((entry) => {
            const Icon = iconMap[entry.type];
            return (
              <button key={entry.id} type="button" onClick={() => setSelected(entry)} className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint">
                <span className={`grid size-12 shrink-0 place-items-center rounded-[16px] ${colorMap[entry.type]}`}><Icon size={22} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{entry.title}</span><span className="mt-1 block text-[13px] text-purplelife-muted">{entry.detail} · {entry.time}</span></span>
                <ChevronRight size={18} className="text-purplelife-muted" />
              </button>
            );
          })}
        </div>
      </section>

      {selected && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setSelected(null)}><div role="dialog" aria-modal="true" aria-label="Journal entry" onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] animate-in rounded-[34px] p-6 slide-in-from-bottom-6 duration-300"><div className="flex items-start justify-between gap-4"><div><p className="text-[13px] font-medium text-purplelife-muted">{selected.time}</p><h2 className="mt-2 text-[24px] font-semibold tracking-[-0.035em]">{selected.title}</h2><p className="mt-4 text-[15px] leading-[1.45] text-purplelife-muted">{selected.detail}. This detail stays in your private journal until you choose to share it.</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div></div></div>}

      {composeOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setComposeOpen(false)}><form onSubmit={saveNote} onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] animate-in rounded-[34px] p-5 slide-in-from-bottom-6 duration-300"><div className="flex items-center justify-between"><div><h2 className="text-[24px] font-semibold tracking-[-0.035em]">New note</h2><p className="mt-1 text-[13px] text-purplelife-muted">Anything you want to remember tomorrow.</p></div><button type="button" onClick={() => setComposeOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div><textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} placeholder="What happened today?" className="mt-5 min-h-44 w-full resize-none rounded-[22px] border border-purplelife-line bg-purplelife-canvas p-4 text-[16px] leading-relaxed outline-none focus:ring-2 focus:ring-purplelife-accent/35" /><button type="submit" disabled={!note.trim()} className="mt-4 h-12 w-full rounded-[16px] bg-purplelife-accent text-[15px] font-semibold text-white disabled:opacity-40">Save note</button></form></div>}
    </PilotAppShell>
  );
}
