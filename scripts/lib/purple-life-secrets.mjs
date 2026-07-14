/**
 * Resolve Purple Life secrets from Doppler-injected env (x21/prd PURPLE_LIFE_* names).
 * Legacy unprefixed names accepted for transition from purple-life project.
 */

function firstNonEmpty(...values) {
  for (const v of values) {
    const t = v?.trim?.() ?? "";
    if (t) return t;
  }
  return "";
}

export function readAscCredentials() {
  const KEY_ID = firstNonEmpty(
    process.env.PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID,
    process.env.APP_STORE_CONNECT_KEY_ID,
  );
  const ISSUER_ID = firstNonEmpty(
    process.env.PURPLE_LIFE_APP_STORE_CONNECT_ISSUER_ID,
    process.env.APP_STORE_CONNECT_ISSUER_ID,
  );
  const API_KEY = firstNonEmpty(
    process.env.PURPLE_LIFE_APP_STORE_CONNECT_API_KEY,
    process.env.APP_STORE_CONNECT_API_KEY,
  );
  return { KEY_ID, ISSUER_ID, API_KEY };
}

export function readLuciqSecrets() {
  const apiToken = firstNonEmpty(
    process.env.PURPLE_LIFE_LUCIQ_API_TOKEN,
    process.env.LUCIQ_API_TOKEN,
    process.env.LUCIQ_OAUTH_TOKEN,
  );
  const email = firstNonEmpty(
    process.env.PURPLE_LIFE_LUCIQ_ACCOUNT_EMAIL,
    process.env.LUCIQ_ACCOUNT_EMAIL,
  );
  const sdkToken = firstNonEmpty(
    process.env.PURPLE_LIFE_LUCIQ_APP_TOKEN,
    process.env.LUCIQ_APP_TOKEN,
  );
  return { apiToken, email, sdkToken };
}

export const PURPLE_DOPPLER_PROJECT = "x21";
export const PURPLE_DOPPLER_CONFIG = "prd";

export const ASC_DOPPLER_HINT =
  `Add to Doppler ${PURPLE_DOPPLER_PROJECT}/${PURPLE_DOPPLER_CONFIG}:\n` +
  "  PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID\n" +
  "  PURPLE_LIFE_APP_STORE_CONNECT_ISSUER_ID\n" +
  "  PURPLE_LIFE_APP_STORE_CONNECT_API_KEY (full .p8 file contents)\n" +
  "  PURPLE_LIFE_DEVELOPMENT_TEAM";
