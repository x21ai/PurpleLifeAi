import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How have I been sleeping this week?",
  "Did anything unusual happen yesterday?",
  "What patterns do you see before my events?",
  "What did I say about my medications last month?",
];

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Ask — Purple" }] }),
  component: AskPage,
});

function AskPage() {
  useRouteTheme("light");
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
    const history = messages;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-orchestrator", {
        body: { action: "chat", message: trimmed, history },
      });
      if (error) throw error;
      const reply = (data as { reply?: string })?.reply || "I couldn't put together an answer just now.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach Purple just now. Try again in a moment.");
      setMessages(next);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
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
          <p className="label-eyebrow text-muted-foreground">Ask</p>
          <h1 className="mt-2 font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
            I know your<br/>patterns.
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
                <Bubble key={i} msg={m} />
              ))}
              {thinking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>thinking…</span>
                </div>
              )}
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
        Ask me anything about your sleep, your medication, your symptoms, your patterns, or your care.
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

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            : "max-w-[90%] rounded-2xl rounded-bl-md bg-card border border-border text-foreground px-4 py-3 text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 max-w-none font-serif"
        }
      >
        {isUser ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
      </div>
    </div>
  );
}