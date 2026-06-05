import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { PenSquare, Heart, MessageCircle } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CalmHero, HumanMoment } from "@/components/marketing/calm-scene";
import { calmImages, humanImages } from "@/lib/calm-images";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community. Purple." },
      {
        name: "description",
        content:
          "A quiet, moderated space for people living with conditions that need daily attention — and the people who help them carry it.",
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
  component: CommunityFeed,
});

type Post = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  topic: string;
  created_at: string;
  pinned: boolean;
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
        .select("id, user_id, title, body, topic, created_at, pinned")
        .eq("hidden", false)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (topic !== "all") q = q.eq("topic", topic);
      const { data } = await q;
      setPosts((data ?? []) as Post[]);
    })();
  }, [topic]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MarketingHeader />

      {/* Calm hero — same vocabulary as the rest of marketing */}
      <CalmHero
        image={calmImages.coast}
        alt=""
        eyebrow="Community"
        headline={<>You&rsquo;re<br />not alone.</>}
        body="A quiet, moderated space to share what's working and ask what isn't. Not medical advice — always check with your care team."
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
                  topic === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
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
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Like</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Discuss</span>
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
        image={humanImages.walkGrass}
        alt="A person walking through tall grass at golden hour, seen from behind."
        quote="The people who get it are already here."
        attribution="Why community matters"
      />

      <SiteFooter variant="marketing" />
    </div>
  );
}