import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { type ConditionTag } from "@/lib/condition-prompts";
import { ConditionPicker } from "@/components/conditions/condition-picker";
import { useVoiceCapture } from "@/components/journal/use-voice-capture";
import { setLocale, detectBrowserLocale, type SupportedLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { redeemInviteCode } from "@/lib/invite-codes.functions";
import { generateCareProfile } from "@/lib/care-profile.functions";
import { getStoredInvite, clearStoredInvite } from "@/lib/invite-storage";
import { processJournalEntry } from "@/lib/journal-pipeline";

const LOCALE_PREFILL_KEY = "purple-locale-prefill";
// Read once by /today for the post-onboarding greeting.
const FIRST_WORDS_KEY = "purple-first-words";

/** How long we wait for the extraction before letting the user move on. */
const EXTRACTION_TIMEOUT_MS = 12_000;
const EXTRACTION_POLL_MS = 1_500;

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({ meta: [{ title: "Welcome to Purple" }] }),
  component: WelcomePage,
});

type ExtractionResult = {
  summary: string | null;
  tags: string[];
  behaviorCount: number;
};

type FinalePhase = "compose" | "saving" | "reading" | "confirmed" | "stillReading";

function WelcomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { t } = useTranslation();
  const redeem = useServerFn(redeemInviteCode);
  const regenerateCareProfile = useServerFn(generateCareProfile);

  const [step, setStep] = useState<0 | 1>(0);
  const [firstName, setFirstName] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [entryText, setEntryText] = useState("");
  const [phase, setPhase] = useState<FinalePhase>("compose");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const profileSavedRef = useRef(false);
  const existingTimezoneRef = useRef<string | null>(null);
  const voice = useVoiceCapture();

  // Auto-redeem any stored invite as soon as we have a session.
  useEffect(() => {
    if (!userId) return;
    const stored = getStoredInvite();
    if (!stored) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await redeem({ data: { code: stored } });
        if (cancelled) return;
        if (res.ok) {
          clearStoredInvite();
          toast.success(t("welcome.inviteApplied"));
        }
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, redeem, t]);

  // Prefill from existing profile so the user never re-enters what's saved.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("first_name, conditions, timezone")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.first_name) setFirstName(data.first_name);
        if (Array.isArray(data.conditions) && data.conditions.length > 0) {
          setConditions(data.conditions);
        }
        existingTimezoneRef.current = data.timezone ?? null;
      });
  }, [userId]);

  // Mirror live dictation into the textarea.
  useEffect(() => {
    if (voice.transcript) setEntryText(voice.transcript);
  }, [voice.transcript]);

  /**
   * Saves the profile (first name, conditions, detected locale) and marks
   * onboarding done. Idempotent; only writes the fields this flow collects so
   * anything a returning user already saved stays untouched.
   */
  const saveProfile = async () => {
    if (!userId || profileSavedRef.current) return;
    let locale: SupportedLocale = detectBrowserLocale();
    try {
      const raw = localStorage.getItem(LOCALE_PREFILL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { locale?: SupportedLocale };
        if (parsed.locale) locale = parsed.locale;
      }
    } catch {
      /* ignore */
    }
    // Timezone anchors medication wall-clock times (see docs/RELIABILITY.md
    // and the dose seeder). Capture it here so a user's very first med
    // schedules in their actual timezone, not UTC. Never clobber an existing
    // value; Settings owns changes after onboarding.
    let detectedTimezone: string | null = null;
    if (!existingTimezoneRef.current) {
      try {
        detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        detectedTimezone = null;
      }
    }
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      first_name: firstName.trim() || null,
      conditions,
      locale,
      ...(detectedTimezone ? { timezone: detectedTimezone } : {}),
      onboarded_at: new Date().toISOString(),
    });
    if (error) throw error;
    profileSavedRef.current = true;
    setLocale(locale);
    try {
      localStorage.removeItem(LOCALE_PREFILL_KEY);
      localStorage.setItem("purple-onboarded", "1");
    } catch {
      /* ignore */
    }
    // Fire-and-forget: build the AI care profile so Today/Journal/Ask Purple
    // are already personalized on first paint. Never block onboarding on it.
    void regenerateCareProfile({ data: { force: true } }).catch((err) => {
      console.warn("[welcome] care profile generation failed", err);
    });
  };

  const skip = async () => {
    try {
      await saveProfile();
    } catch {
      /* still leave; Settings can finish the profile later */
    }
    navigate({ to: "/today" });
  };

  const rememberFirstWords = (text: string) => {
    try {
      sessionStorage.setItem(FIRST_WORDS_KEY, text.trim().slice(0, 90));
    } catch {
      /* ignore */
    }
  };

  /** Step 2 finale: save the entry, then watch the extraction come back. */
  const saveFirstEntry = async () => {
    const text = entryText.trim();
    if (!userId || !text) return;
    if (voice.listening) void voice.stop();
    setPhase("saving");
    try {
      await saveProfile();
      const { data: inserted, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          kind: "text",
          status: "processing",
          captured_at: new Date().toISOString(),
          text,
        })
        .select("id")
        .single();
      if (error || !inserted) throw error ?? new Error("insert failed");
      const entryId = inserted.id as string;

      void processJournalEntry(entryId);

      rememberFirstWords(text);
      setPhase("reading");

      const deadline = Date.now() + EXTRACTION_TIMEOUT_MS;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, EXTRACTION_POLL_MS));
        const [{ data: entry }, { count }] = await Promise.all([
          supabase
            .from("journal_entries")
            .select("ai_summary, ai_tags, status")
            .eq("id", entryId)
            .maybeSingle(),
          supabase
            .from("daily_behaviors")
            .select("id", { count: "exact", head: true })
            .eq("journal_entry_id", entryId),
        ]);
        const tags = (entry?.ai_tags as string[] | null) ?? [];
        const summary = (entry?.ai_summary as string | null) ?? null;
        const behaviorCount = count ?? 0;
        if (summary || tags.length > 0 || behaviorCount > 0) {
          setExtraction({ summary, tags, behaviorCount });
          setPhase("confirmed");
          return;
        }
        if (entry?.status === "failed") break;
      }
      setPhase("stillReading");
    } catch (e) {
      const msg = e instanceof Error ? e.message : null;
      console.error("[welcome] first entry failed", msg);
      toast.error(t("welcome.entrySaveFailed"));
      setPhase("compose");
    }
  };

  const finishToToday = async () => {
    try {
      await saveProfile();
    } catch {
      /* non-blocking */
    }
    navigate({ to: "/today" });
  };

  const exampleChips = [t("welcome.example1"), t("welcome.example2"), t("welcome.example3")];

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={skip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("welcome.skip")}
        </button>
      </div>

      {step === 0 && (
        <div>
          <p className="label-eyebrow mb-4">{t("welcome.stepOneOfTwo")}</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.whoTitle")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">{t("welcome.whoBodyShort")}</p>
          <div className="mt-8 space-y-7">
            <div className="max-w-sm">
              <Label htmlFor="first">{t("welcome.firstName")}</Label>
              <Input
                id="first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="mt-1.5"
              />
            </div>
            <div>
              <p className="label-eyebrow mb-3">{t("welcome.bringsTitle")}</p>
              <ConditionPicker
                value={conditions}
                onChange={(next) => setConditions(next as ConditionTag[])}
              />
            </div>
          </div>
          <Button
            className="mt-10 rounded-full px-7 h-12 text-base"
            size="lg"
            onClick={() => setStep(1)}
          >
            {t("welcome.continue")} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 1 && (phase === "compose" || phase === "saving") && (
        <div>
          <p className="label-eyebrow mb-4">{t("welcome.stepTwoOfTwo")}</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.tellTitle")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">{t("welcome.tellBody")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {exampleChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setEntryText(chip)}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <Textarea
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder={t("welcome.tellPlaceholder")}
              className="min-h-[120px] text-base"
              aria-label={t("welcome.tellTitle")}
            />
            <div className="mt-3 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => (voice.listening ? void voice.stop() : void voice.start())}
              >
                {voice.listening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5 mr-1.5" /> {t("welcome.stopDictating")}
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 mr-1.5" /> {t("welcome.dictate")}
                  </>
                )}
              </Button>
              {voice.listening && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  {t("welcome.listening")}
                </span>
              )}
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>
              {t("welcome.back")}
            </Button>
            <Button
              className="rounded-full px-7"
              onClick={saveFirstEntry}
              disabled={phase === "saving" || entryText.trim().length === 0}
            >
              {phase === "saving" ? t("welcome.saving") : t("welcome.save")}
            </Button>
          </div>
        </div>
      )}

      {step === 1 && phase === "reading" && (
        <div className="py-16 text-center">
          <p className="font-serif text-2xl text-foreground animate-pulse">
            {t("welcome.reading")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{t("welcome.readingSub")}</p>
        </div>
      )}

      {step === 1 && phase === "confirmed" && extraction && (
        <div>
          <p className="label-eyebrow mb-4">{t("welcome.heardEyebrow")}</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.heardTitle")}
          </h1>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground italic">&ldquo;{entryText.trim()}&rdquo;</p>
            {extraction.summary && (
              <p className="mt-4 text-base text-foreground">{extraction.summary}</p>
            )}
            {extraction.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {extraction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {extraction.behaviorCount > 0 && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary" />
                {t("welcome.behaviorsNoted", { count: extraction.behaviorCount })}
              </p>
            )}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{t("welcome.heardSub")}</p>
          <Button
            className="mt-8 rounded-full px-7 h-12 text-base"
            size="lg"
            onClick={finishToToday}
          >
            {t("welcome.takeMeIn")} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 1 && phase === "stillReading" && (
        <div>
          <p className="label-eyebrow mb-4">{t("welcome.savedEyebrow")}</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.savedTitle")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">{t("welcome.savedBody")}</p>
          <Button
            className="mt-8 rounded-full px-7 h-12 text-base"
            size="lg"
            onClick={finishToToday}
          >
            {t("welcome.takeMeIn")} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
