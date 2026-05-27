import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin/contact")({
  head: () => ({ meta: [{ title: "Contact messages — Purple" }] }),
  component: AdminContact,
});

type Row = { id: string; name: string; email: string; subject: string | null; message: string; created_at: string; handled: boolean };

function AdminContact() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("contact_messages")
      .select("id, name, email, subject, message, created_at, handled")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const toggle = async (r: Row) => {
    await supabase.from("contact_messages").update({ handled: !r.handled, handled_at: r.handled ? null : new Date().toISOString() }).eq("id", r.id);
    await load();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl">Contact messages</h1>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`rounded-2xl border border-border bg-card p-5 ${r.handled ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{r.name} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a></span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            {r.subject && <p className="mt-2 font-serif text-lg">{r.subject}</p>}
            <p className="mt-1 text-sm whitespace-pre-wrap text-foreground/80">{r.message}</p>
            <button onClick={() => toggle(r)} className="mt-3 text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary">
              {r.handled ? "Mark unhandled" : "Mark handled"}
            </button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No messages.</p>}
      </ul>
    </div>
  );
}