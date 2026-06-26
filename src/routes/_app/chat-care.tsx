import * as React from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Send, ChevronLeft, Users, MessageCircle, Loader2, Bell, BellOff, LogOut, MoreVertical, Plus, Paperclip, X, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listCareThreads,
  getCareMessages,
  sendCareMessage,
  markCareThreadRead,
  getOrCreateGroupThread,
  setCareThreadMute,
  leaveCareThread,
  getOrCreateDirectThread,
  getCareAttachmentUrl,
  listGroupThreads,
  createGroupThread,
} from "@/lib/care-chat.functions";
import { listMyCaregivers, listPeopleSharingWithMe } from "@/lib/care.functions";
import { userMessage } from "@/lib/user-message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const searchSchema = z.object({ thread: z.string().uuid().optional() });

export const Route = createFileRoute("/_app/chat-care")({
  head: () => ({ meta: [{ title: "Care chat · Purple" }] }),
  validateSearch: searchSchema,
  component: CareChatPage,
});

type ThreadSummary = {
  id: string;
  owner_id: string;
  kind: "direct" | "group";
  relationship_id: string | null;
  title: string | null;
  last_message_at: string;
  others: Array<{ user_id: string; name: string; role: string }>;
  last_message: { body: string; sender_id: string; created_at: string } | null;
  unread: number;
  muted: boolean;
};

type Attachment = {
  path: string;
  name: string;
  mime: string;
  size: number;
  kind: "image" | "file";
};

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachments: unknown;
  created_at: string;
  deleted_at: string | null;
};

function threadDisplayName(t: ThreadSummary, meId: string | undefined): string {
  if (t.kind === "group") return t.title ?? "Care team";
  const other = t.others.find((o) => o.user_id !== meId) ?? t.others[0];
  return other?.name ?? "Conversation";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return time;
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function parseAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is Attachment =>
      !!a &&
      typeof a === "object" &&
      typeof (a as Attachment).path === "string" &&
      typeof (a as Attachment).name === "string",
  );
}

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const ATTACHMENT_ACCEPT =
  "image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.pages,.numbers";

