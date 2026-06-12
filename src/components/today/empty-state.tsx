import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onDismiss: () => void;
};

/**
 * Calm welcome card shown on /today for users with zero journal entries.
 * Sits above the dashboard, full-bleed inside the page's max-width.
 */
export function TodayEmptyState({ onDismiss }: Props) {
  const { t } = useTranslation();
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-12 mb-10"
      aria-label={t("today.emptyHeading")}
      data-testid="fresh-empty-today"
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-primary, var(--primary))" }}
        aria-hidden
      />
      <p className="label-eyebrow text-muted-foreground relative">
        {t("today.emptyEyebrow")}
      </p>
      <h2 className="relative mt-4 font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight text-foreground max-w-[18ch]">
        {t("today.emptyHeading")}
      </h2>
      <p className="relative mt-5 body-serif text-foreground/75 max-w-[44ch]">
        {t("today.emptyBody")}
      </p>
      <div className="relative mt-8 flex flex-wrap items-center gap-3">
        <Button asChild size="lg" className="rounded-full h-12 px-6 text-base">
          <Link to="/journal/new">
            <PenLine className="h-4 w-4 mr-2" />
            {t("today.emptyCta")}
          </Link>
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {t("today.emptySkip")}
        </button>
      </div>
    </section>
  );
}