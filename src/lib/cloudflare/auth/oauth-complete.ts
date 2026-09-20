import { resolveOAuthSiteOrigin } from "@/lib/oauth-allowed-origins";
import { d1First, d1Run } from "../d1/client";
import { getBindings } from "../bindings";
import { signJwt } from "./jwt";
import { importAuthUser } from "./service";

export type OAuthCompleteInput = {
  provider: string;
  providerUserId: string;
  email: string | null;
  emailVerified?: boolean;
  identityData: unknown;
};

export type OAuthCompleteResult = {
  access_token: string;
  expires_in: number;
  user: { id: string; email: string };
};

/** Find or create auth_users row, link auth_identities, issue Workers JWT. */
export async function completeOAuthSignIn(
  input: OAuthCompleteInput,
): Promise<OAuthCompleteResult | { error: string; status: number }> {
  const email = input.email?.toLowerCase() ?? null;

  let user = await d1First<{ id: string; email: string }>(
    email
      ? `SELECT u.id, u.email FROM auth_users u
         LEFT JOIN auth_identities i ON i.user_id = u.id
         WHERE u.email = ? OR (i.provider = ? AND i.provider_user_id = ?)
         LIMIT 1`
      : `SELECT u.id, u.email FROM auth_users u
         INNER JOIN auth_identities i ON i.user_id = u.id
         WHERE i.provider = ? AND i.provider_user_id = ?
         LIMIT 1`,
    ...(email
      ? [email, input.provider, input.providerUserId]
      : [input.provider, input.providerUserId]),
  );

  if (!user) {
    if (!email) {
      return { error: "Email required for new accounts", status: 400 };
    }
    const id = crypto.randomUUID();
    await importAuthUser({
      id,
      email,
      email_confirmed_at: input.emailVerified ? new Date().toISOString() : null,
    });
    user = { id, email };
  }

  await d1Run(
    `INSERT INTO auth_identities (id, user_id, provider, provider_user_id, identity_data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(provider, provider_user_id) DO UPDATE SET user_id = excluded.user_id, updated_at = datetime('now')`,
    crypto.randomUUID(),
    user.id,
    input.provider,
    input.providerUserId,
    JSON.stringify(input.identityData),
  );

  const secret = getBindings().AUTH_JWT_SECRET ?? process.env.AUTH_JWT_SECRET;
  if (!secret) return { error: "Auth not configured", status: 500 };

  const accessToken = await signJwt(secret, {
    sub: user.id,
    email: user.email,
    expSeconds: 3600,
  });

  return {
    access_token: accessToken,
    expires_in: 3600,
    user: { id: user.id, email: user.email },
  };
}

/** Resolve public site origin for OAuth redirect URIs (allowlisted hosts only). */
export function oauthSiteOrigin(redirectTo?: string | null): string {
  return resolveOAuthSiteOrigin(
    redirectTo,
    getBindings().PUBLIC_SITE_URL ?? process.env.PUBLIC_SITE_URL,
  );
}

/** Decode JWT payload without signature verification (post token exchange). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const decoded = atob(padded);
  return JSON.parse(decoded) as Record<string, unknown>;
}
