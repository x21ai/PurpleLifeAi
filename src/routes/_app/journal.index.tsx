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

type Entry = Database["public"]["Tables"]["journal_entries"]["Row"];

export const Route = createFileRoute("/_app/journal/")({
  head: () => ({ meta: [{ title: "Journal — Purple" }] }),
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

  return (
    <div
      className="mx-auto max-w-3xl px-4 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-32"
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
            <div key={i} className="h-28 rounded-2xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 inline-flex rounded-full border border-border bg-secondary/40 p-1 text-sm">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={`px-4 py-1.5 rounded-full transition ${tab === "active" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              {t("journal.tabActive")}
            </button>
            <button
              type="button"
              onClick={() => setTab("archive")}
              className={`px-4 py-1.5 rounded-full transition ${tab === "archive" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              {t("journal.tabArchive")}
            </button>
          </div>
          {(() => {
            const visible = entries.filter((e) =>
              tab === "active" ? !e.archived_at : !!e.archived_at,
            );
            if (visible.length === 0) return <EmptyState archive={tab === "archive"} t={t} />;
            return (
              <div className="space-y-3">
                {visible.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
            );
          })()}
        </>
      )}

      <button
        type="button"
        onClick={() => navigate({ to: "/journal/new" })}
        aria-label={t("journal.newEntry")}
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3.5 shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition"
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