import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, MessageCircle, Loader2, BookOpen, ChevronRight, Moon, Bell, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";
import { CONDITION_OPTIONS } from "@/lib/condition-prompts";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { LocaleFields, type LocaleValues } from "@/components/locale/locale-fields";
import { setLocale, type SupportedLocale } from "@/i18n";

type ModelGroup = "Fast" | "Balanced" | "Deepest";
const MODEL_OPTIONS: { value: string; label: string; hint: string; group: ModelGroup }[] = [
  { value: "gemini-flash", label: "Gemini Flash", hint: "Quickest replies. Best default.", group: "Fast" },
  { value: "gpt-5-mini", label: "GPT-5 mini", hint: "OpenAI, fast and balanced.", group: "Fast" },
  { value: "claude-sonnet", label: "Claude Sonnet", hint: "Warm tone, careful reasoning. Used for actions.", group: "Balanced" },
  { value: "gemini-pro", label: "Gemini Pro", hint: "Slower, more thorough.", group: "Balanced" },
  { value: "gpt-5", label: "GPT-5", hint: "OpenAI flagship. Deep reasoning, slower.", group: "Deepest" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Google's deepest. Long context.", group: "Deepest" },
];
const KNOWN_CONDITION_IDS = new Set(CONDITION_OPTIONS.map((o) => o.id as string));

export function PreferencesSection() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [model, setModel] = React.useState<string>("gemini-flash");
  const [fab, setFab] = React.useState<boolean>(true);
  const [wakeTime, setWakeTime] = React.useState<string>("07:00");
  const [sleepTime, setSleepTime] = React.useState<string>("23:00");
  const [snoozeMinutes, setSnoozeMinutes] = React.useState<string>("10");
  const [conditions, setConditions] = React.useState<string[]>([]);
  const [customDraft, setCustomDraft] = React.useState<string>("");
  const [savingConditions, setSavingConditions] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [savingModel, setSavingModel] = React.useState(false);
  const [savingFab, setSavingFab] = React.useState(false);
  const [locale, setLocaleState] = React.useState<LocaleValues>({
    country: null,
    timezone: null,
    locale: "en",
  });
  const [savingLocale, setSavingLocale] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ai_model_preference, floating_ask_enabled, wake_time, sleep_time, snooze_minutes, conditions, conditions_note, country, timezone, locale")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setModel(data.ai_model_preference ?? "gemini-flash");
        setFab(data.floating_ask_enabled ?? true);
        if (data.wake_time) setWakeTime(String(data.wake_time).slice(0, 5));
        if (data.sleep_time) setSleepTime(String(data.sleep_time).slice(0, 5));
        if (data.snooze_minutes != null) setSnoozeMinutes(String(data.snooze_minutes));
        setLocaleState({
          country: (data as { country?: string | null }).country ?? null,
          timezone: (data as { timezone?: string | null }).timezone ?? null,
          locale: ((data as { locale?: string }).locale as SupportedLocale) ?? "en",
        });
        // Merge legacy free-text conditions_note into chips, then drain the column.
        const existing: string[] = Array.isArray(data.conditions) ? data.conditions : [];
        const legacy: string[] = (data.conditions_note ?? "")
          .split(/[,;\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        const seen = new Set(existing.map((c) => c.toLowerCase()));
        const merged = [...existing];
        for (const item of legacy) {
          if (!seen.has(item.toLowerCase())) {
            merged.push(item);
            seen.add(item.toLowerCase());
          }
        }
        setConditions(merged);
        if (legacy.length > 0) {
          // Persist the merge so the legacy column stops shadowing chip edits.
          void supabase
            .from("profiles")
            .update({ conditions: merged, conditions_note: null })
            .eq("id", userId);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const onModelChange = async (next: string) => {
    if (!userId) return;
    setModel(next);
    setSavingModel(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ai_model_preference: next })
      .eq("id", userId);
    setSavingModel(false);
    if (error) toast.error("Couldn't save model preference");
    else toast.success("AI model updated");
  };

  const onLocaleChange = async (next: LocaleValues) => {
    setLocaleState(next);
    if (!userId) return;
    setSavingLocale(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        country: next.country,
        timezone: next.timezone,
        locale: next.locale,
      })
      .eq("id", userId);
    setSavingLocale(false);
    if (error) {
      toast.error("Couldn't save region & language");
      return;
    }
    setLocale(next.locale);
    toast.success("Saved");
  };

  const saveSleep = async (next: { wake?: string; sleep?: string }) => {
    if (!userId) return;
    const wake = next.wake ?? wakeTime;
    const sleep = next.sleep ?? sleepTime;
    if (next.wake !== undefined) setWakeTime(next.wake);
    if (next.sleep !== undefined) setSleepTime(next.sleep);
    const { error } = await supabase
      .from("profiles")
      .update({ wake_time: wake, sleep_time: sleep })
      .eq("id", userId);
    if (error) toast.error("Couldn't save sleep window");
  };

  const saveSnooze = async (v: string) => {
    if (!userId) return;
    setSnoozeMinutes(v);
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return;
    const { error } = await supabase
      .from("profiles")
      .update({ snooze_minutes: n })
      .eq("id", userId);
    if (error) toast.error("Couldn't save snooze setting");
  };

  const onFabChange = async (next: boolean) => {
    if (!userId) return;
    setFab(next);
    setSavingFab(true);
    const { error } = await supabase
      .from("profiles")
      .update({ floating_ask_enabled: next })
      .eq("id", userId);
    setSavingFab(false);
    if (error) {
      toast.error("Couldn't save preference");
      setFab(!next);
    }
  };

  const persistConditions = async (next: string[]) => {
    if (!userId) return;
    setConditions(next);
    setSavingConditions(true);
    const { error } = await supabase
      .from("profiles")
      .update({ conditions: next })
      .eq("id", userId);
    setSavingConditions(false);
    if (error) toast.error("Couldn't save");
  };

  const toggleCondition = async (id: string) => {
    if (!userId) return;
    const next = conditions.includes(id)
      ? conditions.filter((c) => c !== id)
      : [...conditions, id];
    await persistConditions(next);
  };

  const addCustomCondition = async () => {
    const v = customDraft.trim().slice(0, 60);
    if (!v) return;
    if (conditions.some((c) => c.toLowerCase() === v.toLowerCase())) {
      setCustomDraft("");
      return;
    }
    await persistConditions([...conditions, v]);
    setCustomDraft("");
    toast.success(`Added "${v}"`);
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-serif text-xl text-foreground">Preferences</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        How Purple talks to you and which mind does the thinking.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <Label className="flex items-center gap-2 font-serif text-base text-foreground">
            <Heart className="h-4 w-4 text-primary" />
            Your focus
            {savingConditions && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            What you're managing. Shapes prompts and how Purple talks with you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((opt) => {
              const active = conditions.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleCondition(opt.id)}
                  disabled={loading}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
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
            {conditions
              .filter((c) => !KNOWN_CONDITION_IDS.has(c))
              .map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1.5 text-xs"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => toggleCondition(c)}
                    aria-label={`Remove ${c}`}
                    className="rounded-full hover:bg-primary-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value.slice(0, 60))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addCustomCondition();
                }
              }}
              placeholder="Add your own (e.g. Heart health)"
              disabled={loading}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => void addCustomCondition()}
              disabled={loading || !customDraft.trim()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <Label
            htmlFor="ai-model"
            className="flex items-center gap-2 font-serif text-base text-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI model
            {savingModel && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Which model answers your questions and reads your patterns.
          </p>
          <div className="mt-3">
            <Select value={model} onValueChange={onModelChange} disabled={loading}>
              <SelectTrigger id="ai-model" className="w-full sm:w-[360px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Fast", "Balanced", "Deepest"] as const).map((g) => (
                  <SelectGroup key={g}>
                    <SelectLabel className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g}</SelectLabel>
                    {MODEL_OPTIONS.filter((o) => o.group === g).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col items-start">
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.hint}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-border pt-5">
          <div className="flex-1">
            <Label
              htmlFor="floating-ask"
              className="flex items-center gap-2 font-serif text-base text-foreground"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              Floating Ask button
              {savingFab && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Show a small Ask Purple bubble on every screen so you can chat without leaving what you're doing.
            </p>
          </div>
          <Switch
            id="floating-ask"
            checked={fab}
            onCheckedChange={onFabChange}
            disabled={loading}
          />
        </div>

        <div className="border-t border-border pt-5">
          <Label className="flex items-center gap-2 font-serif text-base text-foreground">
            <Moon className="h-4 w-4 text-primary" />
            Sleep window
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Doses that fall during your sleep are flagged with a moon icon so you know to take them when you wake.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="wake-time" className="text-sm text-muted-foreground">Wake</Label>
              <input
                id="wake-time"
                type="time"
                value={wakeTime}
                onChange={(e) => void saveSleep({ wake: e.target.value })}
                disabled={loading}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sleep-time" className="text-sm text-muted-foreground">Sleep</Label>
              <input
                id="sleep-time"
                type="time"
                value={sleepTime}
                onChange={(e) => void saveSleep({ sleep: e.target.value })}
                disabled={loading}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <Label htmlFor="snooze-min" className="flex items-center gap-2 font-serif text-base text-foreground">
            <Bell className="h-4 w-4 text-primary" />
            Reminder snooze
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            How long "Snooze" pushes a dose reminder out, and how often a critical-style alarm repeats.
          </p>
          <div className="mt-3">
            <Select value={snoozeMinutes} onValueChange={saveSnooze} disabled={loading}>
              <SelectTrigger id="snooze-min" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Link
          to="/settings/how-purple-thinks"
          className="flex items-center justify-between border-t border-border pt-5 -mx-1 px-1 rounded-lg hover:bg-secondary/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <p className="font-serif text-base text-foreground">How Purple thinks</p>
              <p className="text-xs text-muted-foreground">What it reads, when it acts, what stays private.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-1">
            <Label className="font-serif text-base text-foreground">Region &amp; language</Label>
            {savingLocale && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            How Purple shows times and which language it speaks.
          </p>
          <LocaleFields values={locale} onChange={onLocaleChange} disabled={loading} />
        </div>
      </div>
    </section>
  );
}