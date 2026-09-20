import { useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  ChevronRight,
  CircleGauge,
  Droplets,
  HeartPulse,
  Link2,
  LockKeyhole,
  MoonStar,
  Plus,
  Search,
  Thermometer,
  Weight,
  Wind,
} from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { VitalWave } from "@/components/pages/pilot/components/mobile-graphics";

type MetricSource = "All" | "Manual" | "Connected";
type MetricCategory = "Heart" | "Body" | "Sleep" | "Activity";

type Metric = {
  label: string;
  detail: string;
  slug: string;
  category: MetricCategory;
  source: Exclude<MetricSource, "All">;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
};

const metrics: Metric[] = [
  { label: "Resting heart rate", detail: "Beats per minute", slug: "resting-heart-rate", category: "Heart", source: "Connected", icon: HeartPulse, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Heart rate variability", detail: "Milliseconds", slug: "hrv", category: "Heart", source: "Connected", icon: Activity, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { label: "Blood pressure", detail: "Systolic and diastolic", slug: "blood-pressure", category: "Heart", source: "Manual", icon: CircleGauge, color: "bg-purplelife-coral/15 text-purplelife-coral" },
  { label: "Body temperature", detail: "Degrees", slug: "temperature", category: "Body", source: "Manual", icon: Thermometer, color: "bg-purplelife-peach text-purplelife-coral" },
  { label: "Blood oxygen", detail: "Percentage", slug: "blood-oxygen", category: "Body", source: "Connected", icon: Droplets, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "Respiratory rate", detail: "Breaths per minute", slug: "respiratory-rate", category: "Body", source: "Connected", icon: Wind, color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { label: "Weight", detail: "Your preferred unit", slug: "weight", category: "Body", source: "Manual", icon: Weight, color: "bg-purplelife-tint text-purplelife-accent" },
  { label: "Sleep duration", detail: "Hours and minutes", slug: "sleep-duration", category: "Sleep", source: "Connected", icon: MoonStar, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { label: "Steps", detail: "Daily total", slug: "steps", category: "Activity", source: "Connected", icon: Activity, color: "bg-purplelife-blue/15 text-purplelife-blue" },
];

const categories: Array<MetricCategory | "All"> = ["All", "Heart", "Body", "Sleep", "Activity"];
const sourceFilters: MetricSource[] = ["All", "Manual", "Connected"];

function BiometricsHero() {
  return (
    <section className="px-5 pt-1 text-center">
      <VitalWave className="mx-auto w-full max-w-[355px]" />
      <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Measurements</p>
      <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Find the reading you want to review.</h1>
      <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Browse measurements you can enter or connect. PurpleLife keeps the source beside every recorded value.</p>
    </section>
  );
}

function MetricBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MetricCategory | "All">("All");
  const [source, setSource] = useState<MetricSource>("All");

  const visibleMetrics = useMemo(() => metrics.filter((metric) => {
    const matchesQuery = `${metric.label} ${metric.detail}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || metric.category === category;
    const matchesSource = source === "All" || metric.source === source;
    return matchesQuery && matchesCategory && matchesSource;
  }), [category, query, source]);

  return (
    <section className="mt-7 px-5">
      <label className="flex h-12 items-center gap-2 rounded-[18px] bg-white px-4 shadow-sm ring-1 ring-purplelife-line">
        <Search size={18} className="text-purplelife-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a measurement" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-purplelife-muted/60" />
      </label>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-9 shrink-0 rounded-full px-4 text-[12px] font-semibold transition-colors ${category === item ? "bg-purplelife-accent text-white" : "bg-white text-purplelife-muted ring-1 ring-purplelife-line"}`}>{item}</button>)}
      </div>

      <div className="mt-3 grid grid-cols-3 rounded-[18px] bg-purplelife-rail p-1">
        {sourceFilters.map((item) => <button key={item} type="button" onClick={() => setSource(item)} className={`min-h-9 rounded-[14px] text-[12px] font-semibold transition-colors ${source === item ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{item}</button>)}
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
        {visibleMetrics.length > 0 ? visibleMetrics.map(({ label, detail, slug, source: metricSource, icon: Icon, color }) => (
          <a key={slug} href={`/biometrics/${slug}`} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0 active:bg-purplelife-tint">
            <span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{label}</span>
              <span className="mt-1 block text-[12px] text-purplelife-muted">{detail} · {metricSource === "Manual" ? "manual entry" : "connected source"}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-purplelife-muted" />
          </a>
        )) : (
          <div className="px-6 py-9 text-center">
            <Search size={23} className="mx-auto text-purplelife-accent" />
            <p className="mt-3 text-[14px] font-semibold">No measurements match</p>
            <p className="mt-1 text-[12px] text-purplelife-muted">Try another category or source.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function SourceGuidance() {
  return (
    <section className="mt-5 px-5">
      <div className="overflow-hidden rounded-[24px] bg-purplelife-tint">
        <a href="/apple-health-import" className="flex items-center gap-3.5 border-b border-purplelife-accent/10 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white text-purplelife-accent"><Link2 size={19} /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">Review connected sources</span><span className="mt-1 block text-[12px] leading-[1.4] text-purplelife-muted">Nothing is connected by this prototype.</span></span>
          <ChevronRight size={18} className="text-purplelife-muted" />
        </a>
        <p className="flex gap-3 p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={18} className="shrink-0 text-purplelife-accent" />Measurements are observations, not diagnoses. PurpleLife does not tell you to change treatment.</p>
      </div>
    </section>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-biometrics-page
 * @ployComponentType page
 * @ployComponentDescription Searchable PurpleLife measurements hub with category and source filters, careful source context, and links to metric histories.
 * @ployComponentTags purplelife biometrics measurements health
 * @ployComponentStatus experimental
 */
export function BiometricsPage() {
  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title="Measurements" backHref="/my-health" action={<a href="/capture" aria-label="Add measurement" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} />
      <BiometricsHero />
      <PilotLandscapeStack>
        <MetricBrowser />
        <SourceGuidance />
      </PilotLandscapeStack>
    </PilotAppShell>
  );
}