function AttachmentView({
  threadId,
  attachment,
  mine,
}: {
  threadId: string;
  attachment: Attachment;
  mine: boolean;
}) {
  const fetchUrl = useServerFn(getCareAttachmentUrl);
  const urlQ = useQuery({
    queryKey: ["care-chat", "attachment-url", attachment.path],
    queryFn: () => fetchUrl({ data: { threadId, path: attachment.path } }),
    staleTime: 4 * 60 * 1000,
  });
  const url = urlQ.data?.url;

  if (attachment.kind === "image") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl border border-border/60 max-w-[260px]"
        aria-label={attachment.name}
      >
        {url ? (
          <img
            src={url}
            alt={attachment.name}
            loading="lazy"
            className="h-auto w-full max-h-[300px] object-cover"
          />
        ) : (
          <div className="grid aspect-square w-[200px] place-items-center bg-secondary/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 max-w-[260px] transition-colors",
        mine
          ? "border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/15"
          : "border-border bg-background hover:bg-secondary/60",
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs">{attachment.name}</span>
      <span className="text-[10px] opacity-70">
        {(attachment.size / 1024 / 1024).toFixed(2)} MB
      </span>
      {url && <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />}
    </a>
  );
}

function NewChatPicker({ onPicked }: { onPicked: (threadId: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const fetchMine = useServerFn(listMyCaregivers);
  const fetchShared = useServerFn(listPeopleSharingWithMe);
  const openDirect = useServerFn(getOrCreateDirectThread);
  const mine = useQuery({
    queryKey: ["care", "mine"],
    queryFn: () => fetchMine(),
    enabled: open,
  });
  const shared = useQuery({
    queryKey: ["care", "shared-with-me"],
    queryFn: () => fetchShared(),
    enabled: open,
  });

  const handlePick = async (relationshipId: string) => {
    if (busy) return;
    setBusy(relationshipId);
    try {
      const r = await openDirect({ data: { relationshipId } });
      onPicked(r.threadId);
      setOpen(false);
    } catch (e) {
      toast.error(userMessage(e, "Couldn't open chat"));
    } finally {
      setBusy(null);
    }
  };

  const mineList = (mine.data?.relationships ?? []).filter(
    (r) => r.status === "active" && r.caregiver_id,
  );
  const sharedList = (shared.data?.relationships ?? []).filter(
    (r) => r.status === "active",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" title="Start a new chat">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
        </DialogHeader>
        {mine.isLoading || shared.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : mineList.length === 0 && sharedList.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No active care relationships yet. Invite someone from Settings → Sharing.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {mineList.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => void handlePick(r.id)}
                  disabled={busy === r.id}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-secondary/40 px-2 rounded-lg"
                >
                  <span className="text-sm text-foreground truncate">{r.invite_email}</span>
                  {busy === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </li>
            ))}
            {sharedList.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => void handlePick(r.id)}
                  disabled={busy === r.id}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-secondary/40 px-2 rounded-lg"
                >
                  <span className="text-sm text-foreground truncate">
                    Person sharing with you
                  </span>
                  {busy === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CareChatPage() {
  // placeholder anchor
  useRouteTheme("light");
  const { session } = useAuth();
  const meId = session?.user.id;
  const navigate = useNavigate({ from: "/chat-care" });
  const search = useSearch({ from: "/_app/chat-care" });
  const qc = useQueryClient();

  const listFn = useServerFn(listCareThreads);
  const threadsQ = useQuery({
    queryKey: ["care-chat", "threads"],
    queryFn: () => listFn(),
    refetchInterval: 15_000,
  });

  const threads = (threadsQ.data?.threads ?? []) as ThreadSummary[];
  const activeId = search.thread ?? threads[0]?.id;
  const activeThread = threads.find((t) => t.id === activeId);

  const setActive = (id: string) => {
    void navigate({ search: { thread: id } });
  };

  const showList = !activeId; // mobile: list-only when no thread selected

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl flex-col px-0 md:px-4 md:py-4">
      <div className="flex flex-1 overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card md:shadow-sm">
        {/* Sidebar / list */}
        <aside
          className={cn(
            "w-full md:w-80 md:shrink-0 md:border-r md:border-border flex flex-col",
            !showList && "hidden md:flex",
          )}
        >
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <h1 className="text-base font-semibold">Care chat</h1>
            <div className="flex items-center gap-1">
              <NewChatPicker onPicked={setActive} />
              <GroupPicker onPicked={setActive} />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            {threadsQ.isLoading && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!threadsQ.isLoading && threads.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-40" />
                No conversations yet.
                <p className="mt-2 text-xs">
                  Open a chat from a caregiver card in Settings → Sharing, or
                  from a person on the Caregiver page.
                </p>
              </div>
            )}
            <ul>
              {threads.map((t) => {
                const isActive = t.id === activeId;
                const name = threadDisplayName(t, meId);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setActive(t.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors border-l-2",
                        isActive
                          ? "bg-secondary/60 border-l-primary"
                          : "border-l-transparent hover:bg-secondary/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {t.kind === "group" && (
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="truncate text-sm font-medium">
                              {name}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {t.last_message
                              ? (t.last_message.sender_id === meId ? "You: " : "") +
                                t.last_message.body
                              : "No messages yet"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(t.last_message_at)}
                          </span>
                          {t.unread > 0 && (
                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
                              {t.unread > 99 ? "99+" : t.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Conversation panel */}
        <section
          className={cn(
            "flex flex-1 flex-col bg-background",
            showList && "hidden md:flex",
          )}
        >
          {activeThread ? (
            <ConversationPanel
              thread={activeThread}
              meId={meId}
              onBack={() => navigate({ search: {} })}
            />
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConversationPanel({
  thread,
  meId,
  onBack,
}: {
  thread: ThreadSummary;
  meId: string | undefined;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const messagesFn = useServerFn(getCareMessages);
  const sendFn = useServerFn(sendCareMessage);
  const markReadFn = useServerFn(markCareThreadRead);
  const muteFn = useServerFn(setCareThreadMute);
  const leaveFn = useServerFn(leaveCareThread);
  const navigate = useNavigate({ from: "/chat-care" });
  const isOwner = thread.owner_id === meId;

  const handleMute = async () => {
    try {
      const r = await muteFn({ data: { threadId: thread.id, muted: !thread.muted } });
      toast.success(r.muted ? "Muted" : "Unmuted");
      void qc.invalidateQueries({ queryKey: ["care-chat", "threads"] });
    } catch (e) {
      toast.error(userMessage(e, "That change didn't save. Try again in a moment."));
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave this chat? You can be re-added later by the chat owner.")) return;
    try {
      await leaveFn({ data: { threadId: thread.id } });
      toast.success("You left the chat");
      void qc.invalidateQueries({ queryKey: ["care-chat", "threads"] });
      void navigate({ search: {} });
    } catch (e) {
      toast.error(userMessage(e, "Couldn't leave"));
    }
  };

  const msgsQ = useQuery({
    queryKey: ["care-chat", "messages", thread.id],
    queryFn: () => messagesFn({ data: { threadId: thread.id } }),
    refetchOnWindowFocus: false,
  });

  const [messages, setMessages] = React.useState<Message[]>([]);
  React.useEffect(() => {
    if (msgsQ.data?.messages) setMessages(msgsQ.data.messages as Message[]);
  }, [msgsQ.data]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  // Mark read on open + when new messages arrive
  React.useEffect(() => {
    void markReadFn({ data: { threadId: thread.id } }).then(() => {
      void qc.invalidateQueries({ queryKey: ["care-chat", "threads"] });
      void qc.invalidateQueries({ queryKey: ["care", "owners-switcher"] });
    });
  }, [thread.id, messages.length, markReadFn, qc]);

  // Realtime subscription
  React.useEffect(() => {
    const channel = supabase
      .channel(`care-thread-${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "care_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [thread.id]);

  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [pending, setPending] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addPending = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const tooBig = arr.filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    const ok = arr.filter((f) => f.size <= MAX_ATTACHMENT_BYTES);
    if (tooBig.length > 0) {
      toast.error(`${tooBig.length} file(s) skipped, over 15 MB`);
    }
    setPending((prev) => [...prev, ...ok].slice(0, 10));
  };

  const handleSend = async () => {
    const body = input.trim();
    if (sending) return;
    if (!body && pending.length === 0) return;
    setSending(true);
    const filesToSend = pending;
    setInput("");
    setPending([]);
    try {
      // Upload files first.
      const uploaded: Attachment[] = [];
      for (const f of filesToSend) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${thread.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("care-chat-attachments")
          .upload(path, f, {
            contentType: f.type || "application/octet-stream",
            upsert: false,
          });
        if (upErr) throw upErr;
        uploaded.push({
          path,
          name: f.name,
          mime: f.type || "application/octet-stream",
          size: f.size,
          kind: (f.type || "").startsWith("image/") ? "image" : "file",
        });
      }

      const r = await sendFn({
        data: {
          threadId: thread.id,
          body,
          attachments: uploaded.length > 0 ? uploaded : undefined,
        },
      });
      setMessages((prev) =>
        prev.some((x) => x.id === r.message.id)
          ? prev
          : [...prev, r.message as Message],
      );
      void qc.invalidateQueries({ queryKey: ["care-chat", "threads"] });
    } catch (e) {
      toast.error(userMessage(e, "Couldn't send"));
      setInput(body);
      setPending(filesToSend);
    } finally {
      setSending(false);
    }
  };

  const displayName = threadDisplayName(thread, meId);

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border px-3 py-3 md:px-4">
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden h-8 w-8"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{displayName}</h2>
          {thread.kind === "group" && (
            <p className="truncate text-xs text-muted-foreground">
              {thread.others.length + 1} people
            </p>
          )}
        </div>
        {thread.muted && (
          <BellOff className="h-4 w-4 text-muted-foreground" aria-label="Muted" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Chat options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void handleMute()}>
              {thread.muted ? (
                <><Bell className="h-4 w-4 mr-2" /> Unmute notifications</>
              ) : (
                <><BellOff className="h-4 w-4 mr-2" /> Mute notifications</>
              )}
            </DropdownMenuItem>
            {!isOwner && (
              <DropdownMenuItem
                onSelect={() => void handleLeave()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Leave chat
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
        {msgsQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        <ul className="space-y-2">
          {messages.map((m, idx) => {
            const mine = m.sender_id === meId;
            const senderName = thread.others.find((o) => o.user_id === m.sender_id)?.name;
            const attachments = parseAttachments(m.attachments);
            const prev = idx > 0 ? messages[idx - 1] : null;
            const showDaySep =
              !prev ||
              new Date(prev.created_at).toDateString() !==
                new Date(m.created_at).toDateString();
            return (
              <React.Fragment key={m.id}>
                {showDaySep && (
                  <li className="flex justify-center pt-3 pb-1">
                    <span className="rounded-full bg-secondary/60 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {dayLabel(m.created_at)}
                    </span>
                  </li>
                )}
                <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words space-y-2",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md",
                    )}
                  >
                    {!mine && thread.kind === "group" && senderName && (
                      <div className="text-[11px] font-medium opacity-70">
                        {senderName}
                      </div>
                    )}
                    {m.deleted_at ? (
                      <em className="opacity-60">Message deleted</em>
                    ) : (
                      <>
                        {attachments.length > 0 && (
                          <div className="space-y-1.5">
                            {attachments.map((a) => (
                              <AttachmentView
                                key={a.path}
                                threadId={thread.id}
                                attachment={a}
                                mine={mine}
                              />
                            ))}
                          </div>
                        )}
                        {m.body && <div>{m.body}</div>}
                      </>
                    )}
                    <div
                      className={cn(
                        "text-[10px] tabular-nums",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatMessageTime(m.created_at)}
                    </div>
                  </div>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </div>

      <footer className="border-t border-border bg-card/40 p-3 md:p-4">
        {pending.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {pending.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs"
              >
                {f.type.startsWith("image/") ? (
                  <span className="h-3.5 w-3.5 rounded bg-secondary" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="max-w-[160px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPending((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex items-end gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              addPending(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label="Attach files"
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder="Message"
            className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!input.trim() && pending.length === 0) || sending}
            className="h-10 w-10 rounded-full shrink-0"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </footer>
    </>
  );
}