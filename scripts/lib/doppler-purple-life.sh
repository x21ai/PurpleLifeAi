#!/usr/bin/env bash
# Shared Doppler project + secret names for Purple Life native iOS / Luciq.
# Source from bash scripts: source "${REPO_ROOT}/scripts/lib/doppler-purple-life.sh"
#
# Runtime location: Doppler project x21, config prd (2026-07-14 migration from purple-life).
# Secret names use PURPLE_LIFE_* prefix in x21/prd.

PURPLE_DOPPLER_PROJECT="${PURPLE_DOPPLER_PROJECT:-${DOPPLER_PROJECT:-x21}}"
PURPLE_DOPPLER_CONFIG="${PURPLE_DOPPLER_CONFIG:-${DOPPLER_CONFIG:-prd}}"

PURPLE_ASC_KEY_ID_SECRET="PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID"
PURPLE_ASC_ISSUER_ID_SECRET="PURPLE_LIFE_APP_STORE_CONNECT_ISSUER_ID"
PURPLE_ASC_API_KEY_SECRET="PURPLE_LIFE_APP_STORE_CONNECT_API_KEY"
PURPLE_DEV_TEAM_SECRET="PURPLE_LIFE_DEVELOPMENT_TEAM"
PURPLE_LUCIQ_APP_SECRET="PURPLE_LIFE_LUCIQ_APP_TOKEN"
PURPLE_LUCIQ_API_SECRET="PURPLE_LIFE_LUCIQ_API_TOKEN"
PURPLE_LUCIQ_EMAIL_SECRET="PURPLE_LIFE_LUCIQ_ACCOUNT_EMAIL"

purple_doppler_get() {
  local key="$1"
  doppler secrets get "$key" \
    --project "${PURPLE_DOPPLER_PROJECT}" \
    --config "${PURPLE_DOPPLER_CONFIG}" \
    --plain 2>/dev/null
}

# Resolve PURPLE_LIFE_* from x21/prd; optional legacy unprefixed name in same project only.
purple_resolve_secret() {
  local prefixed="$1"
  local legacy="${2:-}"
  local val=""
  val="$(purple_doppler_get "${prefixed}")" && [[ -n "${val}" ]] && { printf '%s' "${val}"; return 0; }
  if [[ -n "${legacy}" ]]; then
    val="$(purple_doppler_get "${legacy}")" && [[ -n "${val}" ]] && { printf '%s' "${val}"; return 0; }
  fi
  return 1
}

purple_get_asc_key_id() { purple_resolve_secret "${PURPLE_ASC_KEY_ID_SECRET}" "APP_STORE_CONNECT_KEY_ID"; }
purple_get_asc_issuer_id() { purple_resolve_secret "${PURPLE_ASC_ISSUER_ID_SECRET}" "APP_STORE_CONNECT_ISSUER_ID"; }
purple_get_asc_api_key() { purple_resolve_secret "${PURPLE_ASC_API_KEY_SECRET}" "APP_STORE_CONNECT_API_KEY"; }
purple_get_dev_team() { purple_resolve_secret "${PURPLE_DEV_TEAM_SECRET}" "DEVELOPMENT_TEAM"; }
purple_get_luciq_app_token() { purple_resolve_secret "${PURPLE_LUCIQ_APP_SECRET}" "LUCIQ_APP_TOKEN"; }
purple_get_luciq_api_token() { purple_resolve_secret "${PURPLE_LUCIQ_API_SECRET}" "LUCIQ_API_TOKEN"; }
purple_get_luciq_account_email() { purple_resolve_secret "${PURPLE_LUCIQ_EMAIL_SECRET}" "LUCIQ_ACCOUNT_EMAIL"; }

purple_require_asc_secrets() {
  local missing=0
  for label in \
    "${PURPLE_ASC_KEY_ID_SECRET}" \
    "${PURPLE_ASC_ISSUER_ID_SECRET}" \
    "${PURPLE_ASC_API_KEY_SECRET}"; do
    if ! purple_doppler_get "${label}" >/dev/null 2>&1; then
      missing=1
    fi
  done
  if [[ "${missing}" -ne 0 ]]; then
    if ! purple_get_asc_key_id >/dev/null 2>&1 \
      || ! purple_get_asc_issuer_id >/dev/null 2>&1 \
      || ! purple_get_asc_api_key >/dev/null 2>&1; then
      return 1
    fi
  fi
  return 0
}
