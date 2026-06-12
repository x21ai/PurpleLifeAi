/**
 * Turns any thrown error into words a person should actually read.
 *
 * The rule: raw error messages never reach users. Technical detail goes to
 * the console; the user gets what happened, what Purple is doing about it,
 * and what they can do, in Purple's voice (calm, no jargon, no blame).
 */

const NETWORK_PATTERNS =
  /fetch failed|failed to fetch|networkerror|network error|load failed|err_internet|err_network|abort|timeout|timed out|offline/i;
const AUTH_PATTERNS =
  /jwt|unauthorized|not authenticated|401|session.*(expired|missing)|invalid token/i;
const RATE_PATTERNS = /429|rate limit|too many requests/i;
const SERVER_PATTERNS = /\b5\d\d\b|internal server|server error|unavailable|bad gateway/i;

export function userMessage(error: unknown, fallback: string): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ((error as { message?: string } | null | undefined)?.message ?? "");

  if (raw) console.warn("[purple] error shown to user as calm copy:", raw);

  if (NETWORK_PATTERNS.test(raw)) {
    return "Purple couldn't reach the server. Check your connection and try again; nothing you wrote is lost.";
  }
  if (AUTH_PATTERNS.test(raw)) {
    return "Your session needs a refresh. Sign in again and pick up where you left off.";
  }
  if (RATE_PATTERNS.test(raw)) {
    return "Purple is getting a lot of requests right now. Give it a moment and try again.";
  }
  if (SERVER_PATTERNS.test(raw)) {
    return "Something went wrong on Purple's side, not yours. Try again in a moment.";
  }
  return fallback;
}
