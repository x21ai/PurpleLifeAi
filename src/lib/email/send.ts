import { getRequest } from "@tanstack/react-start/server";

export interface SendTransactionalEmailParams {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
}

/**
 * Server-side helper: enqueues a transactional email by POSTing to the
 * internal /api/email/transactional/send route, forwarding the caller's
 * Authorization header. Safe to call from inside a `createServerFn` handler
 * that is protected by `requireSupabaseAuth`.
 */
export async function sendTransactionalEmail(
  params: SendTransactionalEmailParams,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const request = getRequest();
  const authHeader = request?.headers.get("authorization") ?? "";
  const origin =
    process.env.PUBLIC_SITE_URL ||
    (request ? new URL(request.url).origin : "https://purplelife.org");

  const res = await fetch(`${origin}/api/email/transactional/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({
      templateName: params.templateName,
      recipientEmail: params.recipientEmail,
      idempotencyKey: params.idempotencyKey,
      templateData: params.templateData,
    }),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}
