import assert from "node:assert/strict";

const baseUrl = (process.env.E2E_BASE_URL ?? "https://www.purplelife.org").replace(/\/+$/, "");
const email = process.env.E2E_TEST_USER_EMAIL ?? process.env.TEST_USER_EMAIL;
const password = process.env.E2E_TEST_USER_PASSWORD ?? process.env.TEST_USER_PASSWORD;

assert(email, "Missing E2E_TEST_USER_EMAIL or TEST_USER_EMAIL");
assert(password, "Missing E2E_TEST_USER_PASSWORD or TEST_USER_PASSWORD");

async function request(path, init) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(30_000),
  });
}

const signInResponse = await request("/api/auth/sign-in", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ email, password }),
});
const signIn = await signInResponse.json().catch(() => ({}));

assert.equal(signInResponse.ok, true, `sign-in failed with HTTP ${signInResponse.status}`);
assert.equal(typeof signIn.access_token, "string", "sign-in response omitted access_token");
assert.equal(typeof signIn.user?.id, "string", "sign-in response omitted user id");

const profileResponse = await request("/api/data/query", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${signIn.access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    table: "profiles",
    mode: "select",
    select: "id",
    filters: [{ op: "eq", col: "id", val: signIn.user.id }],
    order: [],
    limit: 1,
  }),
});
const profile = await profileResponse.json().catch(() => ({}));

assert.equal(profileResponse.ok, true, `D1 profile read failed with HTTP ${profileResponse.status}`);
assert.equal(Array.isArray(profile.data), true, "D1 profile response was not a row array");
assert.equal(profile.data.length, 1, "authenticated user profile was not returned");
assert.equal(profile.data[0]?.id, signIn.user.id, "D1 read returned the wrong profile");

console.log("smoke-www-cloudflare-data: PASS (real auth + user-scoped D1 profile read)");
