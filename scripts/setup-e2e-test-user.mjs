#!/usr/bin/env node
// Ensure a confirmed E2E smoke user exists on NEW Supabase with onboarding complete.
//
// Env:
//   NEW_SUPABASE_URL or SUPABASE_URL
//   NEW_SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
//   E2E_TEST_USER_EMAIL (default e2e-smoke@purplelife.org)
//   E2E_TEST_USER_PASSWORD (required)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEW_SUPABASE_URL ?? process.env.SUPABASE_URL;
const KEY =
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY;
const EMAIL = process.env.E2E_TEST_USER_EMAIL ?? "e2e-smoke@purplelife.org";
const PASSWORD = process.env.E2E_TEST_USER_PASSWORD;

if (!URL || !KEY) {
  console.error("Set SUPABASE_URL and SERVICE_ROLE_KEY (or NEW_* equivalents)");
  process.exit(1);
}
if (!PASSWORD) {
  console.error("Set E2E_TEST_USER_PASSWORD");
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed } = await admin.auth.admin.listUsers({ perPage: 1000 });
const existing = listed?.users?.find((u) => u.email === EMAIL);

let userId;
if (existing) {
  const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`updated auth user ${EMAIL}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`created auth user ${EMAIL}`);
}

const { data: profile } = await admin
  .from("profiles")
  .select("id, onboarded_at")
  .eq("id", userId)
  .maybeSingle();

if (!profile) {
  const { error } = await admin.from("profiles").insert({
    id: userId,
    first_name: "E2E",
    onboarded_at: new Date().toISOString(),
  });
  if (error) throw error;
  console.log("inserted profile with onboarding complete");
} else if (!profile.onboarded_at) {
  const { error } = await admin
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString(), first_name: "E2E" })
    .eq("id", userId);
  if (error) throw error;
  console.log("marked onboarding complete");
} else {
  console.log("profile already onboarded");
}

console.log(`ready: TEST_USER_EMAIL=${EMAIL}`);
