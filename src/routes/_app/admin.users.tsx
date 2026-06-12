import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminArchiveUser,
  adminRestoreUser,
  adminScheduleDelete,
  adminCancelDelete,
  adminResetPassword,
  adminResetMfa,
  adminListUserCare,
  adminGetUserEmail,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Admin users · Purple" }] }),
  component: AdminUsers,
});

type Row = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  suspended_at: string | null;
  community_opted_in: boolean;
  deleted_at?: string | null;
  purge_after?: string | null;
};

type Tab = "active" | "paused" | "archived" | "scheduled";

function AdminUsers() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("active");
  const [selected, setSelected] = React.useState<Row | null>(null);

  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, created_at, suspended_at, community_opted_in, deleted_at, purge_after",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as Row[]);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filteredByTab = rows.filter((r) => {
    if (tab === "archived") return !!r.deleted_at;
    if (tab === "scheduled") return !!r.purge_after && !r.deleted_at;
    if (tab === "paused") return !!r.suspended_at && !r.deleted_at;
    return !r.deleted_at && !r.suspended_at;
  });
  const filtered = filteredByTab.filter((r) => {
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
      <div className="mt-4 flex gap-2 flex-wrap">
        {(["active", "paused", "archived", "scheduled"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs rounded-full px-3 py-1.5 capitalize ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t === "scheduled" ? "Scheduled for deletion" : t}
          </button>
        ))}
      </div>
      {/* Mobile: card list. md+: table. */}
      <ul className="mt-6 space-y-3 md:hidden">
        {filtered.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-border bg-card p-4"
            onClick={() => setSelected(r)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-lg truncate">
                  {r.first_name || r.last_name ? `${r.first_name ?? ""} ${r.last_name ?? ""}` : "–"}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                  {r.id.slice(0, 8)}…
                </p>
              </div>
              <span
                className={
                  r.suspended_at ? "text-destructive text-xs" : "text-foreground/70 text-xs"
                }
              >
                {r.suspended_at ? "Suspended" : "Active"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Joined {new Date(r.created_at).toLocaleDateString()}</span>
              <span>Community: {r.community_opted_in ? "Yes" : "–"}</span>
            </div>
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
              <tr
                key={r.id}
                className="border-t border-border cursor-pointer hover:bg-secondary/40"
                onClick={() => setSelected(r)}
              >
                <td className="px-4 py-3">
                  {r.first_name || r.last_name ? `${r.first_name ?? ""} ${r.last_name ?? ""}` : "–"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {r.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">{r.community_opted_in ? "Yes" : "–"}</td>
                <td className="px-4 py-3">
                  {r.deleted_at ? (
                    <span className="text-destructive">Archived</span>
                  ) : r.purge_after ? (
                    <span className="text-destructive">Scheduled</span>
                  ) : r.suspended_at ? (
                    <span className="text-destructive">Suspended</span>
                  ) : (
                    <span className="text-foreground/70">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleSuspend(r);
                    }}
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
      {selected && (
        <UserDrawer
          user={selected}
          onClose={() => {
            setSelected(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function UserDrawer({ user, onClose }: { user: Row; onClose: () => void }) {
  const archive = useServerFn(adminArchiveUser);
  const restore = useServerFn(adminRestoreUser);
  const schedule = useServerFn(adminScheduleDelete);
  const cancel = useServerFn(adminCancelDelete);
  const resetPw = useServerFn(adminResetPassword);
  const resetMfa = useServerFn(adminResetMfa);
  const listCare = useServerFn(adminListUserCare);
  const getEmail = useServerFn(adminGetUserEmail);
  const [email, setEmail] = React.useState<string | null>(null);
  const [care, setCare] = React.useState<
    Array<{ id: string; invite_email: string; role: string; status: string }>
  >([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const [e, c] = await Promise.all([
          getEmail({ data: { user_id: user.id } }),
          listCare({ data: { user_id: user.id } }),
        ]);
        setEmail(e.email);
        setCare((c.relationships as typeof care) ?? []);
      } catch (err) {
        toast.error(String((err as Error).message));
      }
    })();
  }, [user.id]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">
              {user.first_name || user.last_name
                ? `${user.first_name ?? ""} ${user.last_name ?? ""}`
                : "User"}
            </h2>
            <p className="font-mono text-xs text-muted-foreground mt-1">{user.id}</p>
            {email && <p className="text-xs text-muted-foreground mt-1">{email}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground">
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {!user.deleted_at && (
            <button
              disabled={busy}
              onClick={() => run("User archived", () => archive({ data: { user_id: user.id } }))}
              className="w-full text-left rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary"
            >
              Archive user
            </button>
          )}
          {user.deleted_at && (
            <button
              disabled={busy}
              onClick={() => run("User restored", () => restore({ data: { user_id: user.id } }))}
              className="w-full text-left rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary"
            >
              Restore user
            </button>
          )}
          {!user.purge_after && (
            <button
              disabled={busy}
              onClick={() =>
                run("Deletion scheduled (30 days)", () =>
                  schedule({ data: { user_id: user.id, days: 30 } }),
                )
              }
              className="w-full text-left rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary"
            >
              Schedule deletion (30 days)
            </button>
          )}
          {user.purge_after && (
            <button
              disabled={busy}
              onClick={() =>
                run("Deletion cancelled", () => cancel({ data: { user_id: user.id } }))
              }
              className="w-full text-left rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary"
            >
              Cancel scheduled deletion (
              {user.purge_after ? new Date(user.purge_after).toLocaleDateString() : ""})
            </button>
          )}
          <button
            disabled={busy || !email}
            onClick={() =>
              run("Password reset email sent", () => resetPw({ data: { email: email! } }))
            }
            className="w-full text-left rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary disabled:opacity-50"
          >
            Send password reset
          </button>
          <button
            disabled={busy}
            onClick={() =>
              run("2FA factors removed", () => resetMfa({ data: { user_id: user.id } }))
            }
            className="w-full text-left rounded-xl border border-border px-4 py-3 text-sm hover:bg-secondary"
          >
            Reset 2FA
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
            Caregivers & invites
          </h3>
          <ul className="mt-3 space-y-2">
            {care.map((c) => (
              <li key={c.id} className="rounded-xl border border-border p-3 text-sm">
                <p>{c.invite_email}</p>
                <p className="text-xs text-muted-foreground">
                  {c.role} · {c.status}
                </p>
              </li>
            ))}
            {care.length === 0 && (
              <p className="text-sm text-muted-foreground">No care relationships.</p>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
