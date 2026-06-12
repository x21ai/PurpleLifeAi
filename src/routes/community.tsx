import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { PenSquare, Heart, MessageCircle } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CalmHero, HumanMoment } from "@/components/marketing/calm-scene";
import { communityImages } from "@/lib/calm-images";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { PlatformFlagGate } from "@/lib/platform-flags";

function GatedCommunityFeed() {
  return (
    <PlatformFlagGate flag="community" redirectTo="/">
      <CommunityFeed />
    </PlatformFlagGate>
  );
}

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community. Purple." },
      {
        name: "description",
        content:
          "A quiet, moderated space for people living with conditions that need daily attention, and the people who help them carry it.",
      },
      { property: "og:title", content: "Community. Purple." },
      {
        property: "og:description",
        content: "Share what's working. Ask what isn't. You're not alone.",
      },
      { property: "og:url", content: "https://www.purplelife.org/community" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/community" }],
  }),
  component: GatedCommunityFeed,
});

type Post = {
  id: string;
  title: string;
  body: string;
  topic: string;
  created_at: string;
  pinned: boolean;
  likes?: number;
  comments?: number;
};

function CommunityFeed() {
  useRevealOnScroll();
  const { session } = useAuth();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [topic, setTopic] = React.useState<string>("all");
  const topics = ["all", "general", "wins", "questions", "vent", "tips"];

  React.useEffect(() => {
    (async () => {
      let q = supabase
        .from("community_posts")
        .select("id, title, body, topic, created_at, pinned")
        .eq("hidden", false)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (topic !== "all") q = q.eq("topic", topic);
      const { data } = await q;
      const base = (data ?? []) as Post[];
      if (base.length === 0) {
        setPosts(base);
        return;
      }
      const ids = base.map((p) => p.id);
      const [{ data: reacts }, { data: cmts }] = await Promise.all([
        supabase
          .from("community_reactions")
          .select("post_id")
          .in("post_id", ids)
          .eq("kind", "like"),
        supabase
          .from("community_comments")
          .select("post_id")
          .in("post_id", ids)
          .eq("hidden", false),
      ]);
      const likeCount = new Map<string, number>();
      for (const r of reacts ?? [])
        likeCount.set(r.post_id as string, (likeCount.get(r.post_id as string) ?? 0) + 1);
      const cmtCount = new Map<string, number>();
      for (const c of cmts ?? [])
        cmtCount.set(c.post_id as string, (cmtCount.get(c.post_id as string) ?? 0) + 1);
      setPosts(
        base.map((p) => ({
          ...p,
          likes: likeCount.get(p.id) ?? 0,
          comments: cmtCount.get(p.id) ?? 0,
        })),
      );
    })();
  }, [topic]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MarketingHeader />

      {/* Calm hero, same vocabulary as the rest of marketing */}
      <CalmHero
        image={communityImages.hero}
        priority
        eyebrow="Community"
        headline={
          <>
            You&rsquo;re
            <br />
            not alone.
          </>
        }
        body="A quiet, moderated space to share what's working and ask what isn't. Not medical advice, always check with your care team."
        variant="full"
      />

      {/* Feed */}
      <section className="mx-auto max-w-3xl px-5 sm:px-8 pt-20 pb-24">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 overflow-x-auto">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`rounded-full px-3 py-1 text-xs capitalize whitespace-nowrap ${
                  topic === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Link
            to={session ? "/community-new" : "/sign-in"}
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm"
          >
            <PenSquare className="h-4 w-4" /> New post
          </Link>
        </div>

        <ul className="mt-8 space-y-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                to="/community/$postId"
                params={{ postId: p.id }}
                className="block rounded-2xl border border-border bg-card p-5 hover:bg-secondary/30 transition"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{p.topic}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="mt-2 font-serif text-xl">{p.title}</h3>
                <p className="mt-2 text-sm text-foreground/75 line-clamp-2">{p.body}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {p.likes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {p.comments ?? 0}
                  </span>
                </div>
              </Link>
            </li>
          ))}
          {posts.length === 0 && (
            <p className="text-muted-foreground">No posts yet. Be the first to share.</p>
          )}
        </ul>
      </section>

      {/* A human moment to close the page */}
      <HumanMoment
        image={communityImages.walkingPath}
        quote="The people who get it are already here."
        attribution="Why community matters"
      />

      <SiteFooter />
    </div>
  );
}
