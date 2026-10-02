import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeOAuthHandoffUrl } from "./native-oauth-handoff.ts";

const session = {
  access_token: "worker-jwt",
  expires_in: 3600,
  user: { id: "user-1", email: "devynrosewalker@gmail.com" },
};

test("native OAuth handoff keeps in-site state on the web", () => {
  assert.equal(nativeOAuthHandoffUrl("/today", session), null);
  assert.equal(nativeOAuthHandoffUrl("https://www.purplelife.org/today", session), null);
});

test("native OAuth handoff puts the Worker JWT on the app callback", () => {
  const encoded = encodeURIComponent("org.purplelife.app://auth-callback");
  const url = nativeOAuthHandoffUrl(encoded, session);
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "org.purplelife.app:");
  assert.equal(parsed.searchParams.get("access_token"), "worker-jwt");
  assert.equal(parsed.searchParams.get("expires_in"), "3600");
  assert.equal(parsed.searchParams.get("user_id"), "user-1");
  assert.equal(parsed.searchParams.get("email"), "devynrosewalker@gmail.com");
});
