import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Loader2, Mic, MicOff, BookmarkPlus, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/integrations/supabase/auth-context";
import { getSuggestedQuestions, getFollowUps } from "@/lib/condition-prompts";
import { useCareProfile } from "@/hooks/use-care-profile";
import { useNativeAppContext } from "@/lib/native-app-context";
import { DisclaimerFooter } from "@/components/chat/disclaimer-footer";
import { FollowUpChips } from "@/components/chat/follow-up-chips";
import { useVoiceCapture } from "@/components/journal/use-voice-capture";
import { executePurpleAction } from "@/lib/purple-actions.functions";
import { useIsPro } from "@/lib/pro-gate";
import { ProGate } from "@/components/pro/pro-gate";
import { userMessage } from "@/lib/user-message";
import { focusInput } from "@/lib/focus-input";

const FREE_DAILY_LIMIT = 10;
const ASK_LIMIT_STORAGE_KEY = "purple-ask-message-stamps";

function readStamps(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ASK_LIMIT_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return arr.filter((n) => typeof n === "number" && n > cutoff);
  } catch {
    return [];
  }
}

function pushStamp() {
  if (typeof window === "undefined") return;
  const next = [...readStamps(), Date.now()];
  try {
    window.localStorage.setItem(ASK_LIMIT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

type ProposalKind =
  | "add_medication"
  | "log_seizure"
  | "create_journal_entry"
  | "mark_dose_taken"
  | "archive_medication";

type Proposal = {
  kind: ProposalKind;
  summary: string;
  params: Record<string, unknown>;
};

type ProposalStatus = "pending" | "confirmed" | "cancelled" | "failed";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Ask · Purple" }] }),
  component: AskPage,
});

function AskPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const { isNativeApp } = useNativeAppContext();
  const { session } = useAuth();
  const userId = session?.user.id;
  const accessToken = session?.access_token;
  const { isPro } = useIsPro();
  const [usedToday, setUsedToday] = React.useState(0);
  React.useEffect(() => {
    setUsedToday(readStamps().length);
  }, []);
  const overLimit = !isPro && usedToday >= FREE_DAILY_LIMIT;
  const [conditions, setConditions] = React.useState<string[] | null>(null);
  React.useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .select("conditions")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setConditions(data?.conditions ?? []));
  }, [userId]);
  const careProfile = useCareProfile();
  const suggestions = React.useMemo(() => {
    if (careProfile?.askPurpleStarters && careProfile.askPurpleStarters.length > 0) {
      return careProfile.askPurpleStarters;
    }
    return getSuggestedQuestions(conditions);
  }, [conditions, careProfile]);
  const [input, setInput] = React.useState("");

  // Starter questions elsewhere in the app (condition pages) hand a prefill
  // through sessionStorage so the question is ready to send on arrival.
  React.useEffect(() => {
    try {
      const prefill = sessionStorage.getItem("purple-chat-prefill");
      if (prefill) {
        setInput(prefill);
        sessionStorage.removeItem("purple-chat-prefill");
      }
    } catch {
      /* ignore */
    }
  }, []);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceCapture();

  // Per-call Authorization header so the chat route can identify the user.
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: () =>
          accessToken ? ({ Authorization: `Bearer ${accessToken}` } as Record<string, string>) : ({} as Record<string, string>),
      }),
    [accessToken],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: (err) => {
      console.error(err);
      toast.error("Couldn't reach Purple just now. Try again in a moment.");
    },
  });
  const thinking = status === "submitted" || status === "streaming";
  const [proposalStatus, setProposalStatus] = React.useState<
    Record<string, ProposalStatus>
  >({});

  const executeAction = useServerFn(executePurpleAction);

  // Mirror live transcript into the input while listening.
  React.useEffect(() => {
    if (voice.listening && voice.transcript) setInput(voice.transcript);
  }, [voice.listening, voice.transcript]);

  const send = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;
      if (!isPro && readStamps().length >= FREE_DAILY_LIMIT) {
        setUsedToday(readStamps().length);
        toast.error("You've used today's free Ask Purple messages. Upgrade for unlimited.");
        return;
      }
      setInput("");
      void sendMessage({ text: trimmed });
      if (!isPro) {
        pushStamp();
        setUsedToday(readStamps().length);
      }
    },
    [sendMessage, thinking, isPro],
  );

  const toggleMic = async () => {
    if (voice.listening) {
      await voice.stop();
      const text = voice.transcript.trim();
      if (text) {
        setInput("");
        voice.reset();
        send(text);
      }
    } else {
      await voice.start();
    }
  };

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  // Refocus the composer after a stream finishes.
  React.useEffect(() => {
    if (status === "ready") focusInput(inputRef.current);
  }, [status]);

  const onConfirm = async (key: string, proposal: Proposal) => {
    setProposalStatus((s) => ({ ...s, [key]: "pending" }));
    try {
      const res = await executeAction({ data: proposal });
      if (!res?.ok) throw new Error(res?.error || "Action failed");
      setProposalStatus((s) => ({ ...s, [key]: "confirmed" }));
      toast.success("Done.");
    } catch (e) {
      console.error(e);
      setProposalStatus((s) => ({ ...s, [key]: "failed" }));
      toast.error(userMessage(e, "Couldn't complete that action."));
    }
  };

  const onCancel = (key: string) => {
    setProposalStatus((s) => ({ ...s, [key]: "cancelled" }));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  // Suppress unused-variable warning for setMessages (kept for potential future
  // "clear conversation" affordance).
  void setMessages;

  return (
    <div
      className={
        isNativeApp
          ? "flex flex-col flex-1 min-h-0 h-full"
          : "flex flex-col h-[100dvh] md:h-screen"
      }
    >
      <header
        className={
          isNativeApp
            ? "px-4 pt-4 pb-4 border-b border-border/40"
            : "px-4 sm:px-10 lg:px-16 pt-12 sm:pt-20 pb-6 border-b border-border/40"
        }
      >
        <div className="mx-auto max-w-3xl">
          <p className="label-eyebrow text-muted-foreground">{t("chatPage.eyebrow")}</p>
          <h1 className="mt-2 font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
            {t("chatPage.title1")}
            <br />
            {t("chatPage.title2")}
          </h1>
        </div>
      </header>

      <div
        ref={scrollRef}
        className={
          isNativeApp
            ? "flex-1 min-h-0 overflow-y-auto px-4 pb-4"
            : "flex-1 overflow-y-auto px-4 sm:px-10 lg:px-16 pb-28 md:pb-6"
        }
      >
        <div className="mx-auto max-w-3xl py-8">
          {messages.length === 0 ? (
            <EmptyState onPick={(s) => send(s)} suggestions={suggestions} />
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => {
                const text = extractText(m);
                const proposals = extractProposals(m);
                return (
                  <React.Fragment key={m.id ?? i}>
                    {(text || m.role === "user") && (
                      <Bubble role={m.role} text={text} />
                    )}
                    {proposals.map(({ proposal, key }) => (
                      <ActionConfirmCard
                        key={key}
                        proposal={proposal}
                        status={proposalStatus[key] ?? "pending"}
                        onConfirm={() => void onConfirm(key, proposal)}
                        onCancel={() => onCancel(key)}
                      />
                    ))}
                    {m.role === "assistant" &&
                      proposals.length === 0 &&
                      i === messages.length - 1 &&
                      !thinking && (
                        <FollowUpChips
                          suggestions={getFollowUps(
                            conditions,
                            [...messages].reverse().find((x) => x.role === "user")
                              ? extractText(
                                  [...messages].reverse().find((x) => x.role === "user")!,
                                )
                              : "",
                          )}
                          onPick={(s) => send(s)}
                        />
                      )}
                    {m.role === "assistant" && !thinking && text && (
                      <SaveToJournalButton
                        question={
                          i > 0 && messages[i - 1].role === "user"
                            ? extractText(messages[i - 1])
                            : ""
                        }
                        answer={text}
                        userId={userId}
                      />
                    )}
                  </React.Fragment>
                );
              })}
              {status === "submitted" && <ThinkingDots />}
            </div>
          )}
        </div>
      </div>

      <div
        className={
          isNativeApp
            ? "shrink-0 border-t border-border/40 bg-background/95 backdrop-blur px-4 py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : "fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-auto md:static left-0 right-0 border-t border-border/40 bg-background/95 backdrop-blur px-4 sm:px-10 lg:px-16 py-4"
        }
      >
        <DisclaimerFooter />
        {overLimit ? (
          <div className="mx-auto max-w-3xl">
            <ProGate feature="ask_unlimited" />
          </div>
        ) : (
        <div className="mx-auto max-w-3xl flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about your patterns…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-40"
          />
          {voice.supported && (
            <Button
              size="icon"
              variant={voice.listening ? "default" : "outline"}
              onClick={() => void toggleMic()}
              disabled={thinking}
              aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
              className="h-11 w-11 rounded-full shrink-0"
            >
              {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button
            size="icon"
            onClick={() => void send(input)}
            disabled={!input.trim() || thinking}
            aria-label="Send"
            className="h-11 w-11 rounded-full shrink-0"
          >
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        )}
        {!isPro && !overLimit && usedToday >= FREE_DAILY_LIMIT - 3 && (
          <p className="mx-auto max-w-3xl mt-2 text-[11px] text-muted-foreground text-right">
            {FREE_DAILY_LIMIT - usedToday} free message{FREE_DAILY_LIMIT - usedToday === 1 ? "" : "s"} left today.
          </p>
        )}
      </div>
    </div>
  );
}

function SaveToJournalButton({
  question,
  answer,
  userId,
}: {
  question: string;
  answer: string;
  userId: string | undefined;
}) {
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    if (!userId || saved || busy) return;
    setBusy(true);
    const body = question
      ? `**Q:** ${question}\n\n**Purple:** ${answer}`
      : `**Purple:** ${answer}`;
    const { error } = await supabase.from("journal_entries").insert({
      user_id: userId,
      kind: "text",
      status: "complete",
      text: body,
      ai_tags: ["ask-purple"],
      captured_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't save to your journal.");
      return;
    }
    setSaved(true);
    toast.success("Saved to your journal.");
  };
  return (
    <div className="flex justify-start pl-1">
      <button
        type="button"
        onClick={() => void save()}
        disabled={busy || saved || !userId}
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-60 transition-colors"
      >
        {saved ? <Check className="h-3 w-3" /> : <BookmarkPlus className="h-3 w-3" />}
        {saved ? "Saved to journal" : "Save to journal"}
      </button>
    </div>
  );
}

function EmptyState({
  onPick,
  suggestions,
}: {
  onPick: (s: string) => void;
  suggestions: string[];
}) {
  return (
    <div className="py-6 sm:py-10">
      <p className="body-serif text-foreground/85 max-w-lg leading-relaxed">
        Ask me anything about your sleep, your medication, your symptoms, your patterns, or your
        care.
      </p>
      <div className="mt-8 -mx-1 flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible scrollbar-none">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="shrink-0 sm:shrink text-left text-sm rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary px-4 py-2.5 transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

const SOURCE_CITATION_RE = /\[Source:\s*([^\]]+)\]\((https?:\/\/[^)]+)\)|\[Source:\s*([^\]]+)\]/g;

