import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";

export const Route = createFileRoute("/_app/admin/resources")({
  head: () => ({ meta: [{ title: "Resources admin · Purple" }] }),
  component: AdminResources,
});

type R = { id: string; title: string; description: string; url: string; category: string; sort_order: number };

function AdminResources() {
  const [rows, setRows] = React.useState<R[]>([]);
  const [form, setForm] = React.useState({ title: "", description: "", url: "", category: "general" });

  const load = React.useCallback(async () => {
    const { data } = await supabase.from("community_resources").select("*").order("sort_order").order("created_at", { ascending: false });
    setRows((data ?? []) as R[]);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!form.title || !form.url) return;
    const { error } = await supabase.from("community_resources").insert(form);
    if (error) return toast.error(userMessage(error, "That didn't work. Try again in a moment."));
    setForm({ title: "", description: "", url: "", category: "general" });
    await load();
  };
  const remove = async (id: string) => {
    await supabase.from("community_resources").delete().eq("id", id);
    await load();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl">Resources</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 grid gap-3 sm:grid-cols-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-xl border border-border bg-background px-4 py-2" />
        <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL" className="rounded-xl border border-border bg-background px-4 py-2" />
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded-xl border border-border bg-background px-4 py-2" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="rounded-xl border border-border bg-background px-4 py-2" />
        <div className="sm:col-span-2">
          <button onClick={add} className="rounded-full bg-primary text-primary-foreground px-5 py-2">Add resource</button>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-lg">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline">{r.url}</a>
            </div>
            <button onClick={() => remove(r.id)} className="text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}