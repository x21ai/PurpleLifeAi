import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/journal/$entryId/edit")({
  head: () => ({ meta: [{ title: "Edit entry — Purple" }] }),
  component: JournalEditPage,
});

function JournalEditPage() {
  useRouteTheme("dark");
  const navigate = useNavigate();
  const { entryId } = Route.useParams();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [text, setText] = React.useState("");
  const [voice, setVoice] = React.useState("");
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("text, voice_transcript")
        .eq("id", entryId)
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setText(data.text ?? "");
        setVoice(data.voice_transcript ?? "");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [entryId, userId]);

  const close = () => navigate({ to: "/journal" });

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("journal_entries")
      .update({
        text: text.trim() ? text : null,
        voice_transcript: voice.trim() ? voice : null,
        status: "processing",
      })
      .eq("id", entryId)
      .eq("user_id", userId);
    if (error) {
      setSaving(false);
      toast.error("Couldn't save changes");
      return;
    }

    // Re-run extraction (idempotent upsert + stale-key sweep).
    void supabase.functions
      .invoke("journal-extract", { body: { journal_entry_id: entryId } })
      .catch(() => { /* extraction errors don't block save */ });

    toast.success("Entry updated");
    navigate({ to: "/journal" });
  };

  const hasContent = text.trim().length > 0 || voice.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary/60"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-base font-normal text-foreground/80">Edit entry</h1>
        <Button
          onClick={handleSave}
          disabled={!hasContent || saving || loading || notFound}
          size="sm"
          className="rounded-full px-5"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
        {loading ? (
          <div className="h-40 rounded-2xl bg-secondary/40 animate-pulse" />
        ) : notFound ? (
          <p className="font-serif text-base text-muted-foreground mt-10 text-center">
            This entry no longer exists.
          </p>
        ) : (
          <>
            <Textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What is happening, or what just happened?"
              className="min-h-[160px] border-0 shadow-none focus-visible:ring-0 px-0 text-lg resize-none font-serif bg-transparent placeholder:text-foreground/40 placeholder:font-sans"
            />
            {voice.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Voice transcript
                </p>
                <Textarea
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="min-h-[120px] font-serif text-base italic bg-secondary/40"
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}