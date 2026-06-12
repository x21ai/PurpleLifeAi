import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Download, Mail, Share2, Trash2, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  generateMedicalHistoryReport,
  listMedicalHistoryReports,
  getMedicalReportSignedUrl,
  deleteMedicalHistoryReport,
  emailMedicalReport,
  shareMedicalReportInThread,
} from "@/lib/medical-report.functions";
import { listCareThreads } from "@/lib/care-chat.functions";
import {
  createMedicalReportShareLink,
  listMedicalReportShareLinks,
  revokeMedicalReportShareLink,
} from "@/lib/medical-report-share.functions";
import {
  listMedicalReportSchedules,
  upsertMedicalReportSchedule,
  deleteMedicalReportSchedule,
} from "@/lib/medical-report-schedules.functions";
import { ProGate } from "@/components/pro/pro-gate";
import { userMessage } from "@/lib/user-message";

export const Route = createFileRoute("/_app/reports/medical-history")({
  component: MedicalHistoryPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
});

const PRESETS: Array<{ label: string; days: number }> = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
];

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function MedicalHistoryPage() {
  const today = new Date();
  const [days, setDays] = useState(90);
  const [from, setFrom] = useState(() => ymd(new Date(today.getTime() - 90 * 86400000)));
  const [to, setTo] = useState(() => ymd(today));
  const [sections, setSections] = useState({
    snapshot: true,
    meds: true,
    seizures: true,
    biometrics: true,
    labs: true,
    journal: true,
    extras: true,
    appendix: false,
  });

  const queryClient = useQueryClient();
  const generate = useServerFn(generateMedicalHistoryReport);
  const list = useServerFn(listMedicalHistoryReports);
  const sign = useServerFn(getMedicalReportSignedUrl);
  const del = useServerFn(deleteMedicalHistoryReport);
  const email = useServerFn(emailMedicalReport);
  const share = useServerFn(shareMedicalReportInThread);
  const threadsFn = useServerFn(listCareThreads);
  const createLink = useServerFn(createMedicalReportShareLink);
  const listSch = useServerFn(listMedicalReportSchedules);
  const upsertSch = useServerFn(upsertMedicalReportSchedule);
  const delSch = useServerFn(deleteMedicalReportSchedule);

  const schedules = useQuery({
    queryKey: ["medical-history", "schedules"],
    queryFn: () => listSch(),
  });
  const [schActive, setSchActive] = useState(false);
  const [schDay, setSchDay] = useState(1);
  const [schWindow, setSchWindow] = useState(30);
  const [schRecipients, setSchRecipients] = useState("");
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(false);
  const existing = schedules.data?.schedules?.[0];
  const saveSchedule = useMutation({
    mutationFn: () =>
      upsertSch({
        data: {
          id: existing?.id,
          active: schActive,
          day_of_month: schDay,
          window_days: schWindow,
          recipients: schRecipients
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter((s) => /\S+@\S+\.\S+/.test(s))
            .map((email) => ({ email })),
        },
      }),
    onSuccess: () => {
      toast.success("Schedule saved");
      queryClient.invalidateQueries({ queryKey: ["medical-history", "schedules"] });
    },
    onError: (e) => toast.error(userMessage(e, "That didn't work. Try again in a moment.")),
  });

  // Hydrate the form once when the schedule loads
  const [hydrated, setHydrated] = useState(false);
  if (!hydrated && existing) {
    setHydrated(true);
    setSchActive(existing.active);
    setSchDay(existing.day_of_month);
    setSchWindow(existing.window_days);
    setSchRecipients(
      ((existing.recipients ?? []) as Array<{ email: string }>).map((r) => r.email).join(", "),
    );
  }

  const reports = useQuery({
    queryKey: ["medical-history", "list"],
    queryFn: () => list(),
  });
  const threadsQ = useQuery({
    queryKey: ["care-chat", "threads"],
    queryFn: () => threadsFn(),
  });

  const gen = useMutation({
    mutationFn: () => generate({ data: { from, to, sections } }),
    onSuccess: (r) => {
      toast.success("Report generated");
      window.open(r.url, "_blank");
      queryClient.invalidateQueries({ queryKey: ["medical-history", "list"] });
    },
    onError: (e) => toast.error(userMessage(e, "That didn't work. Try again in a moment.")),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <header>
        <h1 className="font-serif text-2xl text-foreground">Medical history report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A consolidated PDF you can download, email yourself, or share with a clinician.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-card/60 p-5 space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Date range
          </Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESETS.map((p) => (
              <Button
                key={p.days}
                size="sm"
                variant={days === p.days ? "default" : "outline"}
                onClick={() => {
                  setDays(p.days);
                  setFrom(ymd(new Date(Date.now() - p.days * 86400000)));
                  setTo(ymd(new Date()));
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <Label htmlFor="from" className="text-xs">
                From
              </Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs">
                To
              </Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sections</Label>
          <div className="grid grid-cols-2 gap-y-2 mt-2 text-sm">
            {(Object.keys(sections) as Array<keyof typeof sections>).map((k) => (
              <label key={k} className="flex items-center gap-2 capitalize">
                <Switch
                  checked={sections[k]}
                  onCheckedChange={(v) => setSections((s) => ({ ...s, [k]: v }))}
                />
                {k}
              </label>
            ))}
          </div>
        </div>

        <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="w-full">
          {gen.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Generate PDF
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg">Your reports</h2>
        {reports.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {reports.data?.reports?.length === 0 && (
          <p className="text-sm text-muted-foreground">No reports yet. Generate one above.</p>
        )}
        <ul className="space-y-3">
          {(reports.data?.reports ?? []).map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              threads={threadsQ.data?.threads ?? []}
              onDownload={async () => {
                const { url } = await sign({ data: { reportId: r.id } });
                window.open(url, "_blank");
              }}
              onDelete={async () => {
                await del({ data: { reportId: r.id } });
                queryClient.invalidateQueries({ queryKey: ["medical-history", "list"] });
                toast("Deleted");
              }}
              onEmail={async (recipientEmail, message, self) => {
                await email({ data: { reportId: r.id, recipientEmail, message, self } });
                toast.success(self ? "Sent to your inbox" : "Sent to provider");
              }}
              onShareThread={async (threadId, message) => {
                await share({ data: { reportId: r.id, threadId, message } });
                toast.success("Shared in chat");
              }}
              onCreateLink={async (days, viewerLabel) => {
                const res = await createLink({
                  data: { reportId: r.id, expiresInDays: days, viewerLabel },
                });
                const url = `${window.location.origin}/share/report/${res.link.token}`;
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  /* ignore */
                }
                toast.success("Share link copied to clipboard");
                return url;
              }}
            />
          ))}
        </ul>
      </section>

      <ProGate feature="report_sharing">
        <section className="rounded-2xl border border-white/10 bg-card/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg">Monthly auto-report</h2>
              <p className="text-xs text-muted-foreground">
                Generate and email a fresh PDF on the same day every month.
              </p>
            </div>
            <Switch checked={schActive} onCheckedChange={setSchActive} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Day of month</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={schDay}
                onChange={(e) => setSchDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <div>
              <Label className="text-xs">Window</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm [&>option]:bg-popover [&>option]:text-popover-foreground text-foreground"
                value={schWindow}
                onChange={(e) => setSchWindow(Number(e.target.value))}
              >
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Recipients (comma-separated emails)</Label>
            <Textarea
              rows={2}
              value={schRecipients}
              placeholder={"dr.smith@clinic.org, you@example.com" /* live-data-guard:allow */}
              onChange={(e) => setSchRecipients(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => saveSchedule.mutate()}
              disabled={saveSchedule.isPending}
            >
              {existing ? "Update schedule" : "Save schedule"}
            </Button>
            {existing && (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteSchedule(true)}>
                Delete
              </Button>
            )}
          </div>
          {existing?.last_run_at && (
            <p className="text-xs text-muted-foreground">
              Last sent {new Date(existing.last_run_at).toLocaleString()}
              {existing.last_error ? `, error: ${existing.last_error}` : ""}
            </p>
          )}
        </section>
      </ProGate>

      <AlertDialog open={confirmDeleteSchedule} onOpenChange={setConfirmDeleteSchedule}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete monthly schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              Auto-generated reports will stop. You can set up a new schedule any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!existing) return;
                await delSch({ data: { id: existing.id } });
                setHydrated(false);
                setSchActive(false);
                setSchRecipients("");
                queryClient.invalidateQueries({ queryKey: ["medical-history", "schedules"] });
                setConfirmDeleteSchedule(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReportRow({
  report,
  threads,
  onDownload,
  onDelete,
  onEmail,
  onShareThread,
  onCreateLink,
}: {
  report: { id: string; window_from: string; window_to: string; created_at: string };
  threads: Array<{ id: string; title?: string | null }>;
  onDownload: () => void;
  onDelete: () => void;
  onEmail: (email: string, message: string, self: boolean) => Promise<void>;
  onShareThread: (threadId: string, message: string) => Promise<void>;
  onCreateLink: (days: number, viewerLabel?: string) => Promise<string>;
}) {
  const [mode, setMode] = useState<"none" | "email" | "thread" | "link">("none");
  const [providerEmail, setProviderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState("");
  const [linkDays, setLinkDays] = useState(7);
  const [linkLabel, setLinkLabel] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const listLinks = useServerFn(listMedicalReportShareLinks);
  const revokeLink = useServerFn(revokeMedicalReportShareLink);
  const linksQ = useQuery({
    queryKey: ["medical-history", "share-links", report.id],
    queryFn: () => listLinks({ data: { reportId: report.id } }),
    enabled: mode === "link",
  });

  return (
    <li className="rounded-xl border border-white/10 bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">
            {report.window_from} → {report.window_to}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode(mode === "email" ? "none" : "email")}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode(mode === "thread" ? "none" : "thread")}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode(mode === "link" ? "none" : "link")}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mode === "email" && (
        <div className="mt-3 space-y-2">
          <Input
            placeholder="Provider email (or leave blank for yourself)"
            value={providerEmail}
            onChange={(e) => setProviderEmail(e.target.value)}
          />
          <Textarea
            placeholder="Optional message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEmail(providerEmail || "self@me", "", true)}
            >
              Email to me
            </Button>
            <Button
              size="sm"
              disabled={!providerEmail}
              onClick={() => onEmail(providerEmail, message, false)}
            >
              Send to provider
            </Button>
          </div>
        </div>
      )}

      {mode === "thread" && (
        <div className="mt-3 space-y-2">
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No care chats yet.</p>
          ) : (
            <>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm [&>option]:bg-popover [&>option]:text-popover-foreground text-foreground"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
              >
                <option value="">Choose a chat…</option>
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title || "Care chat"}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder="Optional message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
              <Button
                size="sm"
                disabled={!threadId}
                onClick={() => onShareThread(threadId, message)}
              >
                Share in chat
              </Button>
            </>
          )}
        </div>
      )}

      {mode === "link" && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Anyone with the link can view the PDF until it expires. No sign-in needed.
          </p>
          <div className="flex gap-2">
            {[1, 7, 30].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={linkDays === d ? "default" : "outline"}
                onClick={() => setLinkDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
          <Input
            placeholder="Viewer label (e.g. Dr. Smith)"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
          />
          <Button
            size="sm"
            onClick={async () => {
              const url = await onCreateLink(linkDays, linkLabel || undefined);
              setCreatedUrl(url);
              linksQ.refetch();
            }}
          >
            Create share link
          </Button>
          {createdUrl && (
            <p className="text-xs break-all rounded-md bg-accent/40 p-2 text-foreground">
              {createdUrl}
            </p>
          )}
          {linksQ.data && linksQ.data.links.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Active links</p>
              <ul className="space-y-1.5">
                {linksQ.data.links.map((l) => {
                  const expired = new Date(l.expires_at) < new Date();
                  const revoked = !!l.revoked_at;
                  const active = !expired && !revoked;
                  return (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">
                          {l.viewer_label || "Untitled link"}
                        </p>
                        <p className="text-muted-foreground">
                          {revoked
                            ? "Revoked"
                            : expired
                              ? "Expired"
                              : `Expires ${new Date(l.expires_at).toLocaleDateString()}`}
                          {" · "}
                          {l.opened_count > 0
                            ? `Viewed ${l.opened_count}× · last ${l.last_opened_at ? new Date(l.last_opened_at).toLocaleDateString() : ","}`
                            : "Not viewed yet"}
                        </p>
                      </div>
                      {active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await revokeLink({ data: { linkId: l.id } });
                            toast("Link revoked");
                            linksQ.refetch();
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              The PDF will be permanently removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onDelete();
                setConfirmDelete(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
