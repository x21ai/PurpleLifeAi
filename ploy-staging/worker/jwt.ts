const ALG = { name: "HMAC", hash: "SHA-256" } as const;
const ISSUER = "purplelife.org";

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

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALG,
    false,
    ["sign"],
  );
}

export async function signJwt(
  secret: string,
  claims: { sub: string; email?: string; expSeconds?: number },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: claims.sub,
    email: claims.email,
    iss: ISSUER,
    iat: now,
    exp: now + (claims.expSeconds ?? 86400),
  };
  const headerPart = b64urlEncode(JSON.stringify(header));
  const payloadPart = b64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign(ALG, key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64urlEncode(sig)}`;
}
