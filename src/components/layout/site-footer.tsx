import { Link } from "@tanstack/react-router";

export function SiteFooter({ variant = "app" }: { variant?: "app" | "marketing" }) {
  const year = new Date().getFullYear();
  return (
    <footer
      data-testid="site-footer"
      className={
        "hidden lg:block border-t border-border bg-background/60 " +
        (variant === "app" ? "mt-12" : "mt-0")
      }
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Legal">
          <Link to="/community" className="hover:text-foreground transition-colors">Community</Link>
          <Link to="/charter" className="hover:text-foreground transition-colors">Charter</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          <a
            href="https://github.com/lovable-dev/purple"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
        <p className="text-xs">© {year} Purple · Free forever. Your data stays yours.</p>
      </div>
    </footer>
  );
}