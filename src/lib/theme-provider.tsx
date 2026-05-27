import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "purple-theme";

type Ctx = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = React.createContext<Ctx | null>(null);

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>("system");
  const [resolved, setResolved] = React.useState<"light" | "dark">("light");

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    let stored: ThemeMode = "system";
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch { /* ignore */ }
    setModeState(stored);
    const r = resolve(stored);
    setResolved(r);
    apply(r);
  }, []);

  // React to system changes when in system mode
  React.useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r: "light" | "dark" = mq.matches ? "dark" : "light";
      setResolved(r);
      apply(r);
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [mode]);

  const setMode = React.useCallback((m: ThemeMode) => {
    try { localStorage.setItem(STORAGE_KEY, m); } catch { /* ignore */ }
    setModeState(m);
    const r = resolve(m);
    setResolved(r);
    apply(r);
  }, []);

  const value = React.useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) return { mode: "system", resolved: "light", setMode: () => {} };
  return ctx;
}

/**
 * Inline script string injected into <head> before hydration so the .dark
 * class is applied based on stored preference / system setting BEFORE the
 * page paints. Prevents both flash-of-wrong-theme and hydration mismatch.
 */
export const themeBootstrapScript = `
(function(){try{
  var k='${STORAGE_KEY}';
  var v=localStorage.getItem(k);
  if(v!=='light'&&v!=='dark'&&v!=='system')v='system';
  var dark=v==='dark'||(v==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  var c=document.documentElement.classList;
  if(dark)c.add('dark');else c.remove('dark');
}catch(e){}})();
`;