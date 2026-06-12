import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { userMessage } from "@/lib/user-message";
import {
  listSuspectedDuplicates,
  markDuplicate,
  excludeFromTrends,
  restoreReport,
  type DuplicateGroup,
} from "@/lib/admin-reports.functions";

export const Route = createFileRoute("/_app/admin/reports/duplicates")({
  head: () => ({ meta: [{ title: "Duplicate reports . Admin . Purple" }] }),
  component: AdminDuplicates,
});

function AdminDuplicates() {
  const list = useServerFn(listSuspectedDuplicates);
  const mark = useServerFn(markDuplicate);
  const exclude = useServerFn(excludeFromTrends);
  const restore = useServerFn(restoreReport);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "report-duplicates"],
    queryFn: () => list(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "report-duplicates"] });

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast.success(label);
      await refresh();
    } catch (err: unknown) {
      toast.error(userMessage(err, "Action failed"));
    }
  };

  const groups: DuplicateGroup[] = q.data?.groups ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Duplicate reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports grouped by user, date, and content hash. Keep one, mark the rest as duplicates,
          exclude a single report from trends, or restore. Nothing is deleted.
        </p>
      </div>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No suspected duplicate groups found.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Group
              key={g.key}
              g={g}
              onMark={(id, keeperId) =>
                run("Marked as duplicate", () => mark({ data: { id, keeperId } }))
              }
              onExclude={(id) => run("Excluded from trends", () => exclude({ data: { id } }))}
              onRestore={(id) => run("Restored", () => restore({ data: { id } }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Group({
  g,
  onMark,
  onExclude,
  onRestore,
}: {
  g: DuplicateGroup;
  onMark: (id: string, keeperId: string) => void;
  onExclude: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const sorted = [...g.reports].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const oldest = sorted[0];
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium">
            {g.owner_name ?? "Unknown user"} . {g.report_date ?? "no date"}
          </p>
          <p className="text-xs text-muted-foreground">
            {g.reports.length} reports . fingerprint {g.fingerprint.slice(0, 10)}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {sorted.map((r) => {
            const isKeeper = r.id === oldest.id;
            return (
              <div
                key={r.id}
                className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    <Link
                      to="/reports/$reportId"
                      params={{ reportId: r.id }}
                      className="hover:underline"
                    >
                      {r.title}
                    </Link>
                    {isKeeper && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-500">
                        keeper
                      </span>
                    )}
                    {r.duplicate_of && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-500">
                        marked dup
                      </span>
                    )}
                    {r.excluded_from_trends && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        excluded
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.report_type ?? "report"} . uploaded {new Date(r.created_at).toLocaleString()}{" "}
                    . identity {r.identity_status}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!isKeeper && !r.duplicate_of && (
                    <Button size="sm" variant="outline" onClick={() => onMark(r.id, oldest.id)}>
                      Mark dup of keeper
                    </Button>
                  )}
                  {!r.excluded_from_trends && (
                    <Button size="sm" variant="outline" onClick={() => onExclude(r.id)}>
                      Exclude from trends
                    </Button>
                  )}
                  {(r.excluded_from_trends || r.duplicate_of) && (
                    <Button size="sm" variant="ghost" onClick={() => onRestore(r.id)}>
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
