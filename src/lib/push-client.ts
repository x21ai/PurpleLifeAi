// Browser helper for Web Push subscription.
import { ensureServiceWorker } from "./med-notifications";
import { VAPID_PUBLIC_KEY } from "./push-public-key";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type SubscribePayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
};

function bufToB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getOrCreatePushSubscription(): Promise<SubscribePayload | null> {
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  if (typeof window === "undefined" || !("PushManager" in window)) return null;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh ?? bufToB64(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? bufToB64(sub.getKey("auth"));
  return {
    endpoint: sub.endpoint,
    p256dh,
    auth,
    userAgent: navigator.userAgent.slice(0, 500),
  };
}

export async function removePushSubscription(): Promise<string | null> {
  const reg = await ensureServiceWorker();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}