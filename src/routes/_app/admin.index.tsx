import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = React.useState<{ users: number; posts: number; reports: number; feedback: number; contact: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      const [u, p, r, f, c] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("community_posts").select("id", { count: "exact", head: true }),
        supabase.from("community_reports").select("id", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("feedback").select("id", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
      ]);
      setStats({
        users: u.count ?? 0,
        posts: p.count ?? 0,
        reports: r.count ?? 0,
        feedback: f.count ?? 0,
        contact: c.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Users", value: stats?.users },
    { label: "Community posts", value: stats?.posts },
    { label: "Open reports", value: stats?.reports },
    { label: "Open feedback", value: stats?.feedback },
    { label: "New contact", value: stats?.contact },
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl">Overview</h1>
      <p className="mt-2 text-muted-foreground">Operational stats across the platform.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-serif text-4xl">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}