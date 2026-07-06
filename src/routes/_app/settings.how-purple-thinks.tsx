import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, Brain, Lock, Sparkles } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/settings/how-purple-thinks")({
  head: () => ({ meta: [{ title: "How Purple thinks · Purple" }] }),
  component: HowPage,
});

function HowPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-10 pt-10 sm:pt-16 pb-24">
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("howPurple.back")}
      </Link>

      <p className="mt-6 label-eyebrow text-muted-foreground">{t("howPurple.eyebrow")}</p>
      <h1 className="mt-3 app-hero-title text-[28px] sm:text-[36px] text-foreground">
        {t("howPurple.title1")}<br />{t("howPurple.title2")}
      </h1>

      <div className="mt-10 space-y-6">
        <Card icon={<Eye className="h-4 w-4" />} title={t("howPurple.seesTitle")}>
          {t("howPurple.seesBody")}
        </Card>
        <Card icon={<Brain className="h-4 w-4" />} title={t("howPurple.patternsTitle")}>
          {t("howPurple.patternsBody")}
          <Link to="/insights" className="underline ml-1">{t("howPurple.patternsLink")}</Link>.
        </Card>
        <Card icon={<Sparkles className="h-4 w-4" />} title={t("howPurple.actionTitle")}>
          {t("howPurple.actionBody")}
        </Card>
        <Card icon={<Lock className="h-4 w-4" />} title={t("howPurple.privateTitle")}>
          {t("howPurple.privateBody")} <Link to="/settings" className="underline">{t("howPurple.privateLink")}</Link>.
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <p className="mt-2 body-serif text-foreground/80 leading-relaxed">{children}</p>
    </section>
  );
}