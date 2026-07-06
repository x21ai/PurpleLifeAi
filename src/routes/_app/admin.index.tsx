import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getNotificationReliabilityStats } from "@/lib/notification-delivery.functions";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Admin overview · Purple" }] }),
  component: AdminDashboard,
});

type ReliabilityStats = {
  days: number;
  scheduled: number;
  fired: number;
  firedWithin60s: number;
  acknowledged: number;
  ackRate: number | null;
};

function AdminDashboard() {
  const [stats, setStats] = React.useState<{ users: number; posts: number; reports: number; feedback: number; contact: number } | null>(null);
  const [reliability, setReliability] = React.useState<ReliabilityStats | null>(null);
  const fetchReliability = useServerFn(getNotificationReliabilityStats);

  React.useEffect(() => {
    void fetchReliability({ data: { days: 7 } })
      .then((r) => setReliability(r as ReliabilityStats))
      .catch(() => setReliability(null));
  }, [fetchReliability]);

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
      <h1 className="app-hero-title text-2xl">Overview</h1>
      <p className="mt-2 text-muted-foreground">Operational stats across the platform.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-serif text-4xl">{c.value ?? "–"}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-2xl">Med reminder reliability (7 days)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Target: 99% of doses notified within 60 seconds while the app is installed. Methodology in docs/RELIABILITY.md.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Doses scheduled</p>
          <p className="mt-3 font-serif text-4xl">{reliability?.scheduled ?? "–"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Notifications fired</p>
          <p className="mt-3 font-serif text-4xl">{reliability?.fired ?? "–"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Fired within 60s</p>
          <p className="mt-3 font-serif text-4xl">{reliability?.firedWithin60s ?? "–"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Acknowledgment rate</p>
          <p className="mt-3 font-serif text-4xl">
            {reliability?.ackRate != null ? `${Math.round(reliability.ackRate * 100)}%` : "–"}
          </p>
        </div>
      </div>
    </div>
  );
}