import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { CaptureSheet } from "@/components/journal/capture-sheet";
import { EntryCard } from "@/components/journal/entry-card";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["journal_entries"]["Row"];

export const Route = createFileRoute("/_app/journal")({
  head: () => ({ meta: [{ title: "Journal — Purple" }] }),
  component: JournalPage,
});

function JournalPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [captureOpen, setCaptureOpen] = React.useState(false);

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
      className="mx-auto max-w-2xl px-4 sm:px-8 pt-8 sm:pt-12 pb-32"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything you've shared, in order.</p>
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

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setCaptureOpen(true)}
        aria-label="New entry"
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3.5 shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition"
      >
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">New entry</span>
      </button>

      <CaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <BookOpen className="h-9 w-9 text-primary/70" />
      </div>
      <p className="font-serif text-lg leading-relaxed text-foreground max-w-md mx-auto">
        Your journal is yours. Write, speak, photograph, or record anything. I will read it carefully and remember it for you.
      </p>
    </div>
  );
}