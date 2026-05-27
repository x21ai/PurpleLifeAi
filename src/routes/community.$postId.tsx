import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { Heart, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/community/$postId")({
  component: PostDetail,
});

type Post = { id: string; user_id: string; title: string; body: string; topic: string; created_at: string };
type Comment = { id: string; user_id: string; body: string; created_at: string };

function PostDetail() {
  const { postId } = Route.useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = React.useState<Post | null>(null);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [likes, setLikes] = React.useState(0);
  const [liked, setLiked] = React.useState(false);
  const [body, setBody] = React.useState("");

  const load = React.useCallback(async () => {
    const [{ data: p }, { data: c }, { data: r }] = await Promise.all([
      supabase.from("community_posts").select("id, user_id, title, body, topic, created_at").eq("id", postId).eq("hidden", false).maybeSingle(),
      supabase.from("community_comments").select("id, user_id, body, created_at").eq("post_id", postId).eq("hidden", false).order("created_at"),
      supabase.from("community_reactions").select("user_id").eq("post_id", postId).eq("kind", "like"),
    ]);
    setPost((p ?? null) as Post | null);
    setComments((c ?? []) as Comment[]);
    setLikes(r?.length ?? 0);
    setLiked(!!(session?.user.id && r?.some((x) => x.user_id === session.user.id)));
  }, [postId, session?.user.id]);

  React.useEffect(() => { void load(); }, [load]);

  const toggleLike = async () => {
    if (!session?.user.id) return navigate({ to: "/sign-in" });
    if (liked) {
      await supabase.from("community_reactions").delete().eq("post_id", postId).eq("user_id", session.user.id).eq("kind", "like");
    } else {
      await supabase.from("community_reactions").insert({ post_id: postId, user_id: session.user.id, kind: "like" });
    }
    await load();
  };

  const comment = async () => {
    if (!session?.user.id) return navigate({ to: "/sign-in" });
    if (!body.trim()) return;
    const { error } = await supabase.from("community_comments").insert({ post_id: postId, user_id: session.user.id, body: body.trim() });
    if (error) return toast.error(error.message);
    setBody("");
    await load();
  };

  const report = async () => {
    if (!session?.user.id) return navigate({ to: "/sign-in" });
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    await supabase.from("community_reports").insert({ reporter_id: session.user.id, post_id: postId, reason });
    toast.success("Reported. Thanks for keeping the community safe.");
  };

  if (!post) return <div className="p-10 text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link to="/community" className="text-sm text-foreground/70 hover:text-foreground">← Community</Link>
          <Link to="/" className="font-serif text-xl">Purple</Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 sm:px-8 pt-10 pb-24">
        <div className="text-xs text-muted-foreground capitalize">{post.topic} · {new Date(post.created_at).toLocaleDateString()}</div>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl leading-[1.05]">{post.title}</h1>
        <p className="mt-6 body-serif whitespace-pre-wrap text-foreground/85">{post.body}</p>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={toggleLike}
            className={`inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm ${liked ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-secondary"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
          </button>
          <button onClick={report} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary text-muted-foreground">
            <Flag className="h-4 w-4" /> Report
          </button>
        </div>

        <h2 className="mt-12 font-serif text-2xl">Discussion</h2>
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </ul>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={session ? "Add to the discussion…" : "Sign in to comment"}
            disabled={!session}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="mt-2 flex justify-end">
            <button onClick={comment} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm">
              Post
            </button>
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Community posts are not medical advice. Always consult your care team for medical decisions.
        </p>
      </article>
    </div>
  );
}