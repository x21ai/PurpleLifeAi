import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Download, Mail, Share2, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    snapshot: true, meds: true, seizures: true, biometrics: true,
    labs: true, journal: true, extras: true, appendix: false,
  });

  const queryClient = useQueryClient();
  const generate = useServerFn(generateMedicalHistoryReport);
  const list = useServerFn(listMedicalHistoryReports);
  const sign = useServerFn(getMedicalReportSignedUrl);
  const del = useServerFn(deleteMedicalHistoryReport);
  const email = useServerFn(emailMedicalReport);
  const share = useServerFn(shareMedicalReportInThread);
  const threadsFn = useServerFn(listCareThreads);

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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
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
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date range</Label>
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
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs">To</Label>
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
          {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
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
                if (!confirm("Delete this report?")) return;
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
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReportRow({
  report, threads, onDownload, onDelete, onEmail, onShareThread,
}: {
  report: { id: string; window_from: string; window_to: string; created_at: string };
  threads: Array<{ id: string; title?: string | null }>;
  onDownload: () => void;
  onDelete: () => void;
  onEmail: (email: string, message: string, self: boolean) => Promise<void>;
  onShareThread: (threadId: string, message: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"none" | "email" | "thread">("none");
  const [providerEmail, setProviderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState("");

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
          <Button size="sm" variant="ghost" onClick={onDownload}><Download className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(mode === "email" ? "none" : "email")}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(mode === "thread" ? "none" : "thread")}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
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
            <Button size="sm" variant="outline" onClick={() => onEmail(providerEmail || "self@me", "", true)}>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
              >
                <option value="">Choose a chat…</option>
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>{t.title || "Care chat"}</option>
                ))}
              </select>
              <Textarea
                placeholder="Optional message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
              <Button size="sm" disabled={!threadId} onClick={() => onShareThread(threadId, message)}>
                Share in chat
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}