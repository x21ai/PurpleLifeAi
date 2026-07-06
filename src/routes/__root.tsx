import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { AppCrashFallback } from "@/components/error/app-crash-fallback";
import { GlobalErrorBoundary } from "@/components/error/global-error-boundary";
import { NativeDiagnosticsPanel } from "@/components/error/native-diagnostics-panel";
import { AuthProvider } from "@/integrations/supabase/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme-provider";
import { NativeAppProvider } from "@/lib/native-app-context";
import { NativeAppBootstrap } from "@/components/native/native-app-bootstrap";
import {
  captureClientError,
  installGlobalErrorCapture,
  requestDiagnosticsPanelOpen,
} from "@/lib/observability/client-errors";
import "@/i18n";
import { hydrateLocale } from "@/i18n";
import { isNativeApp } from "@/lib/native/capacitor";

// Loaded after the browser goes idle so service worker registration and the
// Oura auto-sync never compete with first paint (and stay out of the entry chunk).
const DeferredStartup = lazy(() => import("@/components/common/deferred-startup"));

function dismissPurpleSplash() {
  const splash = document.getElementById("purple-splash");
  if (!splash) return;
  splash.style.pointerEvents = "none";
  splash.style.opacity = "0";
  window.setTimeout(() => splash.remove(), 280);
}

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
            to={(isNativeApp() ? "/today" : "/") as never}
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
  const [captured] = useState(() =>
    captureClientError(error, {
      source: "router.error-component",
      channel: "runtime",
      fatal: true,
    }),
  );

  const recover = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map((reg) => reg.unregister()));
      }
      if (typeof caches !== "undefined") {
        const cacheKeys = await caches.keys();
        await Promise.allSettled(
          cacheKeys
            .filter((name) => name.startsWith("purple-shell-v"))
            .map((name) => caches.delete(name)),
        );
      }
    } catch {
      // Best-effort recovery only.
    }
    router.invalidate();
    reset();
    window.location.reload();
  };

  const supportHref = `/contact?source=route-error&errorId=${encodeURIComponent(captured.id)}`;

  return (
    <AppCrashFallback
      title="This page did not load"
      description="Purple hit an unexpected error while loading this screen."
      errorId={captured.id}
      onRetry={() => void recover()}
      supportHref={supportHref}
      onOpenDiagnostics={requestDiagnosticsPanelOpen}
      showDiagnosticsAction={isNativeApp()}
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: "Purple - Lets be calm" },
      {
        name: "description",
        content:
          "Purple is an open-source, AI-powered health journal for people managing epilepsy and other pattern-driven conditions. Write, speak, snap · Purple remembers.",
      },
      // theme-color is updated at runtime to match the resolved light/dark
      // surface (see themeBootstrapScript + ThemeProvider.apply). This default
      // is the dark brand surface for the pre-hydration splash.
      { name: "theme-color", content: "#0a0710" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Purple" },
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
    <html lang="en" className="dark" suppressHydrationWarning>
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
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap" />',
          }}
        />
        {/* Clean branded launch: a centered wordmark on the brand dark, removed
            on first paint so there is no flash of half-built UI. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              "@keyframes purpleSplashHide{0%,35%{opacity:1;visibility:visible;pointer-events:auto}36%,100%{opacity:0;visibility:hidden;pointer-events:none}}#purple-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#0A0710;transition:opacity .25s ease;animation:purpleSplashHide .65s ease forwards;pointer-events:none}#purple-splash .w{color:#FAFAFC;font-family:'Source Serif 4',Georgia,serif;font-weight:600;font-size:26px;letter-spacing:.42em;padding-left:.42em}html.native-app #purple-splash{animation-duration:.35s}@media (prefers-reduced-motion:reduce){#purple-splash{transition:none;animation:none;pointer-events:none}}",
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div id="purple-splash" aria-hidden="true">
          <span className="w">PURPLE</span>
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [idle, setIdle] = useState(false);
  const [diagFromQuery, setDiagFromQuery] = useState(false);

  // Resolve navigator → saved → default *after* hydration so the SSR markup
  // (always rendered in the default locale) matches the first client render.
  // Non-default locale bundles load on demand inside hydrateLocale.
  useEffect(() => {
    dismissPurpleSplash();
  }, []);

  // Supabase puts auth errors on the site root hash when a recovery link expires.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!raw.includes("error=")) return;
    const params = new URLSearchParams(raw);
    const code = params.get("error_code");
    if (code === "otp_expired" || code === "access_denied") {
      window.location.replace("/sign-in?reset=expired");
    }
  }, []);

  useEffect(() => {
    hydrateLocale();
  }, []);

  useEffect(() => {
    return installGlobalErrorCapture();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const enabled = new URLSearchParams(window.location.search).get("diag") === "1";
    setDiagFromQuery(enabled);
  }, [pathname]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Re-running route guards on TOKEN_REFRESHED caused brief null sessions and sign-in redirects.
      if (event === "TOKEN_REFRESHED") return;
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  // Mount deferred startup work (service worker, Oura auto-sync) once the
  // browser is idle so it never competes with first paint. Native shell skips
  // the idle wait so Capacitor splash hide and plugins init without blocking taps.
  useEffect(() => {
    const start = () => setIdle(true);
    const mobileProd =
      /iPhone|iPod|iPad|Android/i.test(navigator.userAgent) &&
      (window.location.hostname === "www.purplelife.org" ||
        window.location.hostname === "purplelife.org");
    if (isNativeApp() || mobileProd) {
      start();
      return;
    }
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 400);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <NativeAppProvider>
            <AuthProvider>
              <NativeAppBootstrap />
              <Outlet />
              <Toaster />
              <NativeDiagnosticsPanel
                showAccountTrigger={pathname === "/account"}
                forceOpen={diagFromQuery}
              />
              {idle && (
                <Suspense fallback={null}>
                  <DeferredStartup />
                </Suspense>
              )}
            </AuthProvider>
          </NativeAppProvider>
        </ThemeProvider>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  );
}
