#!/usr/bin/env node
// Recreate auth.users in the NEW project with preserved UUIDs.
//
// Env:
//   NEW_SUPABASE_URL                 (required)
//   NEW_SUPABASE_SERVICE_ROLE_KEY    (required)
//   SEND_RECOVERY=1                  (optional) also generate recovery links
//
// Input:  ./auth-users.json (downloaded from /admin/migration-export)
// Output: ./import-auth.errors.json, ./recovery-links.json (when SEND_RECOVERY=1)

import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const URL = process.env.NEW_SUPABASE_URL;
const KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Set NEW_SUPABASE_URL and NEW_SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const SEND_RECOVERY = process.env.SEND_RECOVERY === "1";

const admin = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const raw = JSON.parse(await readFile(join(here, "auth-users.json"), "utf8"));
const users = Array.isArray(raw) ? raw : raw.users;

const errors = [];
const recoveryLinks = [];
let created = 0;
let skipped = 0;

for (const u of users) {
  try {
    const { error } = await admin.auth.admin.createUser({
      id: u.id,
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      email_confirm: !!u.email_confirmed_at,
      phone_confirm: !!u.phone_confirmed_at,
      user_metadata: u.user_metadata ?? {},
      app_metadata: u.app_metadata ?? {},
    });
    if (error) {
      const msg = String(error.message || error);
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        skipped += 1;
      } else {
        errors.push({ user: { id: u.id, email: u.email }, error: msg });
        continue;
      }
    } else {
      created += 1;
    }

    if (SEND_RECOVERY && u.email) {
      const { data, error: linkErr } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: u.email,
      });
      if (linkErr) {
        errors.push({ user: { id: u.id, email: u.email }, error: `recovery: ${linkErr.message}` });
      } else {
        recoveryLinks.push({ id: u.id, email: u.email, link: data?.properties?.action_link });
      }
    }
  } catch (e) {
    errors.push({ user: { id: u.id, email: u.email }, error: String(e?.message ?? e) });
  }
}

await writeFile(join(here, "import-auth.errors.json"), JSON.stringify(errors, null, 2));
if (SEND_RECOVERY) {
  await writeFile(join(here, "recovery-links.json"), JSON.stringify(recoveryLinks, null, 2));
}

console.log(`created=${created} skipped=${skipped} errors=${errors.length} recovery=${recoveryLinks.length}`);
process.exit(errors.length ? 2 : 0);