/**
 * Deprecated: theme is now controlled globally by ThemeProvider
 * (src/lib/theme-provider.tsx) based on the user's preference in Settings.
 * Kept as a no-op so existing call sites don't break.
 */
export function useRouteTheme(_theme: "dark" | "light") {
  // intentionally empty
}