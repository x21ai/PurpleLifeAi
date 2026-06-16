#!/usr/bin/env bash
# Export auth + public table data from OLD into purple-migration/02-data/*.csv
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$ROOT/02-data"
CUTOVER_DIR="$ROOT/05-cutover"
# shellcheck source=lib.sh
source "$ROOT/lib.sh"

load_env
require_cmd psql
require_url OLD_DB_URL "$OLD_DB_URL"

mkdir -p "$DATA_DIR" "$CUTOVER_DIR"

# Auth tables (Prompt 2) - FK-safe order
AUTH_TABLES=(
  "01_auth_users:auth.users"
  "02_auth_identities:auth.identities"
  "03_auth_sessions:auth.sessions"
  "04_auth_refresh_tokens:auth.refresh_tokens"
  "05_auth_mfa_factors:auth.mfa_factors"
  "06_auth_mfa_challenges:auth.mfa_challenges"
  "07_auth_one_time_tokens:auth.one_time_tokens"
)

# Public tables - same order as import.sh
PUBLIC_TABLES=(
  condition_catalog behavior_taxonomy metric_dictionary platform_rules
  research_sources community_resources app_settings promo_codes admin_messages
  suppressed_emails profiles ai_memory alerts apple_health_tokens aura_events
  biometrics contact_messages feedback food_entries friendships hydration_intake
  metric_insights oura_tokens phi_access_log platform_rule_audit push_subscriptions
  risk_forecasts subscriptions trips user_roles vital_goals vitals_log whoop_tokens
  email_send_log email_send_state email_unsubscribe_tokens medications seizure_events
  medical_reports dna_files care_relationships community_posts report_documents
  medication_doses medication_side_effects medical_report_schedules journal_entries
  dna_variants care_threads promo_code_redemptions daily_behaviors
  care_thread_participants care_messages care_scopes care_caregiver_visits
  care_audit_log pending_changes community_comments community_reactions
  community_reports medical_report_public_links medical_report_shares
  report_identity_aliases report_metric_preferences report_metrics
  notification_delivery_log admin_message_reads
)

export_table() {
  local qualified="$1"
  local outfile="$2"
  local schema="${qualified%%.*}"
  local table="${qualified#*.}"
  echo "export $qualified -> $outfile"
  psql "$OLD_DB_URL" -v ON_ERROR_STOP=1 -c "\\copy (SELECT * FROM ${schema}.\"${table}\") TO '${outfile}' WITH (FORMAT csv, HEADER true);"
}

echo "==> Exporting auth tables..."
for entry in "${AUTH_TABLES[@]}"; do
  file="${entry%%:*}"
  qualified="${entry#*:}"
  export_table "$qualified" "$DATA_DIR/${file}.csv"
done

echo "==> Exporting public tables..."
for table in "${PUBLIC_TABLES[@]}"; do
  export_table "public.${table}" "$DATA_DIR/${table}.csv"
done

echo "==> Writing row-counts-source.txt baseline..."
{
  echo "# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) from OLD_DB_URL"
  for entry in "${AUTH_TABLES[@]}"; do
    qualified="${entry#*:}"
    schema="${qualified%%.*}"
    table="${qualified#*.}"
    count=$(psql "$OLD_DB_URL" -Atc "SELECT count(*) FROM ${schema}.\"${table}\";")
    echo "${schema}.${table} ${count}"
  done
  for table in "${PUBLIC_TABLES[@]}"; do
    count=$(psql "$OLD_DB_URL" -Atc "SELECT count(*) FROM public.\"${table}\";")
    echo "public.${table} ${count}"
  done
} > "$CUTOVER_DIR/row-counts-source.txt"

cat > "$CUTOVER_DIR/verify-counts.sql" <<'SQL'
-- Run against NEW_DB_URL after import; diff output to row-counts-source.txt
SELECT schemaname || '.' || relname AS relation, n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'auth')
ORDER BY 1;
SQL

echo "==> CSV export complete. Files in $DATA_DIR"
