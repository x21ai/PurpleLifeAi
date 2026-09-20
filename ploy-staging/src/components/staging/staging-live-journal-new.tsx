import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { CaptureHalo } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { ensureStagingSession, stagingSignInRequiredMessage } from "@/lib/staging/session";
import { createJournalEntry } from "@/lib/staging/journal-data";

const ENTRY_TYPES = [
  { label: "Symptom", kind: "symptom" },
  { label: "Medication", kind: "medication" },
  { label: "Sleep", kind: "sleep" },
  { label: "General note", kind: "text" },
];

/**
 * Full journal entry form wired to production D1 insert.
 */
export function StagingLiveJournalNewPage() {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState("General note");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(isStagingLiveData());
  const [saving, setSaving] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStagingLiveData()) return;
    let cancelled = false;
    (async () => {
      const ok = await ensureStagingSession();
      if (!cancelled) {
        setSessionOk(ok);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!note.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    const kind = ENTRY_TYPES.find((t) => t.label === selected)?.kind ?? "text";
    const { error } = await createJournalEntry({ text: note.trim(), kind });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="journal" landscape="focused">
        <DetailHeader title="New journal entry" backHref="/journal" />
        <section className="px-5 pt-1 text-center">
          <CaptureHalo className="mx-auto w-full max-w-[330px]" />
          <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
            Private journal
          </p>
          <h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">
            Anything you want to remember tomorrow.
          </h1>
          <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">
            Saved to production D1 via the staging API proxy.
          </p>
        </section>

        {isStagingLiveData() && (
          <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
            {loading
              ? "Connecting…"
              : sessionOk
                ? "Live write path enabled (pmt account)."
                : stagingSignInRequiredMessage()}
          </p>
        )}

        <section className="mt-7 px-5">
          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line">
            <p className="text-[12px] font-semibold text-purplelife-muted">Entry type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ENTRY_TYPES.map(({ label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSelected(label);
                    setSaved(false);
                  }}
                  className={`min-h-10 rounded-full px-4 text-[12px] font-semibold ${
                    selected === label
                      ? "bg-purplelife-accent text-white"
                      : "bg-purplelife-rail text-purplelife-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-5 block text-[12px] font-semibold text-purplelife-muted">
              What do you want to remember?
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setSaved(false);
                }}
                rows={4}
                placeholder="Write a short note"
                className="mt-2 w-full resize-none rounded-[18px] bg-purplelife-rail p-4 text-[14px] leading-[1.5] text-purplelife-ink outline-none placeholder:font-normal placeholder:text-purplelife-muted/60 focus:ring-2 focus:ring-purplelife-accent/30"
              />
            </label>
            {saveError && <p className="mt-2 text-[12px] text-purplelife-coral">{saveError}</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={!note.trim() || saving || !sessionOk}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:bg-purplelife-rail disabled:text-purplelife-muted disabled:opacity-100"
            >
              <Check size={18} />
              {saving ? "Saving…" : saved ? "Entry saved" : "Save entry"}
            </button>
            {saved && (
              <a
                href="/journal"
                className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-purplelife-tint text-[13px] font-semibold text-purplelife-accent"
              >
                Review journal
                <ChevronRight size={17} />
              </a>
            )}
          </div>
        </section>
      </PilotAppShell>
    </>
  );
}
