#!/usr/bin/env node
// Re-sign journal_entries.media_urls and seizure_events photo/video URLs on NEW Supabase.
//
// Env:
//   NEW_SUPABASE_URL                 (required)
//   NEW_SUPABASE_SERVICE_ROLE_KEY    (required)
//   OLD_SUPABASE_HOST                (optional, default lzuodgpqseijhhyzgfky.supabase.co)
//   DRY_RUN=1                        (optional, log only)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEW_SUPABASE_URL;
const KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
const OLD_HOST =
  process.env.OLD_SUPABASE_HOST ?? "lzuodgpqseijhhyzgfky.supabase.co";
const DRY_RUN = process.env.DRY_RUN === "1";

if (!URL || !KEY) {
  console.error("Set NEW_SUPABASE_URL and NEW_SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SIGN_TTL_SEC = 60 * 60 * 24 * 365; // 1 year

function extractStoragePath(oldUrl) {
  if (!oldUrl || !oldUrl.includes(OLD_HOST)) return null;
  const marker = "/storage/v1/object/sign/";
  const idx = oldUrl.indexOf(marker);
  if (idx === -1) return null;
  const after = oldUrl.slice(idx + marker.length);
  const q = after.indexOf("?");
  const pathWithBucket = q === -1 ? after : after.slice(0, q);
  const slash = pathWithBucket.indexOf("/");
  if (slash === -1) return null;
  const bucket = pathWithBucket.slice(0, slash);
  const path = pathWithBucket.slice(slash + 1);
  if (!bucket || !path) return null;
  return { bucket, path };
}

async function resignUrl(oldUrl) {
  const parsed = extractStoragePath(oldUrl);
  if (!parsed) return oldUrl;
  const { data, error } = await admin.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, SIGN_TTL_SEC);
  if (error) throw new Error(`${parsed.bucket}/${parsed.path}: ${error.message}`);
  return data.signedUrl;
}

async function resignArray(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return { urls, changed: false };
  let changed = false;
  const next = [];
  for (const url of urls) {
    if (typeof url !== "string" || !url.includes(OLD_HOST)) {
      next.push(url);
      continue;
    }
    const signed = await resignUrl(url);
    if (signed !== url) changed = true;
    next.push(signed);
  }
  return { urls: next, changed };
}

async function processJournal() {
  const { data: rows, error } = await admin
    .from("journal_entries")
    .select("id, media_urls")
    .not("media_urls", "eq", "{}");
  if (error) throw error;

  let updated = 0;
  for (const row of rows ?? []) {
    const { urls, changed } = await resignArray(row.media_urls);
    if (!changed) continue;
    if (DRY_RUN) {
      console.log(`[dry-run] journal_entries ${row.id}: ${urls.length} urls`);
      updated += 1;
      continue;
    }
    const { error: upErr } = await admin
      .from("journal_entries")
      .update({ media_urls: urls })
      .eq("id", row.id);
    if (upErr) throw upErr;
    updated += 1;
    console.log(`journal_entries ${row.id}`);
  }
  return updated;
}

async function processSeizures() {
  const { data: rows, error } = await admin
    .from("seizure_events")
    .select("id, photo_urls, video_url");
  if (error) throw error;

  let updated = 0;
  for (const row of rows ?? []) {
    const photos = await resignArray(row.photo_urls ?? []);
    const video =
      row.video_url && row.video_url.includes(OLD_HOST)
        ? { url: await resignUrl(row.video_url), changed: true }
        : { url: row.video_url, changed: false };
    if (!photos.changed && !video.changed) continue;
    const patch = {};
    if (photos.changed) patch.photo_urls = photos.urls;
    if (video.changed) patch.video_url = video.url;
    if (DRY_RUN) {
      console.log(`[dry-run] seizure_events ${row.id}`);
      updated += 1;
      continue;
    }
    const { error: upErr } = await admin
      .from("seizure_events")
      .update(patch)
      .eq("id", row.id);
    if (upErr) throw upErr;
    updated += 1;
    console.log(`seizure_events ${row.id}`);
  }
  return updated;
}

const journalUpdated = await processJournal();
const seizureUpdated = await processSeizures();
console.log(
  `done journal=${journalUpdated} seizures=${seizureUpdated} dry_run=${DRY_RUN}`,
);
process.exit(0);
