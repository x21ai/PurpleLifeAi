import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Marketing and web-only routes that should not appear in the native app shell. */
const NATIVE_BLOCKED_PREFIXES = [
  "/features",
  "/pricing",
  "/about",
  "/charter",
  "/research",
  "/epilepsy",
  "/apple-health-import",
  "/community",
  "/trust",
  "/contact",
] as const;

const NATIVE_IN_APP_REDIRECTS: Record<string, string> = {
  "/": "/today",
  "/tools": "/settings/sharing",
  "/privacy": "/settings/privacy",
  "/terms": "/settings/terms",
};

function isBlockedNativePath(pathname: string): boolean {
  return NATIVE_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Keeps native users inside the app experience: no marketing pages, no web import flows.
 */
function nativePathNeedsRedirect(pathname: string): boolean {
  return pathname in NATIVE_IN_APP_REDIRECTS || isBlockedNativePath(pathname);
}

export function NativeRouteGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const needsRedirect = nativePathNeedsRedirect(pathname);
  const [allowRender, setAllowRender] = useState(!needsRedirect);

  useEffect(() => {
    if (!needsRedirect) {
      setAllowRender(true);
      return;
    }

    setAllowRender(false);
    const inApp = NATIVE_IN_APP_REDIRECTS[pathname];
    if (inApp) {
      void navigate({ to: inApp as never, replace: true });
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      navigate({ to: (data.session ? "/today" : "/sign-in") as never, replace: true });
    });
  }, [pathname, navigate, needsRedirect]);

  if (!allowRender) return null;

  return <>{children}</>;
}
