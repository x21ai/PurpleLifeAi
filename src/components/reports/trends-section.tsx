import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { GripVertical, Pin, PinOff, EyeOff, ChevronRight, TrendingUp } from "lucide-react";
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

function MetricRow({
  m,
  onTogglePin,
  onHide,
}: {
  m: TrendMetricRow;
  onTogglePin: () => void;
  onHide: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: m.metric_key,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const label = m.display_name ?? m.metric_key.replace(/_/g, " ");
  const chartData = m.series
    .filter((p) => p.value != null)
    .map((p) => ({ at: p.at, v: p.value as number }));

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group report-card flex items-center gap-3 px-4 py-3.5"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-white/30 hover:text-white"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Link
        to="/reports/trends/$metricKey"
        params={{ metricKey: m.metric_key }}
        className="flex flex-1 items-center gap-3 min-w-0"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white truncate capitalize">{label}</p>
          <p className="text-[11px] report-muted">
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
          </p>
        </div>
        <div className="h-10 w-28 shrink-0">
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
        <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
      </Link>

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={m.pinned ? "Unpin" : "Pin to top"}
          title={m.pinned ? "Unpin" : "Pin to top"}
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onHide}
          aria-label="Hide"
          title="Hide from trends"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export function TrendsSection() {
  const fetchList = useServerFn(listTrendMetrics);
  const setPref = useServerFn(setMetricPreference);
  const reorder = useServerFn(reorderMetrics);
  const qc = useQueryClient();
  const [showHidden, setShowHidden] = React.useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["report-trend-metrics"],
    queryFn: () => fetchList(),
  });
  const metrics = (data?.metrics ?? []) as TrendMetricRow[];
  const visible = metrics.filter((m) => showHidden || !m.hidden);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [localOrder, setLocalOrder] = React.useState<string[] | null>(null);
  const orderedKeys = localOrder ?? visible.map((m) => m.metric_key);
  const byKey = new Map(metrics.map((m) => [m.metric_key, m]));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedKeys.indexOf(String(active.id));
    const newIndex = orderedKeys.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedKeys, oldIndex, newIndex);
    setLocalOrder(next);
    await reorder({ data: { order: next } });
    await qc.invalidateQueries({ queryKey: ["report-trend-metrics"] });
    setLocalOrder(null);
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

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl text-white">
            <TrendingUp className="h-4 w-4 text-[#5CE0AC]" /> Trends
          </h2>
          <p className="mt-1 text-sm report-muted">
            Metrics that appear in two or more reports. Drag to reorder, pin the ones that matter most.
          </p>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={orderedKeys} strategy={verticalListSortingStrategy}>
          <ul className="mt-4 space-y-2">
            {orderedKeys.map((k) => {
              const m = byKey.get(k);
              if (!m) return null;
              return (
                <MetricRow
                  key={k}
                  m={m}
                  onTogglePin={() => void togglePin(m)}
                  onHide={() => void hide(m)}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}