import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/integrations/supabase/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ensureServiceWorker, rearmMedicationNotifications } from "@/lib/med-notifications";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme-provider";
import { useOuraDailyAutoSync } from "@/hooks/use-oura-daily-autosync";
import "@/i18n";
import { hydrateLocale } from "@/i18n";

function NotFoundComponent() {
  // Compatibility: the internal `_app` segment is a TanStack route-group,
  // not a public URL. Old links to `/_app/admin/...` 404, strip the prefix
  // and forward to the real route before showing the 404 screen.
  if (typeof window !== "undefined") {
    const { pathname, search, hash } = window.location;
    if (pathname.startsWith("/_app/") || pathname === "/_app") {
      const target = pathname.replace(/^\/_app/, "") || "/";
      // Defer to avoid breaking hydration; return a tiny placeholder element
      // so the hydrated tree matches the SSR-rendered NotFound shell shape.
      if (typeof queueMicrotask !== "undefined") {
        queueMicrotask(() => window.location.replace(target + search + hash));
      } else {
        setTimeout(() => window.location.replace(target + search + hash), 0);
      }
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Redirecting…
        </div>
      );
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  const recover = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map((reg) => reg.unregister()));
      }
      if (typeof caches !== "undefined") {
        await Promise.allSettled(["purple-shell-v2", "purple-shell-v3"].map((name) => caches.delete(name)));
      }
    } catch {
      // Best-effort recovery only.
    }
    router.invalidate();
    reset();
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => void recover()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Purple - Lets be calm" },
      {
        name: "description",
        content:
          "Purple is an open-source, AI-powered health journal for people managing epilepsy and other pattern-driven conditions. Write, speak, snap · Purple remembers.",
      },
      { name: "theme-color", content: "#5B2C82" },
      { name: "author", content: "Devyn Walker" },
      { property: "og:title", content: "Purple - Lets be calm" },
      {
        property: "og:description",
        content:
          "Open-source health intelligence for epilepsy and pattern-driven conditions. Free forever. No ads.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Purple" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Purple - Lets be calm" },
      {
        name: "twitter:description",
        content:
          "Open-source health intelligence for epilepsy and pattern-driven conditions. Free forever. No ads.",
      },
      { property: "og:image", content: "https://www.purplelife.org/og-cover.jpg" },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "Purple, a quiet companion for your health" },
      { name: "twitter:image", content: "https://www.purplelife.org/og-cover.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {/* Non-blocking Google Fonts: inject as print stylesheet, swap to all on load.
            Trimmed to weights actually used: Inter 400/500/600/700, Source Serif 4 400/500/600 + italic 400. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var h='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap';var l=document.createElement('link');l.rel='stylesheet';l.href=h;l.media='print';l.onload=function(){this.media='all'};document.head.appendChild(l);})();",
          }}
        />
        <noscript>
          {`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap" />`}
        </noscript>
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Fire a background Oura sync once per session if the data is > 20h old.
  useOuraDailyAutoSync();

  // Resolve navigator → saved → default *after* hydration so the SSR markup
  // (always rendered in the default locale) matches the first client render.
  useEffect(() => {
    hydrateLocale();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Re-running route guards on TOKEN_REFRESHED caused brief null sessions and sign-in redirects.
      if (event === "TOKEN_REFRESHED") return;
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  // Register the service worker for medication reminders only. The helper
  // refuses registration in preview/iframe/dev and clears stale app-shell caches.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    void ensureServiceWorker();
    // Repopulate the SW's IndexedDB schedule after every reload so dose
    // reminders survive page refreshes / app restarts.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      void rearmMedicationNotifications();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
          <InstallPrompt />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
