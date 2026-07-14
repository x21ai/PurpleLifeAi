#!/usr/bin/env node
/**
 * Mint a short-lived JWT for the App Store Connect API.
 * Env (x21/prd): PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID, _ISSUER_ID, _API_KEY
 */
import crypto from "node:crypto";
import { ASC_DOPPLER_HINT, readAscCredentials } from "./purple-life-secrets.mjs";

const { KEY_ID, ISSUER_ID, API_KEY } = readAscCredentials();

if (!KEY_ID || !ISSUER_ID || !API_KEY) {
  console.error(`Missing App Store Connect API credentials. ${ASC_DOPPLER_HINT}`);
  process.exit(1);
}

const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" })).toString(
  "base64url",
);
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(
  JSON.stringify({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: "appstoreconnect-v1",
  }),
).toString("base64url");

const signingInput = `${header}.${payload}`;
const signature = crypto
  .sign("sha256", Buffer.from(signingInput), { key: API_KEY, dsaEncoding: "ieee-p1363" })
  .toString("base64url");

process.stdout.write(`${signingInput}.${signature}`);
