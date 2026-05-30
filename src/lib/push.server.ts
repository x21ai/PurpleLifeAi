import webpush from "web-push";

let configured = false;

export const VAPID_PUBLIC_KEY =
  "BKxcvKT71t_iZK0DRT7zJldnnwS5LAGbrflD79Pn7nE8Zs7BGfyvWFIFkCX4RTASOMarQZPJ9l6GMnTZc_9EpNU";

export function getWebPush() {
  if (!configured) {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:hello@purplelife.org";
    if (!privateKey) throw new Error("VAPID_PRIVATE_KEY not configured");
    webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
    configured = true;
  }
  return webpush;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}, payload: PushPayload): Promise<{ ok: boolean; statusCode?: number; gone?: boolean }> {
  const wp = getWebPush();
  try {
    await wp.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 },
    );
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: string };
    const gone = err.statusCode === 404 || err.statusCode === 410;
    console.warn("[push] send failed", err.statusCode, err.body);
    return { ok: false, statusCode: err.statusCode, gone };
  }
}