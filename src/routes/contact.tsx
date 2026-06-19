import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { supabase } from "@/integrations/supabase/client";
import { CalmHero } from "@/components/marketing/calm-scene";
import { contactImages } from "@/lib/calm-images/contact";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Say hello · Purple" },
      {
        name: "description",
        content:
          "A real person reads every message. Usually within a day. Questions, feedback, or just want to chat, we&rsquo;re here.",
      },
      { property: "og:title", content: "Say hello · Purple" },
      {
        property: "og:description",
        content: "A real person reads every message. Usually within a day.",
      },
      { property: "og:url", content: "https://www.purplelife.org/contact" },
    ],
    links: [{ rel: "canonical", href: "https://www.purplelife.org/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  useRevealOnScroll();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in name, email, and message.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 320),
      subject: subject.trim().slice(0, 200) || null,
      message: message.trim().slice(0, 5000),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send. Please try again.");
      return;
    }
    setSent(true);
    toast.success("Message sent. We'll be in touch.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <CalmHero
        image={contactImages.handwrittenNote}
        priority
        eyebrow="Contact"
        headline="Say hello."
        body="A real person reads every message. Usually within a day."
        variant="band"
      />
      <main className="mx-auto max-w-xl px-6 sm:px-10 py-16 sm:py-24">

        {sent ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <p className="font-serif text-xl">Thank you.</p>
            <p className="mt-2 text-sm text-muted-foreground">We&rsquo;ll get back to you at {email} as soon as we can.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} required className="mt-1.5 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={320} required className="mt-1.5 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className="mt-1.5 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} required rows={6} className="mt-1.5 rounded-xl" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl">
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}