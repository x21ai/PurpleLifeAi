import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/charter")({
  head: () => ({ meta: [{ title: "Founding charter — Purple" }] }),
  component: CharterPage,
});

function CharterPage() {
  useRouteTheme("light");
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-24">
      <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <p className="label-eyebrow text-muted-foreground mt-10">About</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        Founding<br/>charter.
      </h1>
      <p className="mt-8 body-serif text-foreground/75 max-w-[600px]">
        The promises Purple is built on. Coming soon — this page will hold the principles
        we won&rsquo;t compromise on: your data, your dignity, no ads, no dark patterns,
        open source forever.
      </p>
    </div>
  );
}