/**
 * Workers JWT auth (HS256 via Web Crypto).
 * Replaces Supabase Auth JWTs when DATA_BACKEND=cloudflare.
 */

const ALG = { name: "HMAC", hash: "SHA-256" } as const;
const ISSUER = "purplelife.org";

export type PurpleJwtClaims = {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  iss?: string;
  iat: number;
  exp: number;
};

function b64urlEncode(data: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALG,
    false,
    ["sign", "verify"],
  );
}

export async function signJwt(
  secret: string,
  claims: Omit<PurpleJwtClaims, "iat" | "exp" | "iss"> & { expSeconds?: number },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: PurpleJwtClaims = {
    ...claims,
    iss: ISSUER,
    iat: now,
    exp: now + (claims.expSeconds ?? 3600),
  };
  delete (payload as { expSeconds?: number }).expSeconds;

  const headerPart = b64urlEncode(JSON.stringify(header));
  const payloadPart = b64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign(ALG, key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64urlEncode(sig)}`;
}

export async function verifyJwt(
  secret: string,
  token: string,
): Promise<PurpleJwtClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, sigPart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    ALG,
    key,
    b64urlDecode(sigPart) as BufferSource,
    new TextEncoder().encode(signingInput),
  );
  if (!valid) return null;

  let claims: PurpleJwtClaims;
  try {
    claims = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadPart)));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp <= now) return null;
  if (claims.iss && claims.iss !== ISSUER) return null;
  if (!claims.sub) return null;
  return claims;
}
