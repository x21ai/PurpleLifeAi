import * as React from "react";
import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { SignupEmail } from "@/lib/email-templates/signup";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

// Configuration
const SITE_NAME = "purplelife";
const ROOT_DOMAIN = "purplelife.org";

// Sample data for preview mode ONLY (not used in actual email sending).
// The sample email uses a fixed placeholder (RFC 6761 .test TLD).
const SAMPLE_PROJECT_URL = "https://www.purplelife.org"; // live-data-guard:allow (email template preview only)
const SAMPLE_EMAIL = "user@example.test"; // live-data-guard:allow (email template preview only)
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: "123456",
  },
};

export const Route = createFileRoute("/api/email/auth/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const previewSecret = process.env.EMAIL_PREVIEW_SECRET;

        if (!previewSecret) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Verify the caller is authorized with EMAIL_PREVIEW_SECRET
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || authHeader !== `Bearer ${previewSecret}`) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let type: string;
        try {
          const body = await request.json();
          type = body.type;
        } catch {
          return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
        }

        const EmailTemplate = EMAIL_TEMPLATES[type];

        if (!EmailTemplate) {
          return Response.json({ error: `Unknown email type: ${type}` }, { status: 400 });
        }

        const sampleData = SAMPLE_DATA[type] || {}; // live-data-guard:allow (email template preview only)
        const html = await render(React.createElement(EmailTemplate, sampleData));

        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
