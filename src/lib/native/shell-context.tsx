import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useNativeAppContext } from "@/lib/native-app-context";
import { nativePlatform } from "./capacitor";
import {
  DEFAULT_SHELL,
  resolveShellConfig,
  type RouteShellConfig,
} from "./shell-routes";

const ShellConfigContext = createContext<RouteShellConfig>(DEFAULT_SHELL);

export function NativeShellProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const config = useMemo(() => resolveShellConfig(pathname), [pathname]);

  return (
    <ShellConfigContext.Provider value={config}>{children}</ShellConfigContext.Provider>
  );
}

export function useRouteShellConfig(): RouteShellConfig {
  return useContext(ShellConfigContext);
}

export function useShell(): {
  mode: "web" | "native";
  platform: "ios" | "android" | "web";
} {
  const { isNativeApp } = useNativeAppContext();
  const platform = nativePlatform();

  if (isNativeApp) {
    return {
      mode: "native",
      platform: platform === "android" ? "android" : "ios",
    };
  }

  return { mode: "web", platform: "web" };
}
