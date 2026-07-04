#!/usr/bin/env node
/**
 * Mint a short-lived JWT for the App Store Connect API.
 * Env: APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_API_KEY (.p8 PEM)
 */
import crypto from "node:crypto";

const KEY_ID = process.env.APP_STORE_CONNECT_KEY_ID?.trim();
const ISSUER_ID = process.env.APP_STORE_CONNECT_ISSUER_ID?.trim();
const API_KEY = process.env.APP_STORE_CONNECT_API_KEY?.trim();

if (!KEY_ID || !ISSUER_ID || !API_KEY) {
  console.error(
    "Missing App Store Connect API credentials. Add to Doppler purple-life/prd:\n" +
      "  APP_STORE_CONNECT_KEY_ID\n" +
      "  APP_STORE_CONNECT_ISSUER_ID\n" +
      "  APP_STORE_CONNECT_API_KEY (full .p8 file contents)",
  );
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
const sign = crypto.createSign("SHA256");
sign.update(signingInput);
sign.end();
const signature = sign.sign(API_KEY, "base64url");

process.stdout.write(`${signingInput}.${signature}`);
