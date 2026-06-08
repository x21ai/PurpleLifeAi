import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Pin, PinOff, EyeOff, TrendingUp, GripVertical } from "lucide-react";
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

function flagTone(flag: string | null) {
  if (flag === "high") return "text-[#FFA8BD]";
  if (flag === "low") return "text-[#F3D58B]";
  if (flag === "normal") return "text-[#5CE0AC]";
  return "report-muted";
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

type SortMode = "alpha" | "attention" | "recent" | "count" | "custom";
const SORT_KEY = "purple.trends.sort";

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
  const label = m.display_name ?? m.metric_key.replace(/_/g, " ");
  const chartData = m.series
    .filter((p) => p.value != null)
    .map((p) => ({ at: p.at, v: p.value as number }));
  const latestDate = formatDate(m.latest_at);

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={
        "group report-card relative flex flex-col gap-3 p-4 " +
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
        <div className="min-w-0 pr-20">
          <p className="text-sm text-white capitalize line-clamp-2 leading-snug">{label}</p>
          <p className="mt-1 text-[11px] report-muted">
            {m.count} readings
            {m.latest_value != null && (
              <>
                {" · latest "}
                <span className={flagTone(m.latest_flag)}>
                  {m.latest_value}
                  {m.unit ? ` ${m.unit}` : ""}
                </span>
              </>
            )}
            {latestDate && <span className="text-white/45"> · {latestDate}</span>}
          </p>
        </div>
        <div className="h-14 w-full">
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#5CE0AC"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded bg-white/5" />
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
    return (window.sessionStorage.getItem(SORT_KEY) as SortMode) || "alpha";
  });
  React.useEffect(() => {
    if (typeof window !== "undefined") window.sessionStorage.setItem(SORT_KEY, sortMode);
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

  if (isLoading) return null;
  if (metrics.length === 0) return null;

  const draggable = sortMode === "custom";

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
          <label className="text-xs text-white/55 inline-flex items-center gap-2">
            Sort
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-full bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="alpha">Alphabetical</option>
              <option value="attention">Needs attention</option>
              <option value="recent">Most recent</option>
              <option value="count">Most readings</option>
              <option value="custom">Custom (drag)</option>
            </select>
          </label>
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