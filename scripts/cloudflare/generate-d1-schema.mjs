#!/usr/bin/env node
/**
 * Generates cloudflare/migrations/0002_core_schema.sql from the FK-safe table
 * order in purple-migration/import.sh. Output is SQLite/D1 compatible.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const importSh = readFileSync(join(root, "purple-migration/import.sh"), "utf8");

const tableBlock = importSh.match(/TABLES=\(\n([\s\S]*?)\n\)/);
if (!tableBlock) {
  console.error("Could not parse TABLES from import.sh");
  process.exit(1);
}

const tables = [...tableBlock[1].matchAll(/^\s+([a-z_]+)/gm)].map((m) => m[1]);

/** Common column shapes inferred from Supabase types / 01-schema.sql */
const TABLE_COLUMNS = {
  profiles: [
    "id TEXT PRIMARY KEY",
    "first_name TEXT",
    "last_name TEXT",
    "date_of_birth TEXT",
    "diagnosis TEXT",
    "timezone TEXT",
    "home_city TEXT",
    "emergency_contact_name TEXT",
    "emergency_contact_phone TEXT",
    "consent_research INTEGER NOT NULL DEFAULT 0",
    "consent_share_with_caregivers INTEGER NOT NULL DEFAULT 0",
    "caregiver_emails TEXT NOT NULL DEFAULT '[]'",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  medications: [
    "id TEXT PRIMARY KEY",
    "user_id TEXT NOT NULL",
    "name TEXT NOT NULL",
    "dosage TEXT",
    "prescriber TEXT",
    "times_of_day TEXT NOT NULL DEFAULT '[]'",
    "start_date TEXT",
    "end_date TEXT",
    "refill_date TEXT",
    "pills_remaining INTEGER",
    "notes TEXT",
    "is_rescue INTEGER NOT NULL DEFAULT 0",
    "active INTEGER NOT NULL DEFAULT 1",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  journal_entries: [
    "id TEXT PRIMARY KEY",
    "user_id TEXT NOT NULL",
    "captured_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "kind TEXT NOT NULL DEFAULT 'text'",
    "status TEXT NOT NULL DEFAULT 'processing'",
    "text TEXT",
    "voice_transcript TEXT",
    "media_urls TEXT NOT NULL DEFAULT '[]'",
    "ai_summary TEXT",
    "ai_tags TEXT NOT NULL DEFAULT '[]'",
    "ai_extracted TEXT",
    "linked_seizure_id TEXT",
    "linked_medication_dose_id TEXT",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  biometrics: [
    "id TEXT PRIMARY KEY",
    "user_id TEXT NOT NULL",
    "recorded_at TEXT NOT NULL",
    "source TEXT NOT NULL",
    "hr_bpm REAL",
    "hrv_rmssd_ms REAL",
    "hrv_sdnn_ms REAL",
    "resting_hr_bpm REAL",
    "spo2_pct REAL",
    "respiratory_rate_bpm REAL",
    "body_temp_deviation_c REAL",
    "skin_temp_c REAL",
    "sleep_total_min REAL",
    "sleep_rem_min REAL",
    "sleep_deep_min REAL",
    "sleep_light_min REAL",
    "sleep_awake_min REAL",
    "sleep_latency_min REAL",
    "sleep_efficiency_pct REAL",
    "sleep_score REAL",
    "oura_readiness_score REAL",
    "oura_stress_score REAL",
    "oura_resilience_level TEXT",
    "oura_activity_score REAL",
    "whoop_recovery_pct REAL",
    "whoop_strain REAL",
    "whoop_sleep_performance_pct REAL",
    "menstrual_phase TEXT",
    "cycle_day INTEGER",
    "steps INTEGER",
    "active_calories REAL",
    "workout_minutes REAL",
    "raw_payload TEXT",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  oura_tokens: [
    "user_id TEXT PRIMARY KEY",
    "access_token TEXT NOT NULL",
    "refresh_token TEXT",
    "token_type TEXT",
    "expires_at TEXT",
    "scope TEXT",
    "sync_mode TEXT DEFAULT 'visit'",
    "sync_interval_hours INTEGER DEFAULT 0",
    "last_sync_at TEXT",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  whoop_tokens: [
    "user_id TEXT PRIMARY KEY",
    "access_token TEXT NOT NULL",
    "refresh_token TEXT",
    "token_type TEXT",
    "expires_at TEXT",
    "scope TEXT",
    "sync_mode TEXT DEFAULT 'visit'",
    "sync_interval_hours INTEGER DEFAULT 0",
    "last_sync_at TEXT",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  health_narratives: [
    "user_id TEXT NOT NULL",
    "day TEXT NOT NULL",
    "narrative TEXT NOT NULL",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "PRIMARY KEY (user_id, day)",
  ],
  admin_messages: [
    "id TEXT PRIMARY KEY",
    "sender_id TEXT NOT NULL",
    "subject TEXT NOT NULL",
    "body TEXT NOT NULL",
    "is_broadcast INTEGER NOT NULL DEFAULT 0",
    "recipient_id TEXT",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
  email_queue: [
    "id TEXT PRIMARY KEY",
    "recipient TEXT NOT NULL",
    "subject TEXT NOT NULL",
    "html_body TEXT NOT NULL",
    "text_body TEXT",
    "status TEXT NOT NULL DEFAULT 'pending'",
    "attempts INTEGER NOT NULL DEFAULT 0",
    "last_error TEXT",
    "scheduled_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "sent_at TEXT",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ],
};

function genericColumns(table) {
  return [
    "id TEXT PRIMARY KEY",
    "user_id TEXT",
    "payload TEXT NOT NULL DEFAULT '{}'",
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
  ];
}

const lines = [
  "-- D1 core public schema (SQLite). Generated by scripts/cloudflare/generate-d1-schema.mjs",
  "-- Replaces Supabase public.* tables. RLS is enforced in Worker code, not SQL.",
  "-- Apply after 0001_auth.sql",
  "",
];

for (const table of tables) {
  const cols = TABLE_COLUMNS[table] ?? genericColumns(table);
  lines.push(`CREATE TABLE IF NOT EXISTS ${table} (`);
  lines.push(`  ${cols.join(",\n  ")}`);
  lines.push(");");
  if (cols.some((c) => c.includes("user_id"))) {
    lines.push(`CREATE INDEX IF NOT EXISTS ${table}_user_idx ON ${table} (user_id);`);
  }
  lines.push("");
}

lines.push("INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0002_core_schema');");
lines.push("");

const out = join(root, "cloudflare/migrations/0002_core_schema.sql");
writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${out} (${tables.length} tables)`);
