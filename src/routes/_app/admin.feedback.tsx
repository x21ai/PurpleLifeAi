import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin/feedback")({
  head: () => ({ meta: [{ title: "Feedback — Purple" }] }),
  component: AdminFeedback,
});

type Row = { id: string; user_id: string; category: string; message: string; created_at: string; resolved: boolean };

function AdminFeedback() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const load = React.useCallback(async () => {
    const { data } = await supabase.from("feedback").select("id, user_id, category, message, created_at, resolved").order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const toggle = async (r: Row) => {
    await supabase.from("feedback").update({ resolved: !r.resolved }).eq("id", r.id);
    await load();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl">Feedback</h1>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`rounded-2xl border border-border bg-card p-5 ${r.resolved ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">{r.category}</span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/80">{r.message}</p>
            <p className="mt-2 text-xs text-muted-foreground font-mono">{r.user_id.slice(0, 8)}…</p>
            <button onClick={() => toggle(r)} className="mt-3 text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary">
              {r.resolved ? "Reopen" : "Mark resolved"}
            </button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No feedback yet.</p>}
      </ul>
    </div>
  );
}