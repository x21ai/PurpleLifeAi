/**
 * Thin, dependency-free access to the Capacitor runtime bridge.
 *
 * The native iOS/Android shells load the production site in a WebView (see
 * capacitor.config.ts), and Capacitor injects a `window.Capacitor` global plus
 * `Capacitor.Plugins.*` into that page. We talk to that global directly instead
 * of importing the @capacitor/* npm packages, so nothing native is pulled into
 * the web bundle and the live web build is completely unaffected. On the web
 * (no native shell) every helper here is a safe no-op.
 */

type PluginCall = (...args: unknown[]) => Promise<unknown>;
type Plugin = Record<string, PluginCall | undefined> & {
  addListener?: (event: string, cb: (data: unknown) => void) => unknown;
};

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => "ios" | "android" | "web";
  Plugins?: Record<string, Plugin | undefined>;
};

function cap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** True only inside the Capacitor iOS/Android shell. */
export function isNativeApp(): boolean {
  const c = cap();
  if (!c) return false;
  if (c.isNativePlatform?.() === true) return true;
  const platform = c.getPlatform?.();
  if (platform === "ios" || platform === "android") return true;
  // Remote server.url pages: bridge can exist before isNativePlatform() is set.
  const plugins = c.Plugins;
  if (plugins && Object.keys(plugins).length > 0 && platform && platform !== "web") {
    return true;
  }
  return false;
}

export function nativePlatform(): "ios" | "android" | "web" {
  return cap()?.getPlatform?.() ?? "web";
}

/** Get an injected plugin, or undefined when not running natively. */
export function plugin(name: string): Plugin | undefined {
  return cap()?.Plugins?.[name];
}

/** Call a plugin method, swallowing absence/errors so callers stay simple. */
export async function callPlugin(
  name: string,
  method: string,
  options?: Record<string, unknown>,
): Promise<unknown> {
  const p = plugin(name);
  const fn = p?.[method];
  if (typeof fn !== "function") return undefined;
  try {
    return await fn(options ?? {});
  } catch (err) {
    console.warn(`[native] ${name}.${method} failed`, err);
    return undefined;
  }
}
