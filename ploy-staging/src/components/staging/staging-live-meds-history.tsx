import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { MedicationOrbit } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { ensureStagingSession, stagingSignInRequiredMessage } from "@/lib/staging/session";
import { fetchDoseHistory, type DoseHistoryItem } from "@/lib/staging/meds-data";

/**
 * Medication dose history wired to production D1.
 */
export function StagingLiveMedsHistoryPage() {
  const [entries, setEntries] = useState<DoseHistoryItem[]>([]);
  const [loading, setLoading] = useState(isStagingLiveData());
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    if (!isStagingLiveData()) return;
    let cancelled = false;
    (async () => {
      const ok = await ensureStagingSession();
      if (cancelled) return;
      setSessionOk(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      try {
        const rows = await fetchDoseHistory(30);
        if (!cancelled) setEntries(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="today" landscape="detail">
        <DetailHeader title="Medication history" backHref="/meds" />
        <section className="px-5 pt-1 text-center">
          <MedicationOrbit className="mx-auto w-full max-w-[330px]" />
          <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
            Recorded doses
          </p>
          <h1 className="mt-2 text-[31px] font-semibold tracking-[-0.045em]">
            A clear timeline of what you entered.
          </h1>
          <p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">
            Review timing and notes without changing your medication plan.
          </p>
        </section>

        {isStagingLiveData() && (
          <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
            {loading
              ? "Loading medication history…"
              : sessionOk
                ? `Live history · ${entries.length} dose row${entries.length === 1 ? "" : "s"} (last 30 days).`
                : stagingSignInRequiredMessage()}
          </p>
        )}

        <section className="mt-7 px-5">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
            {loading && (
              <div className="px-6 py-10 text-center text-[14px] text-purplelife-muted">Loading history…</div>
            )}
            {!loading && entries.length === 0 && (
              <div className="px-6 py-10 text-center text-[14px] text-purplelife-muted">
                No dose history in the last 30 days.
              </div>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0"
              >
                <span
                  className={`grid size-11 place-items-center rounded-full ${
                    entry.status === "taken"
                      ? "bg-purplelife-mint/20 text-purplelife-mint"
                      : "bg-purplelife-rail text-purplelife-muted"
                  }`}
                >
                  <Check size={19} />
                </span>
                <span className="flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-purplelife-accent">
                    {entry.dayLabel}
                  </span>
                  <span className="mt-0.5 block text-[15px] font-semibold">{entry.medName}</span>
                  <span className="mt-0.5 block text-[12px] text-purplelife-muted">
                    {entry.timeLabel} · {entry.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-5 px-5">
          <p className="rounded-[22px] bg-purplelife-tint p-4 text-[13px] leading-[1.45] text-purplelife-muted">
            This history reflects the doses you recorded. Discuss medication changes with a qualified clinician.
          </p>
        </section>
      </PilotAppShell>
    </>
  );
}
