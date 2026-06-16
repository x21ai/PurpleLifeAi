#!/usr/bin/env bash
# Import public-schema CSVs into the new Supabase project in FK-safe order.
# Usage: ./import.sh "$NEW_DB_URL"
# CSV files: purple-migration/02-data/<table>.csv (HEADER true)
# Auth tables are loaded separately in Prompt 2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$ROOT/02-data"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <NEW_DB_URL>" >&2
  exit 1
fi

NEW_DB_URL="$1"

# FK-safe import order derived from src/integrations/supabase/types.ts
TABLES=(
  condition_catalog
  behavior_taxonomy
  metric_dictionary
  platform_rules
  research_sources
  community_resources
  app_settings
  promo_codes
  admin_messages
  suppressed_emails
  profiles
  ai_memory
  alerts
  apple_health_tokens
  aura_events
  biometrics
  contact_messages
  feedback
  food_entries
  friendships
  hydration_intake
  metric_insights
  oura_tokens
  phi_access_log
  platform_rule_audit
  push_subscriptions
  risk_forecasts
  subscriptions
  trips
  user_roles
  vital_goals
  vitals_log
  whoop_tokens
  email_send_log
  email_send_state
  email_unsubscribe_tokens
  medications
  seizure_events
  medical_reports
  dna_files
  care_relationships
  community_posts
  report_documents
  medication_doses
  medication_side_effects
  medical_report_schedules
  journal_entries
  dna_variants
  care_threads
  promo_code_redemptions
  daily_behaviors
  care_thread_participants
  care_messages
  care_scopes
  care_caregiver_visits
  care_audit_log
  pending_changes
  community_comments
  community_reactions
  community_reports
  medical_report_public_links
  medical_report_shares
  report_identity_aliases
  report_metric_preferences
  report_metrics
  notification_delivery_log
  admin_message_reads
)

sql_file="$(mktemp)"
trap 'rm -f "$sql_file"' EXIT

{
  echo "SET session_replication_role = replica;"
  for table in "${TABLES[@]}"; do
    csv="$DATA_DIR/${table}.csv"
    if [[ ! -f "$csv" ]]; then
      echo "\\echo skip ${table} (no csv)"
      continue
    fi
    echo "\\echo copy ${table}"
    echo "\\copy public.\"${table}\" FROM '${csv}' WITH (FORMAT csv, HEADER true);"
  done
  echo "SET session_replication_role = DEFAULT;"
} > "$sql_file"

psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f "$sql_file"

echo "import.sh finished"
