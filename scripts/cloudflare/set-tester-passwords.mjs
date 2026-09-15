#!/usr/bin/env node
/**
 * Set passwords for allowlisted tester accounts on Cloudflare auth.
 *
 * Usage:
 *   IMPORT_ADMIN_SECRET=... PUBLIC_SITE_URL=https://www.purplelife.org \
 *     node scripts/cloudflare/set-tester-passwords.mjs 'YourSecurePassword123!'
 *
 * Requires Worker deployed with DATA_BACKEND=cloudflare.
 */
const base = process.env.PUBLIC_SITE_URL ?? "https://www.purplelife.org";
const secret = process.env.IMPORT_ADMIN_SECRET;
const password = process.argv[2];

const TESTERS = [
  "pmt@eigital.com",
  "samuelc1@yahoo.com",
  "devynrosewalker@gmail.com",
];

if (!secret || !password || password.length < 8) {
  console.error("Usage: IMPORT_ADMIN_SECRET=... node set-tester-passwords.mjs '<password-8+>'");
  process.exit(1);
}

for (const email of TESTERS) {
  const res = await fetch(`${base}/api/admin/set-tester-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-import-secret": secret,
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`${email}: ${res.status}`, body);
  if (!res.ok) process.exitCode = 1;
}
