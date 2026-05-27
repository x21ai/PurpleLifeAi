import * as React from "react";
import { Sparkles, MessageCircle, Loader2 } from "lucide-react";
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
  const [loading, setLoading] = React.useState(true);
  const [savingModel, setSavingModel] = React.useState(false);
  const [savingFab, setSavingFab] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ai_model_preference, floating_ask_enabled")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setModel(data.ai_model_preference ?? "gemini-flash");
        setFab(data.floating_ask_enabled ?? true);
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
              Show a small Ask Purple button on every screen on desktop and tablet.
              Mobile already has Ask in the bottom nav.
            </p>
          </div>
          <Switch
            id="floating-ask"
            checked={fab}
            onCheckedChange={onFabChange}
            disabled={loading}
          />
        </div>
      </div>
    </section>
  );
}