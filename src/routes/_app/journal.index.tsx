import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { EntryCard } from "@/components/journal/entry-card";
import type { Database } from "@/integrations/supabase/types";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";
import { OfflineQueueBanner } from "@/components/journal/offline-queue-banner";
import { Input } from "@/components/ui/input";

type Entry = Database["public"]["Tables"]["journal_entries"]["Row"];

export const Route = createFileRoute("/_app/journal/")({
  head: () => ({ meta: [{ title: "Journal · Purple" }] }),
  component: JournalPage,
});

function JournalPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [tab, setTab] = React.useState<"active" | "archive">("active");
  const [fromDate, setFromDate] = React.useState<string>(""); // YYYY-MM-DD
  const [toDate, setToDate] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 15;

  const load = React.useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("captured_at", { ascending: false })
      .limit(200);
    if (!error && data) setEntries(data as Entry[]);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  React.useEffect(() => { void load(); }, [load]);

  // Realtime updates
  React.useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`journal-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "journal_entries", filter: `user_id=eq.${userId}` },
        (payload) => {
          setEntries((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Entry;
              if (prev.some((e) => e.id === next.id)) return prev;
              return [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Entry;
              return prev.map((e) => (e.id === next.id ? next : e));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as { id: string };
              return prev.filter((e) => e.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  // Pull-to-refresh (touch)
  const startY = React.useRef<number | null>(null);
  const [pull, setPull] = React.useState(0);
  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const d = e.touches[0].clientY - startY.current;
    if (d > 0) setPull(Math.min(d, 80));
  };
  const onTouchEnd = () => {
    if (pull > 60) {
      setRefreshing(true);
      void load();
    }
    startY.current = null;
    setPull(0);
  };

  const refresh = () => { setRefreshing(true); void load(); };

  // Reset page when filters or tab change
  React.useEffect(() => { setPage(1); }, [tab, fromDate, toDate]);

  function setPreset(preset: "all" | "7d" | "30d" | "month") {
    if (preset === "all") { setFromDate(""); setToDate(""); return; }
    const now = new Date();
    const toStr = ymd(now);
    if (preset === "7d") {
      const f = new Date(now); f.setDate(f.getDate() - 6);
      setFromDate(ymd(f)); setToDate(toStr);
    } else if (preset === "30d") {
      const f = new Date(now); f.setDate(f.getDate() - 29);
      setFromDate(ymd(f)); setToDate(toStr);
    } else if (preset === "month") {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(ymd(f)); setToDate(toStr);
    }
  }
  const hasFilter = !!(fromDate || toDate);
  const clearFilter = () => { setFromDate(""); setToDate(""); };

  return (
    <div
      className="mx-auto max-w-3xl min-h-full bg-[#faf8fb] bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(237,228,244,0.85),transparent_55%)] px-4 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-32"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <p className="label-eyebrow text-muted-foreground">{t("journal.eyebrow")}</p>
          <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
            {t("journal.title1")}<br/>{t("journal.title2")}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          className="hidden sm:inline-flex"
          aria-label="Refresh"
        >
          <RefreshCw className={refreshing ? "animate-spin h-4 w-4" : "h-4 w-4"} />
        </Button>
      </div>

      {pull > 0 && (
        <div
          className="flex justify-center text-xs text-muted-foreground mb-2"
          style={{ height: pull }}
        >
          <RefreshCw className={pull > 60 || refreshing ? "animate-spin h-4 w-4 mt-2" : "h-4 w-4 mt-2"} />
        </div>
      )}

      <OfflineQueueBanner />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-surface h-28 rounded-[20px] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="glass-pill mb-4 inline-flex p-1 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={`glass-press rounded-full px-4 py-2 transition ${tab === "active" ? "bg-background/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {t("journal.tabActive")}
            </button>
            <button
              type="button"
              onClick={() => setTab("archive")}
              className={`glass-press rounded-full px-4 py-2 transition ${tab === "archive" ? "bg-background/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {t("journal.tabArchive")}
            </button>
          </div>

          {/* Date filter bar */}
          <div className="glass-surface mb-6 space-y-4 rounded-[20px] p-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "all" as const, label: "All" },
                { key: "7d" as const, label: "7 days" },
                { key: "30d" as const, label: "30 days" },
                { key: "month" as const, label: "This month" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className="glass-pill glass-press text-xs font-medium px-3 py-2 text-foreground transition hover:opacity-90 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <label className="inline-flex items-center gap-1.5">
                <span>From</span>
                <Input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 w-[150px] text-xs"
                />
              </label>
              <label className="inline-flex items-center gap-1.5">
                <span>To</span>
                <Input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 w-[150px] text-xs"
                />
              </label>
              {hasFilter && (
                <button
                  type="button"
                  onClick={clearFilter}
                  className="text-xs underline-offset-2 hover:underline text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {(() => {
            const tabFiltered = entries.filter((e) =>
              tab === "active" ? !e.archived_at : !!e.archived_at,
            );
            const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
            const toTs = toDate ? new Date(toDate + "T23:59:59.999").getTime() : null;
            const filtered = tabFiltered.filter((e) => {
              if (!fromTs && !toTs) return true;
              const t = new Date(e.captured_at).getTime();
              if (fromTs && t < fromTs) return false;
              if (toTs && t > toTs) return false;
              return true;
            });

            if (filtered.length === 0) {
              if (hasFilter) {
                return (
                  <div className="glass-surface mx-auto max-w-md rounded-[20px] px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">No entries in this date range.</p>
                    <button
                      type="button"
                      onClick={clearFilter}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Clear filter
                    </button>
                  </div>
                );
              }
              return <EmptyState archive={tab === "archive"} t={t} />;
            }

            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            const safePage = Math.min(page, totalPages);
            const startIdx = (safePage - 1) * PAGE_SIZE;
            const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length);
            const slice = filtered.slice(startIdx, endIdx);
            const showPagination = filtered.length > PAGE_SIZE;
            const pageNumbers = compactPages(safePage, totalPages);

            return (
              <>
                <div className="space-y-4">
                  {slice.map((e) => (
                    <EntryCard key={e.id} entry={e} />
                  ))}
                </div>
                {showPagination && (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="glass-pill glass-press px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
                      >
                        Prev
                      </button>
                      {pageNumbers.map((n: number | "…", i: number) =>
                        n === "…" ? (
                          <span key={`e-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
                        ) : (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPage(n as number)}
                            className={`glass-pill glass-press min-w-[2rem] px-2.5 py-1.5 text-xs ${
                              n === safePage
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:opacity-90"
                            }`}
                          >
                            {n}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="glass-pill glass-press px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
                      >
                        Next
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      Showing {startIdx + 1}–{endIdx} of {filtered.length}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      <button
        type="button"
        onClick={() => navigate({ to: "/journal/new" })}
        aria-label={t("journal.newEntry")}
        className="native-fab-fixed glass-press fixed bottom-24 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:bottom-8 md:right-8"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">{t("journal.newEntry")}</span>
      </button>
    </div>
  );
}

function EmptyState({ archive = false, t }: { archive?: boolean; t: (k: string) => string }) {
  if (archive) {
    return (
      <div className="text-center py-16 px-6">
        <p className="font-serif text-lg leading-relaxed text-muted-foreground max-w-md mx-auto">
          {t("journal.emptyArchive")}
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <BookOpen className="h-9 w-9 text-primary/70" />
      </div>
      <p className="font-serif text-lg leading-relaxed text-foreground max-w-md mx-auto">
        {t("journal.emptyTitle")}
      </p>
    </div>
  );
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function compactPages(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}