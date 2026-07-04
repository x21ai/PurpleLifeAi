import { AppShell } from "./app-shell";
import { NativeAppShell } from "./native-app-shell";
import { useNativeAppContext } from "@/lib/native-app-context";

/** Picks web AppShell or native NativeAppShell after Capacitor bridge detection. */
export function AppShellRouter() {
  const { isNative } = useNativeAppContext();

  if (isNative === false) {
    return <AppShell />;
  }

  return <NativeAppShell />;
}
