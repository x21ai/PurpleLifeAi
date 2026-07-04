import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { generateMedicalHistoryReport } from "@/lib/medical-report.functions";
import { userMessage } from "@/lib/user-message";

const ALL_SECTIONS = {
  snapshot: true,
  meds: true,
  seizures: true,
  biometrics: true,
  labs: true,
  journal: true,
  extras: true,
  appendix: false,
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function QuickClinicianPdf() {
  const generate = useServerFn(generateMedicalHistoryReport);
  const [pending, setPending] = useState<30 | 90 | null>(null);
  const gen = useMutation({
    mutationFn: (days: 30 | 90) =>
      generate({
        data: {
          from: ymd(new Date(Date.now() - days * 86400000)),
          to: ymd(new Date()),
          sections: ALL_SECTIONS,
        },
      }),
    onMutate: (days) => setPending(days),
    onSuccess: (r) => {
      toast.success("Report ready");
      window.open(r.url, "_blank");
    },
    onError: (e) => toast.error(userMessage(e, "That didn't work. Try again in a moment.")),
    onSettled: () => setPending(null),
  });

  return (
    <section className="mt-6 glass-card rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-muted-foreground">Clinician PDF</p>
          <p className="mt-1 font-serif text-lg text-foreground">
            One-tap summary for your next visit
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Includes meds, seizures, biometrics, labs and journal highlights.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => gen.mutate(30)}
              disabled={!!pending}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-60"
            >
              {pending === 30 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              Last 30 days
            </button>
            <button
              onClick={() => gen.mutate(90)}
              disabled={!!pending}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-60"
            >
              {pending === 90 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              Last 90 days
            </button>
            <Link
              to="/reports/medical-history"
              className="inline-flex items-center text-xs text-muted-foreground underline underline-offset-2 hover:no-underline px-2 py-1.5"
            >
              Custom range, schedule & sharing →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}