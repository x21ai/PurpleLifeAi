export type RouteShellConfig = {
  hideTabBar?: boolean;
  hideTopBar?: boolean;
  hideAskFab?: boolean;
  showBack?: boolean;
  backTo?: string;
  title?: string;
};

export const DEFAULT_SHELL: RouteShellConfig = {
  hideTabBar: false,
  hideTopBar: false,
  hideAskFab: false,
  showBack: false,
};

/** Longest-prefix wins. Keeps route files untouched; shell reads pathname at runtime. */
export const SHELL_ROUTE_OVERRIDES: Array<{
  prefix: string;
  config: RouteShellConfig;
}> = [
  { prefix: "/welcome", config: { hideTabBar: true, hideTopBar: true, title: "Welcome" } },
  {
    prefix: "/journal/new",
    config: { hideTabBar: true, hideTopBar: true, hideAskFab: true },
  },
  { prefix: "/chat", config: { hideTabBar: true, hideTopBar: true, title: "Ask Purple" } },
  { prefix: "/admin", config: { hideTabBar: true } },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function resolveShellConfig(pathname: string): RouteShellConfig {
  const sorted = [...SHELL_ROUTE_OVERRIDES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, config } of sorted) {
    if (matchesPrefix(pathname, prefix)) {
      return { ...DEFAULT_SHELL, ...config };
    }
  }
  return { ...DEFAULT_SHELL };
}
