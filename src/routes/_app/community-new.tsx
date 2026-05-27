import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/community-new")({
  head: () => ({ meta: [{ title: "New post — Community" }] }),
  component: NewPost,
});

function NewPost() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [topic, setTopic] = React.useState("general");
  const [posting, setPosting] = React.useState(false);

  const submit = async () => {
    if (!session?.user.id) return;
    if (!title.trim() || !body.trim()) return toast.error("Please add a title and body.");
    setPosting(true);
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ user_id: session.user.id, title: title.trim(), body: body.trim(), topic })
      .select("id")
      .single();
    setPosting(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/community/$postId", params: { postId: data.id } });
  };

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-12 pb-24">
      <h1 className="font-serif text-4xl">New post</h1>
      <p className="mt-2 text-muted-foreground">Be kind. No medical advice. Don't share other people's info.</p>
      <div className="mt-8 space-y-3">
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
          {["general","wins","questions","vent","tips"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 font-serif text-lg"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Share what's on your mind…"
          className="w-full rounded-xl border border-border bg-card px-4 py-3"
        />
        <button onClick={submit} disabled={posting} className="rounded-full bg-primary text-primary-foreground px-5 py-2 disabled:opacity-60">
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}