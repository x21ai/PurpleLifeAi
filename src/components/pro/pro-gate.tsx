import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useIsPro, type ProFeature } from "@/lib/pro-gate";

interface ProGateProps {
  feature: ProFeature;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  /** "card" (default) renders a full upgrade card. "inline" renders a compact pill that fits inside toolbars/composers. */
  variant?: "card" | "inline";
}

const COPY: Record<ProFeature, { title: string; body: string }> = {
  dna: {
    title: "DNA insights are a Pro feature",
    body: "Upload raw genotype files and see a small, curated read of variants tied to traits Purple already tracks.",
  },
  ask_unlimited: {
    title: "Unlimited Ask Purple",
    body: "Pro removes the daily message limit. Free includes 10 messages a day.",
  },
  report_sharing: {
    title: "Sharing & scheduled reports are a Pro feature",
    body: "Share medical reports with a clinician or family member, and schedule recurring sends.",
  },
  caregiver_seats: {
    title: "More caregivers are a Pro feature",
    body: "Free includes one active caregiver. Pro lets you add as many as you need.",
  },
};

export function ProGate({ feature, children, fallback, variant = "card" }: ProGateProps) {
  const { isPro, loading } = useIsPro();
  if (loading) return null;
  if (isPro) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  const c = COPY[feature];
  if (variant === "inline") {
    return (
      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--purple-primary)]/40 bg-[color:var(--purple-primary)]/10 px-3 py-1.5 text-[12px] font-medium text-[color:var(--purple-primary)] hover:bg-[color:var(--purple-primary)]/15 transition"
        title={c.body}
      >
        <Sparkles className="h-3 w-3" /> Pro · {c.title.replace(/ is a Pro feature$/, "")}
      </Link>
    );
  }
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--purple-primary)]/15 px-3 py-1 text-[11px] uppercase tracking-wider text-[color:var(--purple-primary)]">
        <Sparkles className="h-3 w-3" /> Purple Pro
      </div>
      <h3 className="mt-4 font-serif text-2xl tracking-[-0.01em]">{c.title}</h3>
      <p className="mt-2 text-sm text-foreground/70 max-w-prose">{c.body}</p>
      <Link
        to="/account"
        className="mt-5 inline-flex items-center justify-center rounded-full bg-[color:var(--purple-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
