import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PlatformFlagGate } from "@/lib/platform-flags";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/community-new")({
  head: () => ({ meta: [{ title: "New post, Community" }] }),
  component: GatedNewPost,
});

function GatedNewPost() {
  return (
    <PlatformFlagGate flag="community" redirectTo="/today">
      <NewPost />
    </PlatformFlagGate>
  );
}

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
    if (error) return toast.error(userMessage(error, "That didn't work. Try again in a moment."));
    navigate({ to: "/community/$postId", params: { postId: data.id } });
  };

  return (
    <div
      className="mx-auto max-w-2xl px-5 sm:px-8 pt-8 sm:pt-12 pb-32"
      style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
    >
      <Link to="/community" className="text-sm text-foreground/70 hover:text-foreground">
        ← Community
      </Link>
      <h1 className="mt-3 font-serif text-4xl">New post</h1>
      <p className="mt-2 text-muted-foreground">
        Be kind. No medical advice. Don't share other people's info.
      </p>
      <div className="mt-8 space-y-3">
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="w-[200px] rounded-xl border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["general", "wins", "questions", "vent", "tips"].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <button
          onClick={submit}
          disabled={posting}
          className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground px-5 py-3 disabled:opacity-60"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
