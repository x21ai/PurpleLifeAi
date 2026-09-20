import { useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  Clock3,
  MoonStar,
  NotebookPen,
  Pill,
  Sparkles,
  X,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";

type TimelineKind = "symptom" | "medication" | "sleep" | "photo" | "note";
type TimelineFilter = "all" | TimelineKind;

interface TimelineEvent {
  id: string;
  day: string;
  date: string;
  time: string;
  title: string;
  detail: string;
  kind: TimelineKind;
}

const sampleEvents: TimelineEvent[] = [
  {
    id: "today-note",
    day: "Today",
    date: "Sep 18",
    time: "3:20 PM",
    title: "A steadier afternoon",
    detail: "Added a short note after lunch. Energy felt more even than yesterday.",
    kind: "note",
  },
  {
    id: "today-medication",
    day: "Today",
    date: "Sep 18",
    time: "8:10 AM",
    title: "Morning medication",
    detail: "Marked the scheduled dose as taken. This is a sample record, not a reminder service.",
    kind: "medication",
  },
  {
    id: "yesterday-photo",
    day: "Yesterday",
    date: "Sep 17",
    time: "6:42 PM",
    title: "Dinner photo",
    detail: "Saved a photo with a private note for later context.",
    kind: "photo",
  },
  {
    id: "yesterday-symptom",
    day: "Yesterday",
    date: "Sep 17",
    time: "2:05 PM",
    title: "Head pressure",
    detail: "Recorded as mild and short. PurpleLife keeps the observation without drawing a medical conclusion.",
    kind: "symptom",
  },
  {
    id: "tuesday-sleep",
    day: "Tuesday",
    date: "Sep 16",
    time: "7:30 AM",
    title: "Sleep record",
    detail: "Logged a calm night and a slower start to the morning.",
    kind: "sleep",
  },
];

const kindStyles: Record<TimelineKind, { label: string; icon: typeof Sparkles; color: string; dot: string }> = {
  symptom: {
    label: "Symptoms",
    icon: Sparkles,
    color: "bg-purplelife-pink/15 text-purplelife-pink",
    dot: "bg-purplelife-pink",
  },
  medication: {
    label: "Medication",
    icon: Pill,
    color: "bg-purplelife-mint/25 text-purplelife-teal",
    dot: "bg-purplelife-teal",
  },
  sleep: {
    label: "Sleep",
    icon: MoonStar,
    color: "bg-purplelife-indigo/15 text-purplelife-indigo",
    dot: "bg-purplelife-indigo",
  },
  photo: {
    label: "Photos",
    icon: Camera,
    color: "bg-purplelife-yellow/25 text-purplelife-coral",
    dot: "bg-purplelife-yellow",
  },
  note: {
    label: "Notes",
    icon: NotebookPen,
    color: "bg-purplelife-blue/15 text-purplelife-blue",
    dot: "bg-purplelife-blue",
  },
};

const filters: Array<{ id: TimelineFilter; label: string }> = [
  { id: "all", label: "All activity" },
  { id: "symptom", label: "Symptoms" },
  { id: "medication", label: "Medication" },
  { id: "sleep", label: "Sleep" },
  { id: "photo", label: "Photos" },
  { id: "note", label: "Notes" },
];

const dayRail = [
  { day: "M", date: "15", tones: ["bg-purplelife-blue"] },
  { day: "T", date: "16", tones: ["bg-purplelife-indigo"] },
  { day: "W", date: "17", tones: ["bg-purplelife-pink", "bg-purplelife-yellow"] },
  { day: "T", date: "18", tones: ["bg-purplelife-teal", "bg-purplelife-blue"], active: true },
  { day: "F", date: "19", tones: [] },
  { day: "S", date: "20", tones: [] },
  { day: "S", date: "21", tones: [] },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-timeline-page
 * @ployComponentType page
 * @ployComponentDescription A dedicated chronological health history with a date rail, type filters, grouped events, and local sample or empty prototype states.
 * @ployComponentTags purplelife timeline health-history prototype
 * @ployComponentStatus stable
 */
export function TimelinePage() {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [showSample, setShowSample] = useState(true);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);

  const visibleEvents = useMemo(
    () => (showSample ? sampleEvents.filter((event) => filter === "all" || event.kind === filter) : []),
    [filter, showSample],
  );

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, { day: string; date: string; events: TimelineEvent[] }>();
    visibleEvents.forEach((event) => {
      const key = `${event.day}-${event.date}`;
      const current = groups.get(key) ?? { day: event.day, date: event.date, events: [] };
      current.events.push(event);
      groups.set(key, current);
    });
    return Array.from(groups.values());
  }, [visibleEvents]);

  return (
    <PilotAppShell active="journal" landscape="focused">
      <div className="px-5 pb-4 pt-4 md:px-8 lg:px-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-purplelife-accent">Health history</p>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-[-0.05em] md:text-[46px]">Timeline</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-[1.45] text-purplelife-muted">See what you recorded in the order it happened. Sample details are observations, not medical conclusions.</p>
          </div>
          <div className="shrink-0 rounded-[16px] bg-purplelife-rail p-1 text-[11px] font-semibold">
            <button type="button" onClick={() => setShowSample(true)} aria-pressed={showSample} className={`rounded-[12px] px-3 py-2 transition-colors ${showSample ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Sample</button>
            <button type="button" onClick={() => setShowSample(false)} aria-pressed={!showSample} className={`rounded-[12px] px-3 py-2 transition-colors ${!showSample ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Empty</button>
          </div>
        </header>

        <section className="mt-7 overflow-hidden rounded-[32px] bg-white p-4 shadow-sm ring-1 ring-purplelife-line md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">September 15–21</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.035em]">A week at a glance</h2>
            </div>
            <button type="button" className="purplelife-glass-clear flex min-h-11 items-center gap-2 rounded-[15px] px-3 text-[13px] font-semibold text-purplelife-ink">
              <CalendarDays size={17} className="text-purplelife-accent" />
              Week
              <ChevronDown size={15} className="text-purplelife-muted" />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1.5 rounded-[24px] bg-purplelife-tint p-2 md:gap-2 md:p-3">
            {dayRail.map((item, index) => (
              <div key={`${item.day}-${item.date}`} className={`flex min-h-[78px] flex-col items-center justify-between rounded-[18px] px-1 py-2.5 ${item.active ? "bg-white shadow-sm ring-1 ring-purplelife-line" : ""}`}>
                <span className="text-[11px] font-semibold text-purplelife-muted">{item.day}</span>
                <span className={`text-[16px] font-semibold ${item.active ? "text-purplelife-accent" : "text-purplelife-ink"}`}>{item.date}</span>
                <span className="flex h-2 items-center justify-center gap-1" aria-label={`${item.tones.length} sample records`}>
                  {showSample && item.tones.map((tone, toneIndex) => <span key={`${index}-${toneIndex}`} className={`size-1.5 rounded-full ${tone}`} />)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">View by type</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.035em]">Recorded activity</h2>
            </div>
            <span className="text-[12px] font-medium text-purplelife-muted">{visibleEvents.length} sample records</span>
          </div>
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:px-0">
            {filters.map((item) => (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-semibold transition-colors ${filter === item.id ? "bg-purplelife-accent text-white shadow-sm" : "bg-white text-purplelife-muted ring-1 ring-purplelife-line hover:text-purplelife-ink"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          {groupedEvents.length === 0 ? (
            <div className="rounded-[30px] bg-white px-6 py-12 text-center shadow-sm ring-1 ring-purplelife-line">
              <span className="mx-auto grid size-12 place-items-center rounded-[18px] bg-purplelife-tint text-purplelife-accent"><Clock3 size={23} /></span>
              <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.02em]">{showSample ? "No sample records in this view" : "Your timeline is ready"}</h2>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-[1.5] text-purplelife-muted">{showSample ? "Choose another activity type to see the sample history." : "Symptoms, medication, sleep, photos, and notes will appear here in chronological order."}</p>
            </div>
          ) : (
            <div className="space-y-7">
              {groupedEvents.map((group) => (
                <div key={`${group.day}-${group.date}`} className="md:grid md:grid-cols-[132px_minmax(0,1fr)] md:gap-5">
                  <div className="mb-3 flex items-baseline justify-between md:mb-0 md:block">
                    <h3 className="text-[18px] font-semibold tracking-[-0.025em]">{group.day}</h3>
                    <p className="mt-1 text-[12px] font-medium text-purplelife-muted">{group.date}</p>
                  </div>
                  <div className="relative space-y-3 pl-6 before:absolute before:bottom-5 before:left-[7px] before:top-5 before:w-px before:bg-purplelife-line">
                    {group.events.map((event) => {
                      const style = kindStyles[event.kind];
                      const Icon = style.icon;
                      return (
                        <button key={event.id} type="button" onClick={() => setSelected(event)} className="relative flex w-full items-center gap-3.5 rounded-[24px] bg-white p-3.5 text-left shadow-sm ring-1 ring-purplelife-line transition-transform active:scale-[0.99] md:p-4">
                          <span className={`absolute -left-[23px] top-1/2 size-3 -translate-y-1/2 rounded-full ring-4 ring-purplelife-canvas ${style.dot}`} />
                          <span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${style.color}`}><Icon size={20} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="truncate text-[15px] font-semibold">{event.title}</span>
                              <span className="shrink-0 text-[11px] font-medium text-purplelife-muted">{event.time}</span>
                            </span>
                            <span className="mt-1 block truncate text-[12px] text-purplelife-muted">{style.label} · {event.detail}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-[12px] leading-[1.5] text-purplelife-muted">Design preview. Timeline controls use local sample state and do not read or save health data.</p>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setSelected(null)}>
          <div role="dialog" aria-modal="true" aria-label="Timeline record" onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[430px] rounded-[34px] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{selected.day} · {selected.time}</p>
                <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.035em]">{selected.title}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button>
            </div>
            <p className="mt-5 text-[15px] leading-[1.55] text-purplelife-muted">{selected.detail}</p>
            <div className="mt-5 rounded-[20px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted">This is sample information for design review. Production APIs and persistent health records are not connected.</div>
          </div>
        </div>
      )}
    </PilotAppShell>
  );
}
