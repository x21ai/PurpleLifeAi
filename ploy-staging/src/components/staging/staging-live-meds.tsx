import { useEffect, useState } from "react";
import { Check, ChevronRight, Clock3, History, LockKeyhole, Pill, Plus } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { MedicationOrbit } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { ensureStagingSession, stagingSignInRequiredMessage } from "@/lib/staging/session";
import {
  fetchMedsWithTodayDoses,
  formatMedSchedule,
  markDoseTaken,
  type DoseRow,
  type MedicationRow,
} from "@/lib/staging/meds-data";

function formatDoseTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

/**
 * Medication schedule wired to production D1 via staging /api proxy.
 */
export function StagingLiveMedsPage() {
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [doses, setDoses] = useState<DoseRow[]>([]);
  const [loading, setLoading] = useState(isStagingLiveData());
  const [sessionOk, setSessionOk] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  async function reload() {
    const data = await fetchMedsWithTodayDoses();
    setMedications(data.medications);
    setDoses(data.doses);
  }

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
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMarkTaken(doseId: string) {
    setRecordingId(doseId);
    const { ok } = await markDoseTaken(doseId);
    if (ok) await reload();
    setRecordingId(null);
  }

  const takenCount = doses.filter((d) => d.status === "taken").length;
  const hasMeds = medications.length > 0;
  const hasDoses = doses.length > 0;

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="browse" landscape="insight">
        <DetailHeader
          title="Medication"
          backHref="/my-health"
          action={
            <a
              href="/capture"
              aria-label="Add medication"
              className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"
            >
              <Plus size={20} />
            </a>
          }
        />
        <section className="px-5 pt-1 text-center">
          <MedicationOrbit className="mx-auto w-full max-w-[340px]" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
            Your schedule
          </p>
          <h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">
            Record what you took, without changing the plan.
          </h1>
          <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">
            PurpleLife can help you remember and review. Medication decisions belong with you and a
            qualified clinician.
          </p>
        </section>

        <PilotLandscapeStack>
          {isStagingLiveData() && (
            <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
              {loading
                ? "Loading your medications…"
                : sessionOk
                  ? `Live meds · ${medications.length} active · ${doses.length} dose${doses.length === 1 ? "" : "s"} today (${takenCount} taken).`
                  : stagingSignInRequiredMessage()}
            </p>
          )}
          <section className="mt-7 px-5">
            {loading && (
              <div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line text-[14px] text-purplelife-muted">
                Loading medications…
              </div>
            )}
            {!loading && !hasMeds && (
              <div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line">
                <Pill size={27} className="mx-auto text-purplelife-accent" />
                <p className="mt-3 text-[15px] font-semibold">No active medications</p>
                <p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-[1.45] text-purplelife-muted">
                  Add a medication to begin tracking your schedule.
                </p>
              </div>
            )}
            {!loading && hasMeds && (
              <div className="space-y-3">
                {medications.map((med) => {
                  const medDoses = doses.filter((d) => d.medication_id === med.id);
                  return (
                    <div
                      key={med.id}
                      className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"
                    >
                      <div className="flex items-center gap-4">
                        <span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-mint/20 text-purplelife-mint">
                          <Pill size={20} />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[14px] font-semibold">{med.name}</span>
                          <span className="mt-1 block text-[12px] text-purplelife-muted">
                            {formatMedSchedule(med)}
                          </span>
                        </span>
                      </div>
                      {medDoses.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {medDoses.map((dose) => (
                            <div
                              key={dose.id}
                              className="flex items-center gap-3 rounded-[16px] bg-purplelife-rail/60 px-3 py-2.5"
                            >
                              <Clock3 size={16} className="text-purplelife-muted" />
                              <span className="flex-1 text-[13px] font-medium">
                                {formatDoseTime(dose.scheduled_at)}
                                {dose.amount != null && dose.unit
                                  ? ` · ${dose.amount} ${dose.unit}`
                                  : ""}
                              </span>
                              {dose.status === "taken" ? (
                                <span className="flex items-center gap-1 text-[12px] font-semibold text-purplelife-mint">
                                  <Check size={14} /> Taken
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={recordingId === dose.id}
                                  onClick={() => handleMarkTaken(dose.id)}
                                  className="rounded-full bg-purplelife-accent px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                                >
                                  {recordingId === dose.id ? "Saving…" : "Mark taken"}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-[12px] text-purplelife-muted">No doses scheduled today.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && hasMeds && !hasDoses && (
              <p className="mt-3 text-center text-[12px] text-purplelife-muted">
                Medications loaded; no dose rows for today yet.
              </p>
            )}
          </section>
          <section className="mt-5 px-5">
            <div className="overflow-hidden rounded-[24px] bg-purplelife-tint">
              <a href="/meds/history" className="flex items-center gap-3 border-b border-purplelife-accent/10 p-4">
                <History size={19} className="text-purplelife-accent" />
                <span className="flex-1 text-[13px] font-semibold">Review medication history</span>
                <ChevronRight size={18} />
              </a>
              <p className="flex gap-3 p-4 text-[12px] leading-[1.5] text-purplelife-muted">
                <LockKeyhole size={18} className="shrink-0 text-purplelife-accent" />
                Dose check-offs are saved securely to your medication history.
              </p>
            </div>
          </section>
          <PilotContextPanel
            eyebrow="A record, not advice"
            title="Keep the schedule and the journal separate."
            body="PurpleLife can record what happened and when. Medication changes still belong in a conversation with a qualified clinician."
            items={["Scheduled time", "Recorded dose", "Your note"]}
          />
        </PilotLandscapeStack>
      </PilotAppShell>
    </>
  );
}
