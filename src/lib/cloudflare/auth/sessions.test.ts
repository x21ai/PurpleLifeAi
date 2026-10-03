/**
 * Refresh rotation. Access JWTs stay short. Synthetic users only.
 */
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resetRequestBindingsForTests, setRequestBindings } from "../bindings.ts";
import { verifyJwt } from "./jwt.ts";
import { createMemoryD1 } from "./memory-d1.ts";
import { createUserWithPassword, signInWithPassword } from "./service.ts";
import {
  ACCESS_TTL_SECONDS,
  resetAuthSchemaCacheForTests,
  rotateRefreshToken,
} from "./sessions.ts";

beforeEach(() => {
  resetAuthSchemaCacheForTests();
  resetRequestBindingsForTests();
  setRequestBindings({
    DB: createMemoryD1(),
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "test-secret-not-a-real-key",
  });
});

test("refresh rotates and a reused token is rejected", async () => {
  await createUserWithPassword("gap-refresh@example.test", "refresh-pass-1");
  const signedIn = await signInWithPassword("gap-refresh@example.test", "refresh-pass-1");
  assert.ok(signedIn);
  if (!signedIn) return;
  assert.equal(signedIn.session.expires_in, ACCESS_TTL_SECONDS);
  assert.ok(signedIn.session.refresh_token);
  assert.equal(signedIn.session.refresh_token.includes("."), false);

  const claims = await verifyJwt("test-secret-not-a-real-key", signedIn.session.access_token);
  assert.equal(claims?.sub, signedIn.user.id);
  assert.equal(claims?.role, "authenticated");
  assert.ok(claims && claims.exp - claims.iat === ACCESS_TTL_SECONDS);

  const next = await rotateRefreshToken(signedIn.session.refresh_token);
  assert.ok(next);
  if (!next) return;
  assert.notEqual(next.refresh_token, signedIn.session.refresh_token);
  assert.equal(next.expires_in, ACCESS_TTL_SECONDS);
  assert.equal(next.user.email, "gap-refresh@example.test");

  const reused = await rotateRefreshToken(signedIn.session.refresh_token);
  assert.equal(reused, null);
  const afterReuse = await rotateRefreshToken(next.refresh_token);
  assert.equal(afterReuse, null);
});

test("password_reset role cannot pass verifyJwt", async () => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: "user",
      role: "password_reset",
      iss: "purplelife.org",
      iat: now,
      exp: now + 60,
    }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("test-secret-not-a-real-key"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  let binary = "";
  for (const byte of new Uint8Array(sig)) binary += String.fromCharCode(byte);
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const token = `${header}.${payload}.${signature}`;
  assert.equal(await verifyJwt("test-secret-not-a-real-key", token), null);
});
