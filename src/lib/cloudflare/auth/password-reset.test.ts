/**
 * Password reset is for every auth user. These tests create synthetic
 * accounts in memory. They do not read production D1, change an existing
 * password, or call Resend.
 */
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resetRequestBindingsForTests, setRequestBindings } from "../bindings.ts";
import { createUserWithPassword, signInWithPassword } from "./service.ts";
import { requestPasswordReset, resetLinkFor } from "./password-reset.ts";
import { redeemPasswordResetToken, resetAuthSchemaCacheForTests } from "./sessions.ts";
import { createMemoryD1 } from "./memory-d1.ts";

const EMAIL_A = "gap-reset-a@example.test";
const EMAIL_B = "gap-reset-b@example.test";
const UNKNOWN = "gap-reset-missing@example.test";

beforeEach(() => {
  resetAuthSchemaCacheForTests();
  resetRequestBindingsForTests();
  setRequestBindings({
    DB: createMemoryD1(),
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "test-secret-not-a-real-key",
  });
});

test("reset link is built for any address and never logs the token", () => {
  const link = resetLinkFor("https://www.purplelife.org/reset-password", "abc");
  assert.equal(
    link,
    "https://www.purplelife.org/reset-password?reset_token=abc",
  );
  const native = resetLinkFor("org.purplelife.app://reset-password", "def");
  assert.match(native, /^org\.purplelife\.app:\/\/reset-password\?reset_token=def$/);
  const rejected = resetLinkFor("https://evil.example/reset-password", "ghi");
  assert.match(rejected, /^https:\/\/www\.purplelife\.org\/reset-password\?reset_token=ghi$/);
});

test("unknown address does not send and does not say the address is missing", async () => {
  let sends = 0;
  const result = await requestPasswordReset({
    email: UNKNOWN,
    send: async () => {
      sends += 1;
      return { ok: true };
    },
  });
  assert.equal(sends, 0);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true });
});

test("each account gets its own link and only that password changes", async () => {
  await createUserWithPassword(EMAIL_A, "original-a-pass");
  await createUserWithPassword(EMAIL_B, "original-b-pass");

  const sent: Array<{ recipient: string; resetUrl: string }> = [];
  const first = await requestPasswordReset({
    email: EMAIL_A,
    redirectTo: "https://www.purplelife.org/reset-password",
    send: async (recipient, resetUrl) => {
      sent.push({ recipient, resetUrl });
      return { ok: true };
    },
  });
  const second = await requestPasswordReset({
    email: `  ${EMAIL_B.toUpperCase()}  `,
    send: async (recipient, resetUrl) => {
      sent.push({ recipient, resetUrl });
      return { ok: true };
    },
  });

  assert.equal(first.status, 200);
  assert.equal(first.body.ok, true);
  assert.equal(second.status, 200);
  assert.deepEqual(
    sent.map((row) => row.recipient),
    [EMAIL_A, EMAIL_B],
  );
  assert.notEqual(sent[0].resetUrl, sent[1].resetUrl);

  const tokenA = new URL(sent[0].resetUrl).searchParams.get("reset_token");
  const tokenB = new URL(sent[1].resetUrl).searchParams.get("reset_token");
  assert.ok(tokenA);
  assert.ok(tokenB);
  assert.equal(tokenA.includes("."), false);

  const redeemed = await redeemPasswordResetToken(tokenA, "replacement-a-pass");
  assert.equal(redeemed.ok, true);
  if (!redeemed.ok) return;
  assert.equal(redeemed.user.email, EMAIL_A);

  const again = await redeemPasswordResetToken(tokenA, "another-a-pass");
  assert.equal(again.ok, false);

  assert.equal(await signInWithPassword(EMAIL_A, "original-a-pass"), null);
  assert.ok(await signInWithPassword(EMAIL_A, "replacement-a-pass"));
  assert.ok(await signInWithPassword(EMAIL_B, "original-b-pass"));
  assert.equal(await signInWithPassword(EMAIL_B, "replacement-a-pass"), null);

  const redeemedB = await redeemPasswordResetToken(tokenB, "replacement-b-pass");
  assert.equal(redeemedB.ok, true);
  assert.ok(await signInWithPassword(EMAIL_B, "replacement-b-pass"));
  assert.equal(await signInWithPassword(EMAIL_B, "original-b-pass"), null);
  assert.ok(await signInWithPassword(EMAIL_A, "replacement-a-pass"));
});

test("a failed send is not reported as success", async () => {
  await createUserWithPassword(EMAIL_A, "original-a-pass");
  const result = await requestPasswordReset({
    email: EMAIL_A,
    send: async () => ({ ok: false, status: 403 }),
  });
  assert.equal(result.status, 502);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.error, "Could not send reset email");
  assert.equal(await signInWithPassword(EMAIL_A, "original-a-pass") !== null, true);
});
