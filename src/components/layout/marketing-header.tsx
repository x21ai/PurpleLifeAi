import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-context";
import { ProfileMenu } from "@/components/layout/profile-menu";

export function MarketingHeader() {
  const { session } = useAuth();
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="wordmark text-[14px] text-foreground" aria-label="Purple home">
          Purple
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/community" className="hover:text-foreground transition-colors">Community</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/today">Open app</Link>
              </Button>
              <ProfileMenu />
            </>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Sign in
              </Link>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}