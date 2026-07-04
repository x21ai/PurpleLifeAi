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

export type NativeBuildInfo = {
  platform: "ios" | "android" | "web";
  version: string | null;
  build: string | null;
};

export type NativeLaunchIssue = {
  code: string;
  message: string;
  error?: string;
  url?: string;
  at?: string;
  build?: string;
};

type NativeDiagFlag = {
  enabled: boolean;
  build?: string;
};

type NativeBridgeMessage = {
  source?: string;
  type?: string;
  payload?: unknown;
};

declare global {
  interface Window {
    __PURPLE_NATIVE_DIAG_ENABLED__?: boolean;
  }
}

const BRIDGE_SOURCE = "purple-native";
const LAST_ISSUE_STORAGE_KEY = "purple.native.lastLaunchIssue";
const NATIVE_LAUNCH_EVENT = "purple:native-launch-error";
const NATIVE_DIAG_FLAG_EVENT = "purple:native-diag-flag";
const NATIVE_ISSUE_UPDATED_EVENT = "purple:native-launch-issue-updated";
const NATIVE_DIAG_UPDATED_EVENT = "purple:native-diag-flag-updated";

let diagnosticsBridgeBound = false;

function cap(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

function hasInjectedPlugins(c: CapacitorGlobal | undefined): boolean {
  const plugins = c?.Plugins;
  return !!plugins && Object.keys(plugins).length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function parseLaunchIssue(payload: unknown): NativeLaunchIssue | null {
  if (!isRecord(payload)) return null;
  const message = typeof payload.message === "string" ? payload.message : "";
  if (!message) return null;
  const code = typeof payload.code === "string" ? payload.code : "launch_error";
  return {
    code,
    message,
    error: typeof payload.error === "string" ? payload.error : undefined,
    url: typeof payload.url === "string" ? payload.url : undefined,
    at: typeof payload.at === "string" ? payload.at : undefined,
    build: typeof payload.build === "string" ? payload.build : undefined,
  };
}

function parseDiagFlag(payload: unknown): NativeDiagFlag | null {
  if (!isRecord(payload) || typeof payload.enabled !== "boolean") return null;
  return {
    enabled: payload.enabled,
    build: typeof payload.build === "string" ? payload.build : undefined,
  };
}

function issueStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function persistLaunchIssue(issue: NativeLaunchIssue): void {
  if (issueStorageAvailable()) {
    try {
      window.localStorage.setItem(LAST_ISSUE_STORAGE_KEY, JSON.stringify(issue));
    } catch (error) {
      console.warn("[native] failed to persist launch issue", error);
    }
  }
  window.dispatchEvent(
    new CustomEvent<NativeLaunchIssue>(NATIVE_ISSUE_UPDATED_EVENT, { detail: issue }),
  );
}

function applyDiagFlag(flag: NativeDiagFlag): void {
  window.__PURPLE_NATIVE_DIAG_ENABLED__ = flag.enabled;
  window.dispatchEvent(
    new CustomEvent<NativeDiagFlag>(NATIVE_DIAG_UPDATED_EVENT, { detail: flag }),
  );
}

function handleBridgeMessage(raw: unknown): void {
  const message = raw as NativeBridgeMessage;
  if (!isRecord(message) || message.source !== BRIDGE_SOURCE) return;
  if (message.type === "launch-error") {
    const issue = parseLaunchIssue(message.payload);
    if (issue) persistLaunchIssue(issue);
    return;
  }
  if (message.type === "diag-flag") {
    const flag = parseDiagFlag(message.payload);
    if (flag) applyDiagFlag(flag);
  }
}

function ensureDiagnosticsBridge(): void {
  if (typeof window === "undefined" || diagnosticsBridgeBound) return;
  diagnosticsBridgeBound = true;

  window.addEventListener("message", (event) => {
    handleBridgeMessage(event.data);
  });

  window.addEventListener(NATIVE_LAUNCH_EVENT, (event) => {
    const issue = parseLaunchIssue((event as CustomEvent<unknown>).detail);
    if (issue) persistLaunchIssue(issue);
  });

  window.addEventListener(NATIVE_DIAG_FLAG_EVENT, (event) => {
    const flag = parseDiagFlag((event as CustomEvent<unknown>).detail);
    if (flag) applyDiagFlag(flag);
  });
}

/** True only inside the Capacitor iOS/Android shell. */
export function isNativeApp(): boolean {
  ensureDiagnosticsBridge();
  const c = cap();
  if (!c) return false;
  const platform = c.getPlatform?.();
  if (platform !== "ios" && platform !== "android") return false;
  if (c.isNativePlatform?.() === true) return true;
  // Remote server.url pages: bridge can exist before isNativePlatform() is set.
  return hasInjectedPlugins(c);
}

export function nativePlatform(): "ios" | "android" | "web" {
  return cap()?.getPlatform?.() ?? "web";
}

export function nativeBridgeReady(): boolean {
  const c = cap();
  const platform = c?.getPlatform?.();
  if (platform !== "ios" && platform !== "android") return false;
  return c?.isNativePlatform?.() === true || hasInjectedPlugins(c);
}

export async function nativeAppBuildInfo(): Promise<NativeBuildInfo> {
  const platform = nativePlatform();
  if (platform === "web") {
    return { platform, version: null, build: null };
  }
  const info = (await callPlugin("App", "getInfo")) as
    | { version?: string; build?: string }
    | undefined;
  return {
    platform,
    version: info?.version ?? null,
    build: info?.build ?? null,
  };
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

export function getLastNativeLaunchIssue(): NativeLaunchIssue | null {
  ensureDiagnosticsBridge();
  if (!issueStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(LAST_ISSUE_STORAGE_KEY);
    if (!raw) return null;
    return parseLaunchIssue(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearLastNativeLaunchIssue(): void {
  ensureDiagnosticsBridge();
  if (!issueStorageAvailable()) return;
  try {
    window.localStorage.removeItem(LAST_ISSUE_STORAGE_KEY);
  } catch (error) {
    console.warn("[native] failed to clear launch issue", error);
  }
  window.dispatchEvent(
    new CustomEvent<NativeLaunchIssue | null>(NATIVE_ISSUE_UPDATED_EVENT, { detail: null }),
  );
}

function isDiagEnabledViaQuery(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("diag") === "1";
}

export function isNativeDiagnosticsEnabled(): boolean {
  ensureDiagnosticsBridge();
  if (typeof window === "undefined") return false;
  return isDiagEnabledViaQuery() || window.__PURPLE_NATIVE_DIAG_ENABLED__ === true;
}

export function onNativeLaunchIssueChange(
  cb: (issue: NativeLaunchIssue | null) => void,
): () => void {
  ensureDiagnosticsBridge();
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<NativeLaunchIssue | null>).detail ?? null;
    cb(detail);
  };
  window.addEventListener(NATIVE_ISSUE_UPDATED_EVENT, handler);
  cb(getLastNativeLaunchIssue());
  return () => window.removeEventListener(NATIVE_ISSUE_UPDATED_EVENT, handler);
}

export function onNativeDiagFlagChange(cb: (enabled: boolean) => void): () => void {
  ensureDiagnosticsBridge();
  if (typeof window === "undefined") return () => undefined;
  const handler = () => {
    cb(isNativeDiagnosticsEnabled());
  };
  window.addEventListener(NATIVE_DIAG_UPDATED_EVENT, handler);
  cb(isNativeDiagnosticsEnabled());
  return () => window.removeEventListener(NATIVE_DIAG_UPDATED_EVENT, handler);
}

if (typeof window !== "undefined") {
  ensureDiagnosticsBridge();
}
