import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "purplelife";
const FROM_DOMAIN = "notify.purplelife.org";
const SENDER_DOMAIN = "notify.purplelife.org";

/**
 * Render a registered template and enqueue it directly via the email queue,
 * skipping the HTTP `/api/email/transactional/send` route. Use this from
 * server contexts that have no Bearer token (cron jobs, internal jobs).
 * Returns { ok, messageId } and never throws, callers can ignore failures.
 */
export async function enqueueRenderedEmail(params: {
  templateName: string;
  recipientEmail: string;
  templateData?: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<{ ok: boolean; messageId: string | null; reason?: string }> {
  const { templateName, recipientEmail, templateData = {}, idempotencyKey } = params;

  const template = TEMPLATES[templateName];
  if (!template) {
    return { ok: false, messageId: null, reason: "template_not_found" };
  }

  const normalizedEmail = String(recipientEmail || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, messageId: null, reason: "missing_recipient" };
  }

  // Suppression check (best effort)
  try {
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (suppressed) {
      return { ok: false, messageId: null, reason: "suppressed" };
    }
  } catch {
    // ignore, proceed
  }

  const messageId = crypto.randomUUID();
  const idem = idempotencyKey ?? messageId;

  let html: string;
  let plainText: string;
  try {
    const element = React.createElement(
      template.component as React.ComponentType<Record<string, unknown>>,
      templateData,
    );
    html = await render(element);
    plainText = await render(element, { plainText: true });
  } catch (err) {
    console.warn("[render-and-enqueue] template render failed", err);
    return { ok: false, messageId, reason: "render_failed" };
  }

  const subject =
    typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  try {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: normalizedEmail,
      status: "pending",
    });
  } catch {
    // ignore, log row is best-effort
  }

  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: normalizedEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idem,
      queued_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.warn("[render-and-enqueue] enqueue failed", error);
    return { ok: false, messageId, reason: error.message };
  }

  return { ok: true, messageId };
}
