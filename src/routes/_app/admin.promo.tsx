import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/promo")({
  head: () => ({ meta: [{ title: "Promo codes · Purple" }] }),
  component: AdminPromo,
});

type Code = {
  id: string;
  code: string;
  label: string | null;
  kind: "invite" | "discount" | "share";
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

function rand(n = 8) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
}

function AdminPromo() {
  const [rows, setRows] = React.useState<Code[]>([]);
  const [code, setCode] = React.useState(rand());
  const [label, setLabel] = React.useState("");
  const [kind, setKind] = React.useState<Code["kind"]>("invite");
  const [maxUses, setMaxUses] = React.useState<string>("");

  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("promo_codes")
      .select("id, code, label, kind, max_uses, used_count, expires_at, active, created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Code[]);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!code.trim()) return;
    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      label: label.trim() || null,
      kind,
      max_uses: maxUses ? Number(maxUses) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Code created");
    setCode(rand());
    setLabel("");
    setMaxUses("");
    void load();
  };

  const toggleActive = async (row: Code) => {
    await supabase.from("promo_codes").update({ active: !row.active }).eq("id", row.id);
    void load();
  };

  const remove = async (row: Code) => {
    if (!confirm(`Delete code ${row.code}?`)) return;
    await supabase.from("promo_codes").delete().eq("id", row.id);
    void load();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl">Promo codes</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create invite, discount, or share codes. Codes are uppercased and unique.
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 grid gap-3 md:grid-cols-5">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CODE"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-mono uppercase"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm md:col-span-2"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Code["kind"])}
          className="rounded-full border border-border bg-background text-foreground px-4 py-2 text-sm [&>option]:bg-popover [&>option]:text-popover-foreground"
        >
          <option value="invite">Invite</option>
          <option value="discount">Discount</option>
          <option value="share">Share</option>
        </select>
        <input
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ""))}
          placeholder="Max uses"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
        />
        <button
          onClick={create}
          className="md:col-span-5 rounded-full bg-primary text-primary-foreground py-2 text-sm font-medium"
        >
          Create code
        </button>
      </div>

      <ul className="mt-6 space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-mono font-medium">{r.code}</p>
              <p className="text-xs text-muted-foreground">
                {r.kind} · {r.used_count}{r.max_uses ? `/${r.max_uses}` : ""} used
                {r.label ? ` · ${r.label}` : ""}
                {r.expires_at ? ` · expires ${new Date(r.expires_at).toLocaleDateString()}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(r)}
                className="text-xs rounded-full border border-border px-3 py-1 hover:bg-secondary"
              >
                {r.active ? "Disable" : "Enable"}
              </button>
              <button
                onClick={() => remove(r)}
                className="text-xs rounded-full border border-border px-3 py-1 text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No codes yet.</p>}
      </ul>
    </div>
  );
}