import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin/community")({
  head: () => ({ meta: [{ title: "Community moderation · Purple" }] }),
  component: AdminCommunityMod,
});

type Report = {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  resolved: boolean;
  created_at: string;
};

function AdminCommunityMod() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("community_reports")
      .select("id, reporter_id, post_id, comment_id, reason, resolved, created_at")
      .order("created_at", { ascending: false });
    setReports((data ?? []) as Report[]);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const resolve = async (r: Report) => {
    await supabase.from("community_reports").update({ resolved: !r.resolved }).eq("id", r.id);
    await load();
  };

  const hidePost = async (postId: string | null) => {
    if (!postId) return;
    await supabase.from("community_posts").update({ hidden: true }).eq("id", postId);
    await load();
  };

  return (
    <div>
      <h1 className="app-hero-title text-2xl">Community moderation</h1>
      <ul className="mt-6 space-y-3">
        {reports.map((r) => (
          <li key={r.id} className={`rounded-2xl border border-border bg-card p-5 ${r.resolved ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{r.post_id ? "Post" : "Comment"} · reporter {r.reporter_id.slice(0,8)}…</span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm">{r.reason}</p>
            <div className="mt-3 flex gap-2">
              {r.post_id && (
                <button onClick={() => hidePost(r.post_id)} className="text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary">
                  Hide post
                </button>
              )}
              <button onClick={() => resolve(r)} className="text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary">
                {r.resolved ? "Reopen" : "Mark resolved"}
              </button>
            </div>
          </li>
        ))}
        {reports.length === 0 && <p className="text-muted-foreground">No open reports.</p>}
      </ul>
    </div>
  );
}