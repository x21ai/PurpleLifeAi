#!/usr/bin/env node
/**
 * Ensures generated Supabase types include schema the app depends on.
 * Fails CI when types.ts is truncated or regenerated against the wrong project.
 *
 * Usage: node scripts/check-supabase-types.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TYPES_PATH = join(process.cwd(), "src/integrations/supabase/types.ts");
const REQUIRED = [
  "health_narratives",
  "sync_mode",
  "community_posts_public",
  "community_comments_public",
];

let text;
try {
  text = readFileSync(TYPES_PATH, "utf8");
} catch {
  console.error("check-supabase-types: missing src/integrations/supabase/types.ts");
  process.exit(1);
}

const missing = REQUIRED.filter((needle) => !text.includes(needle));
if (missing.length > 0) {
  console.error(
    "check-supabase-types: types.ts is incomplete. Missing:",
    missing.join(", "),
  );
  console.error(
    "Only Cursor regenerates this file from project xxnzmfzsjplrutrgbzxy. Lovable must not edit it.",
  );
  process.exit(1);
}

if (text.split("\n").length < 3000) {
  console.error(
    "check-supabase-types: types.ts looks truncated (fewer than 3000 lines). Regenerate from NEW Supabase.",
  );
  process.exit(1);
}

console.log("check-supabase-types: ok");
