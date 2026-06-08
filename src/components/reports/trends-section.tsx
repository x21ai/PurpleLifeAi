import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import {
  Pin,
  PinOff,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Minus,
  GripVertical,
  Download,
  Share2,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  listTrendMetrics,
  setMetricPreference,
  reorderMetrics,
  type TrendMetricRow,
} from "@/lib/report-trends.functions";
import { downloadMetricCsv, shareMetric } from "@/lib/metric-export";
import { resolveMetricLabel } from "@/lib/metric-naming";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function flagTone(flag: string | null) {
  if (flag === "high") return "text-[#FFA8BD]";
  if (flag === "low") return "text-[#F3D58B]";
  if (flag === "normal") return "text-[#5CE0AC]";
  return "report-muted";
}

function flagStroke(flag: string | null) {
  if (flag === "high") return "#FFA8BD";
  if (flag === "low") return "#F3D58B";
  if (flag === "normal") return "#5CE0AC";
  return "#9AA3AC";
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTick(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTickWithYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = String(d.getFullYear()).slice(-2);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ` '${y}`;
}

function metricLabel(m: TrendMetricRow): { primary: string; secondary: string | null } {
  const r = resolveMetricLabel(m.metric_key, m.display_name);
  return { primary: r.primary, secondary: r.asPrinted };
}

type SortMode = "alpha" | "attention" | "recent" | "count" | "custom";
// localStorage so the choice persists across logout/login on the same device.
const SORT_KEY = "purple.trends.sort.v2";

function MetricCard({
  m,
  onTogglePin,
  onHide,
  draggable,
}: {
  m: TrendMetricRow;
  onTogglePin: () => void;
  onHide: () => void;
  draggable: boolean;
}) {
  const sortable = useSortable({ id: m.metric_key, disabled: !draggable });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  const { primary: label, secondary: subLabel } = metricLabel(m);
  const numeric = m.series.filter((p) => p.value != null) as Array<{ at: string; value: number; source_text: string | null; report_id: string }>;
  const chartData = numeric.map((p) => ({ at: p.at, v: p.value, ts: new Date(p.at).getTime(), source_text: p.source_text, report_id: p.report_id }));
  const spansMultipleYears = (() => {
    if (numeric.length < 2) return false;
    const years = new Set(numeric.map((p) => new Date(p.at).getFullYear()));
    return years.size > 1;
  })();
  const tickFmt = spansMultipleYears ? formatTickWithYear : formatTick;
  const latestDate = formatDate(m.latest_at);
  const stroke = flagStroke(m.latest_flag);
  const prev = numeric.length >= 2 ? numeric[numeric.length - 2].value : null;
  const latestNum = numeric.length >= 1 ? numeric[numeric.length - 1].value : null;
  const delta = latestNum != null && prev != null ? latestNum - prev : null;
  const deltaPct = delta != null && prev !== 0 && prev != null ? (delta / Math.abs(prev)) * 100 : null;
  const refLow = m.reference_low;
  const refHigh = m.reference_high;
  const inRange =
    latestNum != null && refLow != null && refHigh != null
      ? latestNum >= refLow && latestNum <= refHigh
      : null;

  const statusChip = (() => {
    if (m.latest_flag === "high") return { label: "Out of range, high", cls: "bg-[#FFA8BD]/15 text-[#FFA8BD] border-[#FFA8BD]/30" };
    if (m.latest_flag === "low") return { label: "Out of range, low", cls: "bg-[#F3D58B]/15 text-[#F3D58B] border-[#F3D58B]/30" };
    if (inRange === true || m.latest_flag === "normal")
      return { label: "In range", cls: "bg-[#5CE0AC]/15 text-[#5CE0AC] border-[#5CE0AC]/30" };
    if (delta != null && delta > 0) return { label: "Trending up", cls: "bg-white/8 text-white/70 border-white/15" };
    if (delta != null && delta < 0) return { label: "Trending down", cls: "bg-white/8 text-white/70 border-white/15" };
    return { label: `${m.count} readings`, cls: "bg-white/8 text-white/70 border-white/15" };
  })();

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rows = m.series.map((p) => ({
      at: p.at,
      value: p.value,
      unit: m.unit,
      report: null,
    }));
    downloadMetricCsv(`${m.metric_key}.csv`, rows);
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/reports/trends/${encodeURIComponent(m.metric_key)}`
      : undefined;
    const text = `${label}, ${m.count} readings${
      m.latest_value != null ? `, latest ${m.latest_value}${m.unit ? ` ${m.unit}` : ""}` : ""
    }${latestDate ? ` on ${latestDate}` : ""}`;
    const status = await shareMetric({ title: `Purple · ${label}`, text, url });
    if (status === "copied") toast.success("Link copied to clipboard");
    else if (status === "failed") toast.error("Couldn't share");
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={
        "group report-card relative flex flex-col gap-2 p-4 " +
        (sortable.isDragging ? "opacity-60 ring-1 ring-white/30" : "")
      }
    >
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity z-10">
        {draggable && (
          <button
            type="button"
            {...sortable.attributes}
            {...sortable.listeners}
            aria-label="Drag to reorder"
            title="Drag to reorder"
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share"
          title="Share"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download CSV"
          title="Download CSV"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          aria-label={m.pinned ? "Unpin" : "Pin to top"}
          title={m.pinned ? "Unpin" : "Pin to top"}
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHide();
          }}
          aria-label="Hide"
          title="Hide from trends"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link
        to="/reports/trends/$metricKey"
        params={{ metricKey: m.metric_key }}
        className="flex flex-col gap-2 min-w-0"
      >
        <div className="min-w-0 pr-32">
          <p className="text-sm text-white line-clamp-2 leading-snug">{label}</p>
          {subLabel && (
            <p className="text-[10px] text-white/40 leading-tight">as printed: {subLabel}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] report-muted">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${statusChip.cls}`}>
              {statusChip.label}
            </span>
            <span>{m.count} readings</span>
            {refLow != null && refHigh != null && (
              <span>
                · ref {refLow}–{refHigh}
                {m.unit ? ` ${m.unit}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="h-32 w-full">
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                {refLow != null && refHigh != null && (
                  <ReferenceArea
                    y1={refLow}
                    y2={refHigh}
                    fill="#5CE0AC"
                    fillOpacity={0.08}
                    ifOverflow="extendDomain"
                  />
                )}
                <XAxis
                  dataKey="at"
                  tick={{ fontSize: 10, fill: "#9AA3AC" }}
                  tickFormatter={tickFmt}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9AA3AC" }}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0F1418",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "#E6EAEE",
                  }}
                  labelFormatter={(v: string) => formatTickWithYear(v)}
                  formatter={(val: number, _name: string, props: any) => {
                    const pt = props?.payload;
                    const source = pt?.source_text;
                    const reportId = pt?.report_id;
                    const reportLabel = source ? `PDF wording: ${source}` : null;
                    const valueStr = `${val}${m.unit ? ` ${m.unit}` : ""}`;
                    return [
                      <div key="v" className="space-y-0.5">
                        <div>{valueStr}</div>
                        {reportLabel && <div className="text-white/50 text-[10px]">{reportLabel}</div>}
                        {reportId && (
                          <a
                            href={`/reports/${reportId}`}
                            className="text-[color:var(--purple-primary)] text-[10px] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View source report
                          </a>
                        )}
                      </div>,
                      label,
                    ];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={stroke}
                  strokeWidth={1.75}
                  dot={{ r: 2.5, stroke: stroke, fill: stroke }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded bg-white/5 text-[11px] report-muted">
              Need ≥2 numeric readings
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] report-muted">
          <span>
            {m.latest_value != null ? (
              <>
                Latest{" "}
                <span className={flagTone(m.latest_flag)}>
                  {m.latest_value}
                  {m.unit ? ` ${m.unit}` : ""}
                </span>
                {latestDate && <span className="text-white/45"> · {latestDate}</span>}
              </>
            ) : (
              latestDate
            )}
          </span>
          {delta != null && (
            <span className="inline-flex items-center gap-0.5 text-white/65">
              {delta > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : delta < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {delta > 0 ? "+" : ""}
              {Math.abs(delta) >= 100 ? delta.toFixed(0) : delta.toFixed(2)}
              {deltaPct != null && Number.isFinite(deltaPct) && (
                <span className="text-white/40"> ({deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%)</span>
              )}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

export function TrendsSection() {
  const fetchList = useServerFn(listTrendMetrics);
  const setPref = useServerFn(setMetricPreference);
  const reorder = useServerFn(reorderMetrics);
  const qc = useQueryClient();
  const [showHidden, setShowHidden] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<SortMode>(() => {
    if (typeof window === "undefined") return "alpha";
    // Prefer localStorage (survives logout); fall back to legacy sessionStorage.
    const stored =
      window.localStorage.getItem(SORT_KEY) ||
      window.sessionStorage.getItem("purple.trends.sort");
    return (stored as SortMode) || "alpha";
  });
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SORT_KEY, sortMode);
    }
  }, [sortMode]);

  const { data, isLoading } = useQuery({
    queryKey: ["report-trend-metrics"],
    queryFn: () => fetchList(),
  });
  const metrics = (data?.metrics ?? []) as TrendMetricRow[];
  const visible = metrics.filter((m) => showHidden || !m.hidden);

  const labelOf = (m: TrendMetricRow) =>
    (m.display_name ?? m.metric_key.replace(/_/g, " ")).toLowerCase();
  const attentionRank = (m: TrendMetricRow) =>
    m.latest_flag === "high" || m.latest_flag === "low" ? 0 : m.latest_flag === "normal" ? 1 : 2;
  const sorted = React.useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      switch (sortMode) {
        case "attention": {
          const d = attentionRank(a) - attentionRank(b);
          if (d !== 0) return d;
          return labelOf(a).localeCompare(labelOf(b));
        }
        case "recent":
          return (b.latest_at ?? "").localeCompare(a.latest_at ?? "");
        case "count":
          return b.count - a.count;
        case "custom":
          return a.sort_order - b.sort_order || labelOf(a).localeCompare(labelOf(b));
        case "alpha":
        default:
          return labelOf(a).localeCompare(labelOf(b));
      }
    });
    return arr;
  }, [visible, sortMode]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sorted.map((m) => m.metric_key);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(ids, from, to);
    setSortMode("custom");
    await reorder({ data: { order: next } });
    await qc.invalidateQueries({ queryKey: ["report-trend-metrics"] });
  }

  async function togglePin(m: TrendMetricRow) {
    await setPref({ data: { metricKey: m.metric_key, pinned: !m.pinned } });
    await qc.invalidateQueries({ queryKey: ["report-trend-metrics"] });
  }

  async function hide(m: TrendMetricRow) {
    await setPref({ data: { metricKey: m.metric_key, hidden: true } });
    await qc.invalidateQueries({ queryKey: ["report-trend-metrics"] });
  }

  const draggable = sortMode === "custom";

  if (isLoading) {
    return (
      <section className="mt-10">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-2xl text-white">
              <TrendingUp className="h-4 w-4 text-[#5CE0AC]" /> Trends
            </h2>
            <p className="mt-1 text-sm report-muted">Loading your lab values…</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="report-card h-48 animate-pulse bg-white/[0.03]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (metrics.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-serif text-2xl text-white">
          <TrendingUp className="h-4 w-4 text-[#5CE0AC]" /> Trends
        </h2>
        <div className="mt-4 report-card p-8 text-center">
          <p className="text-base text-white">No lab values yet</p>
          <p className="mt-2 text-sm report-muted max-w-[420px] mx-auto">
            Upload a blood panel, lab report, or imaging PDF. Purple reads each file
            and trends every value over time, with reference ranges.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              to="/reports/new"
              className="inline-flex items-center rounded-full bg-white text-[#07090C] px-4 py-2 text-sm hover:bg-white/90"
            >
              Upload a report
            </Link>
            <Link
              to="/reports/documents"
              className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              View reports
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl text-white">
            <TrendingUp className="h-4 w-4 text-[#5CE0AC]" /> Trends
          </h2>
          <p className="mt-1 text-sm report-muted">
            Every metric from your reports. Pin the ones that matter most. Switch to Custom to drag.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/55 inline-flex items-center gap-2">
            Sort
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="h-8 w-[170px] rounded-full bg-white/5 border-white/10 text-white text-xs px-3 hover:bg-white/10 focus:ring-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F1418] border-white/10 text-white">
                <SelectItem value="alpha" className="text-white focus:bg-white/10 focus:text-white">Alphabetical</SelectItem>
                <SelectItem value="attention" className="text-white focus:bg-white/10 focus:text-white">Needs attention</SelectItem>
                <SelectItem value="recent" className="text-white focus:bg-white/10 focus:text-white">Most recent</SelectItem>
                <SelectItem value="count" className="text-white focus:bg-white/10 focus:text-white">Most readings</SelectItem>
                <SelectItem value="custom" className="text-white focus:bg-white/10 focus:text-white">Custom (drag)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {metrics.some((m) => m.hidden) && (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="text-xs text-white/60 hover:text-white"
            >
              {showHidden ? "Hide hidden" : "Show hidden"}
            </button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((m) => m.metric_key)} strategy={rectSortingStrategy}>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {sorted.map((m) => (
              <MetricCard
                key={m.metric_key}
                m={m}
                draggable={draggable}
                onTogglePin={() => void togglePin(m)}
                onHide={() => void hide(m)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}