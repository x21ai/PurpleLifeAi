/**
 * Sign in with Apple token exchange. Shared by the JSON callback and
 * Apple's form_post redirect (required when requesting name and email).
 */
import { getBindings } from "../bindings";
import { isAllowedSocialOAuthRedirectUri } from "@/lib/oauth-allowed-origins";
import { completeOAuthSignIn, decodeJwtPayload, type OAuthCompleteResult } from "./oauth-complete";

export async function appleClientSecret(): Promise<string | null> {
  const existing = getBindings().APPLE_CLIENT_SECRET ?? process.env.APPLE_CLIENT_SECRET;
  if (existing) return existing;

  const teamId = getBindings().APPLE_TEAM_ID ?? process.env.APPLE_TEAM_ID;
  const keyId = getBindings().APPLE_KEY_ID ?? process.env.APPLE_KEY_ID;
  const clientId = getBindings().APPLE_CLIENT_ID ?? process.env.APPLE_CLIENT_ID;
  const pem = getBindings().APPLE_PRIVATE_KEY ?? process.env.APPLE_PRIVATE_KEY;
  if (!teamId || !keyId || !clientId || !pem) return null;

  const pkcs8 = pemToPkcs8(pem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 150,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64urlBytes(new Uint8Array(sig))}`;
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function b64url(value: string): string {
  return b64urlBytes(new TextEncoder().encode(value));
}

function b64urlBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function exchangeAppleCode(input: {
  code: string;
  redirectUri: string;
  user?: string | null;
}): Promise<OAuthCompleteResult | { error: string; status: number }> {
  const clientId = getBindings().APPLE_CLIENT_ID ?? process.env.APPLE_CLIENT_ID;
  const clientSecret = await appleClientSecret();
  if (!clientId || !clientSecret || !input.code || !input.redirectUri) {
    return { error: "OAuth not configured", status: 500 };
  }
  if (!isAllowedSocialOAuthRedirectUri(input.redirectUri)) {
    return { error: "Invalid redirect_uri", status: 400 };
  }

  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return { error: "Token exchange failed", status: 502 };

  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return { error: "No id_token", status: 502 };

  let claims: Record<string, unknown>;
  try {
    claims = decodeJwtPayload(tokens.id_token);
  } catch {
    return { error: "Invalid id_token", status: 502 };
  }

  const providerUserId = String(claims.sub ?? "");
  if (!providerUserId) return { error: "Missing subject", status: 502 };

  let email = typeof claims.email === "string" ? claims.email.toLowerCase() : null;
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  if (!email && input.user) {
    try {
      const userInfo = JSON.parse(input.user) as { email?: string };
      if (userInfo.email) email = userInfo.email.toLowerCase();
    } catch {
      /* ignore malformed user payload */
    }
  }

  return completeOAuthSignIn({
    provider: "apple",
    providerUserId,
    email,
    emailVerified,
    identityData: { sub: providerUserId, email },
  });
}
