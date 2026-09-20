#!/usr/bin/env bash
# Shared Flutter --dart-define values for Purple release builds.
#
# Source after scripts/app-build-env.sh. When calling inside doppler run
# (cursor-cloudflare/prd_cloudlfare), VITE_SUPABASE_PUBLISHABLE_KEY must be set.
#
# Override targets for staging:
#   FLUTTER_SITE_URL=https://staging.example.com
#   FLUTTER_WORKER_API_BASE_URL=https://staging.example.com/api
#
# Optional iOS/Android crash reporting:
#   LUCIQ_TOKEN=... (from purple_get_luciq_app_token in doppler-purple-life.sh)

flutter_site_url() {
  printf '%s' "${FLUTTER_SITE_URL:-https://www.purplelife.org}"
}

flutter_worker_api_base_url() {
  if [[ -n "${FLUTTER_WORKER_API_BASE_URL:-}" ]]; then
    printf '%s' "${FLUTTER_WORKER_API_BASE_URL}"
    return
  fi
  printf '%s/api' "$(flutter_site_url)"
}

# Prints dart-define flags for embedding in flutter build commands.
# Usage (inside doppler run):
#   eval "$(flutter_dart_define_flags)"
# Or append to a command:
#   flutter build ios --release $(flutter_dart_define_flags)
flutter_dart_define_flags() {
  local site_url worker_api
  site_url="$(flutter_site_url)"
  worker_api="$(flutter_worker_api_base_url)"

  printf '%s\n' \
    "--dart-define=SUPABASE_ANON_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY:?VITE_SUPABASE_PUBLISHABLE_KEY required}" \
    "--dart-define=SITE_URL=${site_url}" \
    "--dart-define=WORKER_API_BASE_URL=${worker_api}" \
    "--dart-define=BUILD_DATE=${BUILD_DATE:?BUILD_DATE required (source app-build-env.sh)}"

  if [[ -n "${LUCIQ_TOKEN:-}" ]]; then
    printf '%s\n' "--dart-define=LUCIQ_APP_TOKEN=${LUCIQ_TOKEN}"
  fi
}
