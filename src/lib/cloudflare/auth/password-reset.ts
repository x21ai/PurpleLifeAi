/**
 * Password reset request: store a one-time token and email the link.
 * Unknown addresses return the same success body as a sent mail.
 * A failed send is not reported as success.
 * The raw token and URL are never logged.
 */
import { isAllowedSiteOrigin } from "@/lib/oauth-allowed-origins";
import { getBindings } from "../bindings";
import { findUserByEmail } from "./service";
import { createPasswordResetToken } from "./sessions";

const NATIVE_RESET = "org.purplelife.app://reset-password";
const DEFAULT_RESET = "https://www.purplelife.org/reset-password";
const FROM = "Purple <noreply@notify.purplelife.org>";

export type ResetMailResult = { ok: true } | { ok: false; status: number };

export function resetLinkFor(redirectTo: string | undefined, token: string): string {
  let base = DEFAULT_RESET;
  const trimmed = redirectTo?.trim();
  if (trimmed) {
    if (trimmed === NATIVE_RESET || trimmed.startsWith(`${NATIVE_RESET}?`)) {
      base = NATIVE_RESET;
    } else {
      try {
        const url = new URL(trimmed);
        const path = url.pathname.replace(/\/+$/, "") || "/";
        if (isAllowedSiteOrigin(url.origin) && path === "/reset-password") {
          base = `${url.origin}/reset-password`;
        }
      } catch {
        base = DEFAULT_RESET;
      }
    }
  }
  if (base === NATIVE_RESET) {
    return `${NATIVE_RESET}?reset_token=${encodeURIComponent(token)}`;
  }
  const url = new URL(base);
  url.searchParams.set("reset_token", token);
  return url.toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetEmail(
  recipient: string,
  resetUrl: string,
): Promise<ResetMailResult> {
  const apiKey = getBindings().RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, status: 0 };

  const safeUrl = escapeHtml(resetUrl);
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [recipient],
        subject: "Reset your PurpleLife password",
        text: [
          "Reset your PurpleLife password:",
          resetUrl,
          "",
          "This link expires in 1 hour and works once.",
          "If you did not ask for this, you can ignore this email.",
        ].join("\n"),
        html: `<p>Reset your PurpleLife password.</p><p><a href="${safeUrl}">Choose a new password</a></p><p>This link expires in 1 hour and works once.</p><p>If you did not ask for this, you can ignore this email.</p>`,
      }),
    });
  } catch {
    return { ok: false, status: 0 };
  }
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true };
}

export async function requestPasswordReset(input: {
  email: string;
  redirectTo?: string;
  send?: (recipient: string, resetUrl: string) => Promise<ResetMailResult>;
}): Promise<{ status: number; body: { ok: boolean; error?: string } }> {
  const email = input.email.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user?.email) {
    return { status: 200, body: { ok: true } };
  }

  const token = await createPasswordResetToken(user.id);
  const resetUrl = resetLinkFor(input.redirectTo, token);
  const send = input.send ?? sendPasswordResetEmail;
  const sent = await send(user.email, resetUrl);
  if (!sent.ok) {
    console.info("[auth] password reset mail failed");
    return {
      status: 502,
      body: { ok: false, error: "Could not send reset email" },
    };
  }
  console.info("[auth] password reset mail sent");
  return { status: 200, body: { ok: true } };
}
