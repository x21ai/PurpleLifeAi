import assert from "node:assert/strict";
import { test } from "node:test";
import { PBKDF2_MAX_ITERATIONS, hashPassword, verifyPassword } from "./passwords.ts";

test("Workers PBKDF2 cap is 100000", () => {
  assert.equal(PBKDF2_MAX_ITERATIONS, 100_000);
});

test("new hashes use the Workers cap and round-trip", async () => {
  const stored = await hashPassword("correct horse");
  assert.match(stored, /^pbkdf2:100000:/);
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong", stored), false);
});

test("210000 iteration hashes do not throw", async () => {
  const stored =
    "pbkdf2:210000:AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  assert.equal(await verifyPassword("secret", stored), false);
});
