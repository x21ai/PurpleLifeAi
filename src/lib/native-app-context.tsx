import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useNativeApp } from "@/lib/native/use-native-app";

type NativeAppContextValue = {
  /** null while the Capacitor bridge is still loading. */
  isNative: boolean | null;
  /** True only when isNative === true. */
  isNativeApp: boolean;
};

const NativeAppContext = createContext<NativeAppContextValue>({
  isNative: null,
  isNativeApp: false,
});

export function NativeAppProvider({ children }: { children: ReactNode }) {
  const isNative = useNativeApp();
  const isNativeApp = isNative === true;

  useEffect(() => {
    const root = document.documentElement;
    if (isNative !== false) {
      root.classList.add("native-app");
    } else {
      root.classList.remove("native-app");
    }
  }, [isNative]);

  return (
    <NativeAppContext.Provider value={{ isNative, isNativeApp }}>
      {children}
    </NativeAppContext.Provider>
  );
}

export function useNativeAppContext(): NativeAppContextValue {
  return useContext(NativeAppContext);
}
