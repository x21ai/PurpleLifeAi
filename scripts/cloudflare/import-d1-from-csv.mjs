#!/usr/bin/env node
/**
 * Import purple-migration/02-data/*.csv into D1 via wrangler d1 execute batches.
 * No live Supabase credentials required: uses exported CSV bundle only.
 *
 * Usage:
 *   node scripts/cloudflare/import-d1-from-csv.mjs --data-dir purple-migration/02-data [--remote]
 *
 * Requires: wrangler logged in, D1 schema applied (apply-d1-migrations.sh).
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const remote = args.includes("--remote");
const dataIdx = args.indexOf("--data-dir");
const dataDir = dataIdx >= 0 ? args[dataIdx + 1] : join(root, "purple-migration/02-data");

if (!existsSync(dataDir)) {
  console.error(`Data dir not found: ${dataDir}`);
  console.error("Export CSVs from /admin/migration-export first.");
  process.exit(1);
}

// FK-safe order from purple-migration/import.sh
const TABLES = [
  "condition_catalog", "behavior_taxonomy", "metric_dictionary", "platform_rules",
  "research_sources", "community_resources", "app_settings", "promo_codes",
  "admin_messages", "suppressed_emails", "profiles", "ai_memory", "alerts",
  "apple_health_tokens", "aura_events", "biometrics", "contact_messages", "feedback",
  "food_entries", "friendships", "hydration_intake", "metric_insights", "oura_tokens",
  "phi_access_log", "platform_rule_audit", "push_subscriptions", "risk_forecasts",
  "subscriptions", "trips", "user_roles", "vital_goals", "vitals_log", "whoop_tokens",
  "email_send_log", "email_send_state", "email_unsubscribe_tokens", "medications",
  "seizure_events", "medical_reports", "dna_files", "care_relationships",
  "community_posts", "report_documents", "medication_doses", "medication_side_effects",
  "medical_report_schedules", "journal_entries", "dna_variants", "care_threads",
  "promo_code_redemptions", "daily_behaviors", "care_thread_participants", "care_messages",
  "care_scopes", "care_caregiver_visits", "care_audit_log", "pending_changes",
  "community_comments", "community_reactions", "community_reports",
  "medical_report_public_links", "medical_report_shares", "report_identity_aliases",
  "report_metric_preferences", "report_metrics", "notification_delivery_log",
  "admin_message_reads", "health_narratives", "native_push_tokens",
];

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function sqlEscape(v) {
  if (v === "" || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

let total = 0;
for (const table of TABLES) {
  const csvPath = join(dataDir, `${table}.csv`);
  if (!existsSync(csvPath)) {
    console.log(`skip ${table} (no csv)`);
    continue;
  }
  const text = readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) continue;
  const headers = parseCsvLine(lines[0]);
  const batch = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const cols = headers.join(", ");
    const values = vals.map(sqlEscape).join(", ");
    batch.push(`INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${values});`);
  }

  const sqlFile = join(root, `.tmp-import-${table}.sql`);
  writeFileSync(sqlFile, batch.join("\n"));
  const wranglerArgs = ["d1", "execute", "purplelifeai", "--file", sqlFile];
  if (remote) wranglerArgs.push("--remote");
  const res = spawnSync("bunx", ["wrangler", ...wranglerArgs], { stdio: "inherit" });
  unlinkSync(sqlFile);
  if (res.status !== 0) {
    console.error(`Failed importing ${table}`);
    process.exit(res.status ?? 1);
  }
  total += lines.length - 1;
  console.log(`imported ${table}: ${lines.length - 1} rows`);
}

console.log(`Done. ${total} rows imported.`);
