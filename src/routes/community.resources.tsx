import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Purple Community" },
      { name: "description", content: "Curated resources for people living with epilepsy and their care partners." },
    ],
  }),
  component: Resources,
});

type R = { id: string; title: string; description: string; url: string; category: string };

function Resources() {
  const [rows, setRows] = React.useState<R[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from("community_resources").select("id, title, description, url, category").order("category").order("sort_order");
      setRows((data ?? []) as R[]);
    })();
  }, []);

  const grouped = rows.reduce<Record<string, R[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link to="/community" className="text-sm text-foreground/70 hover:text-foreground">← Community</Link>
          <Link to="/" className="font-serif text-xl">Purple</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-10 pb-24">
        <p className="label-eyebrow text-muted-foreground">Resources</p>
        <h1 className="mt-3 font-serif text-5xl">Trusted reading.</h1>
        <p className="mt-4 body-serif text-foreground/75">Curated and vetted by the Purple team.</p>
        <div className="mt-10 space-y-10">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="font-serif text-2xl capitalize">{cat}</h2>
              <ul className="mt-3 space-y-3">
                {items.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <a href={r.url} target="_blank" rel="noreferrer" className="font-serif text-lg hover:underline">
                      {r.title}
                    </a>
                    <p className="text-sm text-foreground/70 mt-1">{r.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {rows.length === 0 && <p className="text-muted-foreground">No resources yet.</p>}
        </div>
      </div>
    </div>
  );
}