import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/charter")({
  head: () => ({ meta: [{ title: "Founding charter — Purple" }] }),
  component: CharterPage,
});

function CharterPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-10 sm:pt-16 pb-12">
      <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <h1 className="mt-6 font-serif text-4xl sm:text-5xl leading-tight text-foreground">
        Founding charter
      </h1>
      <p className="mt-6 text-base sm:text-lg text-muted-foreground">
        The promises Purple is built on. Coming soon — this page will hold the principles
        we won&rsquo;t compromise on: your data, your dignity, no ads, no dark patterns,
        open source forever.
      </p>
    </div>
  );
}