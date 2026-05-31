import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";

type Proposal = {
  kind:
    | "add_medication"
    | "log_seizure"
    | "create_journal_entry"
    | "mark_dose_taken"
    | "archive_medication";
  summary: string;
  params: Record<string, unknown>;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  proposals?: Proposal[];
  proposalStatus?: Array<"pending" | "confirmed" | "cancelled" | "failed">;
};

const SUGGESTIONS = [
  "How have I been sleeping this week?",
  "Did anything unusual happen yesterday?",
  "What patterns do you see before my events?",
  "What does the research say about my main medication?",
];

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Ask — Purple" }] }),
  component: AskPage,
});

function AskPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-orchestrator", {
        body: { action: "chat", message: trimmed, history },
      });
      if (error) throw error;
      const d = data as { reply?: string; proposals?: Proposal[] };
      const reply = d?.reply || "I couldn't put together an answer just now.";
      const proposals = Array.isArray(d?.proposals) ? d.proposals : [];
      setMessages([
        ...next,
        {
          role: "assistant",
          content: reply,
          proposals: proposals.length ? proposals : undefined,
          proposalStatus: proposals.length ? proposals.map(() => "pending") : undefined,
        },
      ]);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach Purple just now. Try again in a moment.");
      setMessages(next);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const updateProposalStatus = (
    msgIdx: number,
    propIdx: number,
    status: "confirmed" | "cancelled" | "failed",
  ) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIdx || !m.proposalStatus) return m;
        const next = m.proposalStatus.slice();
        next[propIdx] = status;
        return { ...m, proposalStatus: next };
      }),
    );
  };

  const onConfirm = async (msgIdx: number, propIdx: number, proposal: Proposal) => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-orchestrator", {
        body: { action: "execute_action", proposal },
      });
      if (error) throw error;
      const ok = (data as { ok?: boolean })?.ok;
      if (!ok) throw new Error((data as { error?: string })?.error || "Action failed");
      updateProposalStatus(msgIdx, propIdx, "confirmed");
      toast.success("Done.");
    } catch (e) {
      console.error(e);
      updateProposalStatus(msgIdx, propIdx, "failed");
      toast.error(e instanceof Error ? e.message : "Couldn't complete that action.");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen">
      <header className="px-4 sm:px-10 lg:px-16 pt-12 sm:pt-20 pb-6 border-b border-border/40">
        <div className="mx-auto max-w-3xl">
          <p className="label-eyebrow text-muted-foreground">{t("chatPage.eyebrow")}</p>
          <h1 className="mt-2 font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
            {t("chatPage.title1")}
            <br />
            {t("chatPage.title2")}
          </h1>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-10 lg:px-16 pb-28 md:pb-6">
        <div className="mx-auto max-w-3xl py-8">
          {messages.length === 0 ? (
            <EmptyState onPick={(s) => void send(s)} />
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <React.Fragment key={i}>
                  <Bubble msg={m} />
                  {m.proposals?.map((p, pi) => (
                    <ActionConfirmCard
                      key={pi}
                      proposal={p}
                      status={m.proposalStatus?.[pi] ?? "pending"}
                      onConfirm={() => void onConfirm(i, pi, p)}
                      onCancel={() => updateProposalStatus(i, pi, "cancelled")}
                    />
                  ))}
                </React.Fragment>
              ))}
              {thinking && <ThinkingDots />}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-16 md:static md:bottom-auto left-0 right-0 border-t border-border/40 bg-background/95 backdrop-blur px-4 sm:px-10 lg:px-16 py-4">
        <div className="mx-auto max-w-3xl flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about your patterns…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-40"
          />
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
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="py-6 sm:py-10">
      <p className="body-serif text-foreground/85 max-w-lg leading-relaxed">
        Ask me anything about your sleep, your medication, your symptoms, your patterns, or your
        care.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="text-left text-sm rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary px-4 py-2.5 transition"
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

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            : "max-w-[90%] rounded-2xl rounded-bl-md bg-card border border-border text-foreground px-4 py-3 text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 max-w-none font-serif [&_a.source-chip]:no-underline"
        }
      >
        {isUser ? msg.content : renderWithSourceCitations(msg.content)}
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
