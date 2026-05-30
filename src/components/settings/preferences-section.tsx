import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, MessageCircle, Loader2, BookOpen, ChevronRight, Moon, Bell } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

const MODEL_OPTIONS = [
  {
    value: "gemini-flash",
    label: "Gemini Flash · fast",
    hint: "Quickest replies. Good default for day-to-day questions.",
  },
  {
    value: "gemini-pro",
    label: "Gemini Pro · deeper",
    hint: "Slower, more thorough — best for pattern questions.",
  },
  {
    value: "claude-sonnet",
    label: "Claude Sonnet · most thoughtful",
    hint: "Anthropic's flagship. Warmest tone, careful reasoning.",
  },
];

export function PreferencesSection() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [model, setModel] = React.useState<string>("gemini-flash");
  const [fab, setFab] = React.useState<boolean>(true);
  const [wakeTime, setWakeTime] = React.useState<string>("07:00");
  const [sleepTime, setSleepTime] = React.useState<string>("23:00");
  const [snoozeMinutes, setSnoozeMinutes] = React.useState<string>("10");
  const [loading, setLoading] = React.useState(true);
  const [savingModel, setSavingModel] = React.useState(false);
  const [savingFab, setSavingFab] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ai_model_preference, floating_ask_enabled, wake_time, sleep_time, snooze_minutes")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setModel(data.ai_model_preference ?? "gemini-flash");
        setFab(data.floating_ask_enabled ?? true);
        if (data.wake_time) setWakeTime(String(data.wake_time).slice(0, 5));
        if (data.sleep_time) setSleepTime(String(data.sleep_time).slice(0, 5));
        if (data.snooze_minutes != null) setSnoozeMinutes(String(data.snooze_minutes));
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

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-serif text-xl text-foreground">Preferences</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        How Purple talks to you and which mind does the thinking.
      </p>

      <div className="mt-6 space-y-6">
        <div>
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
                {MODEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col items-start">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.hint}</span>
                    </div>
                  </SelectItem>
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
      </div>
    </section>
  );
}