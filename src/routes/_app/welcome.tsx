import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, Watch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { ensureServiceWorker, requestPermission } from "@/lib/med-notifications";
import { toast } from "sonner";
import { OuraConnection } from "@/components/connections/oura-connection";
import { PhoneInput, parsePhone, formatPhone } from "@/components/ui/phone-input";
import dawn from "@/assets/hero-readiness-dawn.jpg";
import mist from "@/assets/hero-readiness-mist.jpg";
import { CONDITION_OPTIONS, type ConditionTag } from "@/lib/condition-prompts";
import { Textarea } from "@/components/ui/textarea";
import {
  FEATURE_CATALOG,
  CATEGORY_LABELS,
  isFeatureEnabled,
  type FeatureKey,
  type FeatureCategory,
} from "@/lib/feature-catalog";
import { Switch } from "@/components/ui/switch";
import { LocaleFields, type LocaleValues } from "@/components/locale/locale-fields";
import { setLocale, detectBrowserLocale, type SupportedLocale } from "@/i18n";
import { useTranslation } from "react-i18next";

const LOCALE_PREFILL_KEY = "purple-locale-prefill";

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({ meta: [{ title: "Welcome to Purple" }] }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("US");
  const [phoneNational, setPhoneNational] = useState("");
  const [notifGranted, setNotifGranted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionsNote, setConditionsNote] = useState("");
  // Feature toggles user picked on the "What I track" step. Only keys the user
  // explicitly flipped away from the condition-derived default are persisted
  // into profiles.feature_overrides, so existing users' resolved state never
  // changes unless they touch a toggle.
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});
  const [localeValues, setLocaleValues] = useState<LocaleValues>(() => {
    if (typeof window === "undefined") {
      return { country: null, timezone: null, locale: "en" };
    }
    try {
      const raw = localStorage.getItem(LOCALE_PREFILL_KEY);
      if (raw) return JSON.parse(raw) as LocaleValues;
    } catch {
      // ignore
    }
    return { country: null, timezone: null, locale: detectBrowserLocale() };
  });

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  // Prefill from existing profile so the user never re-enters what's saved.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("first_name, last_name, emergency_contact_name, emergency_contact_phone, conditions, conditions_note, country, timezone, locale, feature_overrides")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.first_name) setFirstName(data.first_name);
        if (data.last_name) setLastName(data.last_name);
        if (data.emergency_contact_name) setEmergencyName(data.emergency_contact_name);
        if (data.emergency_contact_phone) {
          const parsed = parsePhone(data.emergency_contact_phone);
          setPhoneCountry(parsed.code);
          setPhoneNational(parsed.national);
        }
        if (Array.isArray(data.conditions) && data.conditions.length > 0) {
          setConditions(data.conditions);
        }
        if (data.conditions_note) setConditionsNote(data.conditions_note);
        const fo = (data as { feature_overrides?: Record<string, boolean> | null })
          .feature_overrides;
        if (fo && typeof fo === "object") setFeatureToggles(fo);
        const row = data as {
          country?: string | null;
          timezone?: string | null;
          locale?: string | null;
        };
        if (row.country || row.timezone || row.locale) {
          setLocaleValues((prev) => ({
            country: row.country ?? prev.country,
            timezone: row.timezone ?? prev.timezone,
            locale: (row.locale as SupportedLocale) ?? prev.locale,
          }));
        }
      });
  }, [userId]);

  const finish = async () => {
    if (!userId) {
      navigate({ to: "/" });
      return;
    }
    setSaving(true);
    try {
      const phone = formatPhone(phoneCountry, phoneNational);
      // Merge any free-text note into the chip array so Settings can edit it.
      const extraChips = (conditionsNote ?? "")
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const seen = new Set(conditions.map((c) => c.toLowerCase()));
      const mergedConditions = [...conditions];
      for (const item of extraChips) {
        if (!seen.has(item.toLowerCase())) {
          mergedConditions.push(item);
          seen.add(item.toLowerCase());
        }
      }
      await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: phone || null,
        conditions: mergedConditions,
        conditions_note: null,
        country: localeValues.country,
        timezone: localeValues.timezone,
        locale: localeValues.locale,
        feature_overrides: featureToggles,
        onboarded_at: new Date().toISOString(),
      });
      setLocale(localeValues.locale);
      try {
        localStorage.removeItem(LOCALE_PREFILL_KEY);
      } catch {
        // ignore
      }
      localStorage.setItem("purple-onboarded", "1");
      navigate({ to: "/" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("welcome.couldNotSave");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        onboarded_at: new Date().toISOString(),
      });
    }
    localStorage.setItem("purple-onboarded", "1");
    navigate({ to: "/" });
  };

  const enableNotifs = async () => {
    await ensureServiceWorker();
    const perm = await requestPermission();
    setNotifGranted(perm === "granted");
    if (perm === "granted") toast.success(t("welcome.notifsOn"));
  };

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
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
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card aspect-[4/3] sm:aspect-[16/10]">
            <img
              src={dawn}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={1536}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/55" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="label-eyebrow" style={{ color: "var(--background)", opacity: 0.85 }}>
                Purple
              </p>
            </div>
          </div>
          <h1 className="font-serif text-5xl sm:text-7xl leading-[1.02] tracking-tight text-foreground mt-10">
            {t("welcome.heroTitle1")}<br />{t("welcome.heroTitle2")}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
            {t("welcome.heroBody")}
          </p>
          <Button className="mt-10 rounded-full px-7 h-12 text-base" size="lg" onClick={() => setStep(1)}>
            {t("welcome.continue")} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="label-eyebrow mb-4">{t("welcome.step2")}</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.whoTitle")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            {t("welcome.whoBody")}
          </p>
          <div className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first">{t("welcome.firstName")}</Label>
                <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="last">{t("welcome.lastName")}</Label>
                <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="ename">{t("welcome.emergencyName")}</Label>
              <Input id="ename" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ephone">{t("welcome.emergencyPhone")}</Label>
              <div className="mt-1.5">
                <PhoneInput
                  id="ephone"
                  country={phoneCountry}
                  onCountryChange={setPhoneCountry}
                  national={phoneNational}
                  onNationalChange={setPhoneNational}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="label-eyebrow mt-4 mb-3">{t("welcome.regionLanguage")}</p>
              <LocaleFields
                values={localeValues}
                onChange={setLocaleValues}
                compact
              />
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>{t("welcome.back")}</Button>
            <Button className="rounded-full" onClick={() => setStep(2)}>
              {t("welcome.continue")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="label-eyebrow mb-4">{t("welcome.step3")}</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.bringsTitle")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            {t("welcome.bringsBody")}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((opt) => {
              const active = conditions.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setConditions((prev) =>
                      prev.includes(opt.id)
                        ? prev.filter((c) => c !== opt.id)
                        : [...prev, opt.id as ConditionTag],
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <Label htmlFor="conditions-note">{t("welcome.anythingElse")}</Label>
            <Textarea
              id="conditions-note"
              value={conditionsNote}
              onChange={(e) => setConditionsNote(e.target.value.slice(0, 500))}
              placeholder={t("welcome.anythingElsePlaceholder")}
              className="mt-1.5 min-h-[88px]"
            />
          </div>
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>{t("welcome.back")}</Button>
            <Button className="rounded-full" onClick={() => setStep(3)}>
              {t("welcome.continue")} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-border mb-8 aspect-[16/9]">
            <img
              src={mist}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={1536}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-foreground/40" />
          </div>
          <p className="label-eyebrow mb-4">{t("welcome.step4")}</p>
          <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            {t("welcome.connectTitle")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {t("welcome.connectBody")}
          </p>
          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-border bg-card px-4">
              <OuraConnection />
            </div>
            <ConnectCard
              icon={Watch}
              title={t("welcome.whoopTitle")}
              body={t("welcome.whoopBody")}
              actionLabel={t("welcome.comingSoon")}
              disabled
            />
            <ConnectCard
              icon={Bell}
              title={t("welcome.notifTitle")}
              body={t("welcome.notifBody")}
              actionLabel={notifGranted ? t("welcome.enabled") : t("welcome.enable")}
              disabled={notifGranted}
              onAction={enableNotifs}
              done={notifGranted}
            />
          </div>
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>{t("welcome.back")}</Button>
            <Button className="rounded-full" onClick={finish} disabled={saving}>
              {saving ? t("welcome.saving") : t("welcome.takeMeIn")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  disabled,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-secondary p-2 text-secondary-foreground shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-base text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{body}</p>
        </div>
      </div>
      <Button size="sm" variant={done ? "ghost" : "outline"} onClick={onAction} disabled={disabled}>
        {done && <Check className="h-3.5 w-3.5 mr-1" />}
        {actionLabel}
      </Button>
    </div>
  );
}