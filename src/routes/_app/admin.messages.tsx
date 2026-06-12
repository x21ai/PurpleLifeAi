import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";

export const Route = createFileRoute("/_app/admin/messages")({
  head: () => ({ meta: [{ title: "Admin messages · Purple" }] }),
  component: AdminMessages,
});

type Msg = {
  id: string;
  subject: string;
  body: string;
  is_broadcast: boolean;
  created_at: string;
  recipient_id: string | null;
};

function AdminMessages() {
  const { session } = useAuth();
  const [list, setList] = React.useState<Msg[]>([]);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [recipient, setRecipient] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("admin_messages")
      .select("id, subject, body, is_broadcast, created_at, recipient_id")
      .order("created_at", { ascending: false })
      .limit(100);
    setList((data ?? []) as Msg[]);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!subject.trim() || !body.trim() || !session?.user.id) return;
    setSending(true);
    const { error } = await supabase.from("admin_messages").insert({
      sender_id: session.user.id,
      subject: subject.trim(),
      body: body.trim(),
      is_broadcast: !recipient.trim(),
      recipient_id: recipient.trim() || null,
    });
    setSending(false);
    if (error) return toast.error(userMessage(error, "That didn't work. Try again in a moment."));
    toast.success(recipient ? "Message sent" : "Broadcast sent");
    setSubject("");
    setBody("");
    setRecipient("");
    void load();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl">Messages</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-xl border border-border bg-background px-4 py-2"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Message body"
          className="w-full rounded-xl border border-border bg-background px-4 py-2"
        />
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Recipient user id (leave blank to broadcast)"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 font-mono text-sm"
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-full bg-primary text-primary-foreground px-5 py-2 disabled:opacity-60"
        >
          {recipient.trim() ? "Send" : "Broadcast"}
        </button>
      </div>

      <h2 className="mt-10 font-serif text-2xl">Recent</h2>
      <ul className="mt-4 space-y-3">
        {list.map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{m.is_broadcast ? "Broadcast" : `To ${m.recipient_id?.slice(0, 8)}…`}</span>
              <span>{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 font-serif text-lg">{m.subject}</p>
            <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
