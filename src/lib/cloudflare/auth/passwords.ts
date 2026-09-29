/**
 * Password hashing with PBKDF2 (Web Crypto). No bcrypt native deps in Workers.
 *
 * Cloudflare Workers reject PBKDF2 iteration counts above 100000. 210000 threw
 * inside deriveBits and sign-in turned that into JSON 500.
 */

/** Workers Web Crypto inclusive maximum for PBKDF2 iterations. */
export const PBKDF2_MAX_ITERATIONS = 100_000;
const ITERATIONS = PBKDF2_MAX_ITERATIONS;
const SALT_BYTES = 16;

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2:${ITERATIONS}:${b64(salt)}:${b64(new Uint8Array(bits))}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 1 ||
    iterations > PBKDF2_MAX_ITERATIONS
  ) {
    return false;
  }
  const salt = fromB64(parts[2]);
  const expected = fromB64(parts[3]);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  let bits: ArrayBuffer;
  try {
    bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
      key,
      256,
    );
  } catch {
    return false;
  }
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
