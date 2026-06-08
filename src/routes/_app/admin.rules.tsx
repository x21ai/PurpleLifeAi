import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listPlatformRules,
  upsertPlatformRule,
  deletePlatformRule,
  KNOWN_RULE_KEYS,
} from "@/lib/platform-rules.functions";

export const Route = createFileRoute("/_app/admin/rules")({
  head: () => ({ meta: [{ title: "Platform rules · Admin · Purple" }] }),
  component: PlatformRulesPage,
});

type RuleRow = {
  id: string;
  scope: string;
  scope_value: string | null;
  key: string;
  value: unknown;
  enabled: boolean;
  description: string | null;
  updated_at: string;
};

type AuditRow = {
  id: string;
  rule_id: string | null;
  scope: string | null;
  scope_value: string | null;
  key: string;
  actor_id: string | null;
  action: string;
  before: unknown;
  after: unknown;
  at: string;
};

function PlatformRulesPage() {
  const fetchRules = useServerFn(listPlatformRules);
  const upsert = useServerFn(upsertPlatformRule);
  const remove = useServerFn(deletePlatformRule);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["platform-rules"],
    queryFn: () => fetchRules({}),
  });

  const upsertMut = useMutation({
    mutationFn: (input: any) => upsert({ data: input }),
    onSuccess: () => {
      toast.success("Rule saved");
      void refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Rule deleted");
      void refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const rules = (data?.rules ?? []) as RuleRow[];
  const audit = (data?.audit ?? []) as AuditRow[];

  // Synthesize placeholder rows for any KNOWN_RULE_KEYS that don't yet exist.
  const existingKeys = new Set(
    rules.filter((r) => r.scope === "platform").map((r) => r.key),
  );
  const placeholders = KNOWN_RULE_KEYS.filter((k) => !existingKeys.has(k.key)).map(
    (k) => ({
      id: `placeholder:${k.key}`,
      scope: "platform",
      scope_value: null,
      key: k.key,
      value: k.defaultValue,
      enabled: false,
      description: k.description,
      updated_at: "",
      _placeholder: true,
    }),
  );
  const platformRules = [
    ...rules.filter((r) => r.scope === "platform"),
    ...placeholders,
  ];
  const roleRules = rules.filter((r) => r.scope === "role");
  const userRules = rules.filter((r) => r.scope === "user");

  return (
    <div>
      <h1 className="font-serif text-4xl">Platform rules</h1>
      <p className="mt-2 text-muted-foreground">
        Toggle global rules and per-role / per-user overrides. Every change is audit-logged.
      </p>

      {isLoading ? (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <RuleSection
            title="Platform-wide"
            description="Applies to every user unless overridden by a role or user-specific rule."
            rules={platformRules}
            scope="platform"
            onSave={(v) => upsertMut.mutate(v)}
            onDelete={(id) => deleteMut.mutate(id)}
          />
          <RuleSection
            title="By role"
            description="Overrides the platform-wide rule for users in the given role."
            rules={roleRules}
            scope="role"
            onSave={(v) => upsertMut.mutate(v)}
            onDelete={(id) => deleteMut.mutate(id)}
          />
          <RuleSection
            title="By user"
            description="Overrides for a specific user id."
            rules={userRules}
            scope="user"
            onSave={(v) => upsertMut.mutate(v)}
            onDelete={(id) => deleteMut.mutate(id)}
          />

          <section>
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <History className="h-5 w-5" /> Recent changes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Latest 50 audit entries.</p>
            <ul className="mt-4 rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {audit.length === 0 && (
                <li className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No changes yet.
                </li>
              )}
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium uppercase text-xs text-muted-foreground mr-2">
                      {a.action}
                    </span>
                    <span className="font-mono">{a.key}</span>
                    {a.scope_value ? (
                      <span className="text-muted-foreground"> · {a.scope}:{a.scope_value}</span>
                    ) : (
                      <span className="text-muted-foreground"> · {a.scope}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function RuleSection({
  title,
  description,
  rules,
  scope,
  onSave,
  onDelete,
}: {
  title: string;
  description: string;
  rules: Array<RuleRow & { _placeholder?: boolean }>;
  scope: "platform" | "role" | "user";
  onSave: (v: {
    id?: string;
    scope: "platform" | "role" | "user";
    scope_value?: string | null;
    key: string;
    value: unknown;
    enabled?: boolean;
    description?: string | null;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  return (
    <section>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding((s) => !s)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add rule
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {adding && (
          <RuleEditor
            scope={scope}
            initial={{ key: "", value: "", enabled: true, description: "", scope_value: "" }}
            onCancel={() => setAdding(false)}
            onSave={(v) => {
              onSave({ ...v, scope });
              setAdding(false);
            }}
          />
        )}
        {rules.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No rules in this scope.</p>
        )}
        {rules.map((r) => (
          <RuleEditor
            key={r.id}
            scope={scope}
            initial={{
              id: r._placeholder ? undefined : r.id,
              key: r.key,
              value: r.value,
              enabled: r.enabled,
              description: r.description ?? "",
              scope_value: r.scope_value ?? "",
            }}
            placeholder={r._placeholder}
            onSave={(v) => onSave({ ...v, scope })}
            onDelete={r._placeholder ? undefined : () => onDelete(r.id)}
          />
        ))}
      </div>
    </section>
  );
}

function RuleEditor({
  scope,
  initial,
  placeholder,
  onSave,
  onCancel,
  onDelete,
}: {
  scope: "platform" | "role" | "user";
  initial: {
    id?: string;
    key: string;
    value: unknown;
    enabled: boolean;
    description: string;
    scope_value: string;
  };
  placeholder?: boolean;
  onSave: (v: {
    id?: string;
    scope_value?: string | null;
    key: string;
    value: unknown;
    enabled?: boolean;
    description?: string | null;
  }) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const [key, setKey] = React.useState(initial.key);
  const [scopeValue, setScopeValue] = React.useState(initial.scope_value);
  const [enabled, setEnabled] = React.useState(initial.enabled);
  const [description, setDescription] = React.useState(initial.description);
  const initialJson = React.useMemo(
    () => JSON.stringify(initial.value ?? null, null, 2),
    [initial.value],
  );
  const [valueText, setValueText] = React.useState(initialJson);
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const isKnown = KNOWN_RULE_KEYS.some((k) => k.key === key);
  const knownMeta = KNOWN_RULE_KEYS.find((k) => k.key === key);

  const handleSave = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(valueText);
    } catch {
      setJsonError("Value must be valid JSON (e.g. true, 60, \"text\").");
      return;
    }
    setJsonError(null);
    onSave({
      id: initial.id,
      key: key.trim(),
      value: parsed,
      enabled,
      description: description.trim() || null,
      scope_value: scope === "platform" ? null : scopeValue.trim() || null,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Key</label>
          {isKnown && !initial.id && !placeholder ? (
            <p className="mt-1 font-mono text-sm text-foreground">{key}</p>
          ) : KNOWN_RULE_KEYS.length > 0 && !initial.id ? (
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick a known key or type below" />
              </SelectTrigger>
              <SelectContent>
                {KNOWN_RULE_KEYS.map((k) => (
                  <SelectItem key={k.key} value={k.key}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1 font-mono text-sm text-foreground">{key}</p>
          )}
          {!initial.id && (
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="custom_rule_key"
              className="mt-2 font-mono text-sm"
            />
          )}
          {knownMeta && (
            <p className="mt-1 text-xs text-muted-foreground">{knownMeta.description}</p>
          )}
        </div>
        <div>
          {scope !== "platform" && (
            <>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                {scope === "role" ? "Role" : "User id"}
              </label>
              {scope === "role" ? (
                <Select value={scopeValue} onValueChange={setScopeValue}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pick a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">super_admin</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  placeholder="user uuid"
                  className="mt-1 font-mono text-xs"
                />
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Value (JSON)
        </label>
        <Textarea
          value={valueText}
          onChange={(e) => setValueText(e.target.value)}
          rows={3}
          className="mt-1 font-mono text-sm"
        />
        {jsonError && <p className="mt-1 text-xs text-destructive">{jsonError}</p>}
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Description
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note for other admins"
          className="mt-1"
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          {enabled ? "Enabled" : "Disabled"}
        </label>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" /> {placeholder ? "Create" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}