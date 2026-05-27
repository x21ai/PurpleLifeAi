import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Admin users — Purple" }] }),
  component: AdminUsers,
});

type Row = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  suspended_at: string | null;
  community_opted_in: boolean;
};

function AdminUsers() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");

  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, created_at, suspended_at, community_opted_in")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as Row[]);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const name = `${r.first_name ?? ""} ${r.last_name ?? ""}`.toLowerCase();
    return name.includes(q.toLowerCase()) || r.id.includes(q);
  });

  const toggleSuspend = async (row: Row) => {
    await supabase
      .from("profiles")
      .update({ suspended_at: row.suspended_at ? null : new Date().toISOString() })
      .eq("id", row.id);
    await load();
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="font-serif text-4xl">Users</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or id"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm min-w-[240px]"
        />
      </div>
      {/* Mobile: card list. md+: table. */}
      <ul className="mt-6 space-y-3 md:hidden">
        {filtered.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-lg truncate">
                  {(r.first_name || r.last_name) ? `${r.first_name ?? ""} ${r.last_name ?? ""}` : "—"}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{r.id.slice(0, 8)}…</p>
              </div>
              <span className={r.suspended_at ? "text-destructive text-xs" : "text-foreground/70 text-xs"}>
                {r.suspended_at ? "Suspended" : "Active"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Joined {new Date(r.created_at).toLocaleDateString()}</span>
              <span>Community: {r.community_opted_in ? "Yes" : "—"}</span>
            </div>
            <button
              onClick={() => toggleSuspend(r)}
              className="mt-3 w-full rounded-full border border-border px-3 py-2 text-xs hover:bg-secondary"
            >
              {r.suspended_at ? "Unsuspend" : "Suspend"}
            </button>
          </li>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">No users.</p>}
      </ul>
      <div className="mt-6 hidden md:block overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Community</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{(r.first_name || r.last_name) ? `${r.first_name ?? ""} ${r.last_name ?? ""}` : "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.community_opted_in ? "Yes" : "—"}</td>
                <td className="px-4 py-3">
                  {r.suspended_at ? (
                    <span className="text-destructive">Suspended</span>
                  ) : (
                    <span className="text-foreground/70">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSuspend(r)}
                    className="text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary"
                  >
                    {r.suspended_at ? "Unsuspend" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}