function renderWithSourceCitations(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(SOURCE_CITATION_RE)) {
    const idx = match.index ?? 0;
    if (idx > last) {
      parts.push(<ReactMarkdown key={`md-${key++}`}>{text.slice(last, idx)}</ReactMarkdown>);
    }
    const label = (match[1] ?? match[3] ?? "").trim();
    const href = match[2];
    if (href) {
      parts.push(
        <a
          key={`src-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 no-underline mx-0.5 align-middle"
        >
          {label}
        </a>,
      );
    } else {
      parts.push(
        <span
          key={`src-${key++}`}
          className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground mx-0.5 align-middle"
        >
          {label}
        </span>,
      );
    }
    last = idx + match[0].length;
  }
  if (last < text.length) {
    parts.push(<ReactMarkdown key={`md-${key++}`}>{text.slice(last)}</ReactMarkdown>);
  }
  return parts.length > 0 ? parts : <ReactMarkdown>{text}</ReactMarkdown>;
}

function extractText(message: UIMessage): string {
  if (!Array.isArray(message.parts)) return "";
  return message.parts
    .map((p) => (p.type === "text" ? (p as { text?: string }).text ?? "" : ""))
    .join("")
    .trim();
}

type ExtractedProposal = { proposal: Proposal; key: string };

function extractProposals(message: UIMessage): ExtractedProposal[] {
  if (message.role !== "assistant" || !Array.isArray(message.parts)) return [];
  const out: ExtractedProposal[] = [];
  for (let i = 0; i < message.parts.length; i++) {
    const part = message.parts[i] as {
      type: string;
      toolCallId?: string;
      input?: Record<string, unknown>;
      args?: Record<string, unknown>;
    };
    if (part.type !== "tool-proposeAction") continue;
    const raw = (part.input ?? part.args ?? {}) as {
      kind?: ProposalKind;
      summary?: string;
      params?: Record<string, unknown>;
    };
    if (!raw.kind || !raw.summary) continue;
    out.push({
      proposal: {
        kind: raw.kind,
        summary: raw.summary,
        params: (raw.params ?? {}) as Record<string, unknown>,
      },
      key: `${message.id ?? ""}:${part.toolCallId ?? i}`,
    });
  }
  return out;
}

function Bubble({ role, text }: { role: UIMessage["role"]; text: string }) {
  const isUser = role === "user";
  if (!text) return null;
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            : "max-w-[90%] rounded-2xl rounded-bl-md bg-card border border-border text-foreground px-4 py-3 text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 max-w-none font-serif [&_a.source-chip]:no-underline"
        }
      >
        {isUser ? text : renderWithSourceCitations(text)}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-3 max-w-[60px] rounded-2xl rounded-bl-md bg-card border border-border">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-[pulse_1.2s_ease-in-out_infinite]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-[pulse_1.2s_ease-in-out_0.2s_infinite]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-[pulse_1.2s_ease-in-out_0.4s_infinite]" />
    </div>
  );
}

const KIND_LABEL: Record<Proposal["kind"], string> = {
  add_medication: "Add medication",
  log_seizure: "Log seizure event",
  create_journal_entry: "Create journal entry",
  mark_dose_taken: "Mark dose as taken",
  archive_medication: "Archive medication",
};

function ActionConfirmCard({
  proposal,
  status,
  onConfirm,
  onCancel,
}: {
  proposal: Proposal;
  status: "pending" | "confirmed" | "cancelled" | "failed";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  const paramEntries = Object.entries(proposal.params ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0) && v !== "",
  );
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="label-eyebrow text-primary">{KIND_LABEL[proposal.kind]}</p>
          {status === "confirmed" && (
            <span className="text-xs text-primary/80">Done</span>
          )}
          {status === "cancelled" && (
            <span className="text-xs text-muted-foreground">Cancelled</span>
          )}
          {status === "failed" && (
            <span className="text-xs text-destructive">Failed</span>
          )}
        </div>
        <p className="mt-1 text-foreground/90">{proposal.summary}</p>
        {paramEntries.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {paramEntries.map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-foreground/70">{k}:</span>{" "}
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </li>
            ))}
          </ul>
        )}
        {status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleConfirm()}
              disabled={busy}
              className="h-8"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
