/**
 * Standard Webhooks signature verification (https://www.standardwebhooks.com).
 * Both Supabase auth hooks and Resend (svix) webhooks sign with this scheme:
 *   signed_content = "{id}.{timestamp}.{body}"
 *   signature      = base64(hmac_sha256(base64decode(secret), signed_content))
 * Implemented on Web Crypto so it runs on Cloudflare Workers.
 */

const TOLERANCE_SECONDS = 5 * 60;

export class WebhookVerifyError extends Error {
  code: "missing_headers" | "stale_timestamp" | "invalid_signature";
  constructor(code: WebhookVerifyError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function decodeSecret(secret: string): Uint8Array {
  // Accept "v1,whsec_<b64>", "whsec_<b64>", or raw base64.
  let s = secret.trim();
  if (s.startsWith("v1,")) s = s.slice(3);
  if (s.startsWith("whsec_")) s = s.slice(6);
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies the request signature and returns the raw body text.
 * Throws WebhookVerifyError when verification fails.
 */
export async function verifyStandardWebhook(request: Request, secret: string): Promise<string> {
  const headers = request.headers;
  const id = headers.get("webhook-id") ?? headers.get("svix-id");
  const timestamp = headers.get("webhook-timestamp") ?? headers.get("svix-timestamp");
  const signatureHeader = headers.get("webhook-signature") ?? headers.get("svix-signature");

  if (!id || !timestamp || !signatureHeader) {
    throw new WebhookVerifyError("missing_headers", "Missing webhook signature headers");
  }

  const ts = Number(timestamp);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > TOLERANCE_SECONDS) {
    throw new WebhookVerifyError("stale_timestamp", "Webhook timestamp outside tolerance");
  }

  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    decodeSecret(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));

  // Header format: space-delimited list of "v1,<base64sig>" entries.
  const candidates = signatureHeader
    .split(" ")
    .map((part) => (part.includes(",") ? part.split(",")[1] : part))
    .filter(Boolean);

  if (!candidates.some((sig) => timingSafeEqual(sig, expected))) {
    throw new WebhookVerifyError("invalid_signature", "Webhook signature mismatch");
  }

  return body;
}
