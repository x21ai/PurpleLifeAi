import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { getAiProvider, setAiProvider } from "@/lib/ai-provider.functions";
import { userMessage } from "@/lib/user-message";

type Provider = "claude" | "openai" | "gemini" | "grok" | "maya";

type Option = {
  id: Provider;
  name: string;
  blurb: string;
  disabled?: boolean;
  disabledReason?: string;
};

const OPTIONS: Option[] = [
  {
    id: "claude",
    name: "Anthropic Claude",
    blurb: "Default. Strong at lab reports, imaging summaries, and chat. Reads PDFs and images.",
  },
  { id: "openai", name: "OpenAI GPT", blurb: "Fast all-rounder. Reads images, not PDFs." },
  { id: "gemini", name: "Google Gemini", blurb: "Big context window. Reads PDFs and images." },
  { id: "grok", name: "xAI Grok", blurb: "Strong reasoning. Reads images, not PDFs." },
  {
    id: "maya",
    name: "Maya (internal)",
    blurb: "Purple's own model. Not configured yet.",
    disabled: true,
    disabledReason: "Endpoint not set",
  },
];

export function AiProviderSection() {
  const fetchProvider = useServerFn(getAiProvider);
  const saveProvider = useServerFn(setAiProvider);
  const [current, setCurrent] = useState<Provider>("claude");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Provider | null>(null);

  useEffect(() => {
    void fetchProvider()
      .then((r) => setCurrent((r.provider as Provider) ?? "claude"))
      .finally(() => setLoading(false));
  }, [fetchProvider]);

  const pick = async (id: Provider) => {
    if (id === current || saving) return;
    setSaving(id);
    try {
      await saveProvider({ data: { provider: id } });
      setCurrent(id);
      toast.success(`AI provider set to ${OPTIONS.find((o) => o.id === id)?.name}`);
    } catch (e) {
      toast.error(userMessage(e, "Couldn't save provider"));
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-xl text-foreground">AI provider</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Your report extraction, Ask Purple chat, and insights all run on the provider you pick here.
        Keys live server-side; we never expose them to the browser.
      </p>
      <div className="mt-4 grid gap-2">
        {OPTIONS.map((o) => {
          const selected = current === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o.id)}
              disabled={o.disabled || loading || saving !== null}
              className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-secondary/40"
              } ${o.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="min-w-0">
                <p className="font-serif text-base text-foreground">
                  {o.name}
                  {o.disabled && o.disabledReason && (
                    <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {o.disabledReason}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{o.blurb}</p>
              </div>
              {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              {saving === o.id && <span className="text-xs text-muted-foreground">Saving…</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
