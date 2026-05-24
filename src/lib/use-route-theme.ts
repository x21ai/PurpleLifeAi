import { useEffect } from "react";

/**
 * Force a theme (dark|light) on the <html> element while a component is
 * mounted. Reverts to the previous value on unmount so routes don't
 * leak their theme into one another.
 */
export function useRouteTheme(theme: "dark" | "light") {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const had = root.classList.contains("dark");
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    return () => {
      if (had) root.classList.add("dark");
      else root.classList.remove("dark");
    };
  }, [theme]);
}