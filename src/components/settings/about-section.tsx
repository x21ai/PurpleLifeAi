import { Link } from "@tanstack/react-router";
import { ChevronRight, ExternalLink, FileText, ShieldCheck, Github } from "lucide-react";
import { formatAppBuildLabel } from "@/lib/app-build-info";

export function AboutSection() {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
      <header className="p-5 sm:p-6 pb-3">
        <h2 className="font-serif text-xl text-foreground">About</h2>
      </header>
      <ul className="divide-y divide-border">
        <li>
          <Link
            to="/charter"
            className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-serif text-base text-foreground">Founding charter</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <Link
            to="/privacy"
            className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-serif text-base text-foreground">Privacy &amp; safety</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <a
            href="https://github.com/AstroAii/purpledrw"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
                <Github className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-serif text-base text-foreground">Open source on GitHub</span>
            </span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </a>
        </li>
      </ul>
      <p
        className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 text-center text-xs text-muted-foreground"
        data-testid="settings-about-version"
      >
        {formatAppBuildLabel()}
      </p>
    </section>
  );
}