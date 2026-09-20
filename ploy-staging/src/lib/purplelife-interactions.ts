/**
 * Canonical handoffs used by the PurpleLife visual journeys. Keeping these
 * together prevents preview flows from drifting away from their real routes.
 */
export const PURPLELIFE_JOURNEY_ROUTES = {
  today: "/today",
  capture: "/capture",
  journal: "/journal",
  journalEntry: "/journal/new",
  sharing: "/sharing",
  care: "/care",
  sharingSettings: "/settings/sharing",
  careInvitation: "/care/accept?token=preview",
  friendInvitation: "/friend/accept?token=preview",
  reports: "/reports",
  reportNew: "/reports/new",
  reportReview: "/reports/journal-summary",
  sharedReport: "/report/journal-summary",
  messages: "/messages",
  conversation: "/messages/care-team",
  signIn: "/sign-in",
  resetPassword: "/reset-password",
} as const;

export const PURPLELIFE_JOURNEYS = {
  accountAccess: ["/sign-in", "/today"],
  passwordRecovery: ["/sign-in", "/reset-password", "/sign-in"],
  dailyCapture: ["/today", "/capture", "/journal/new", "/journal"],
  reportPreparation: ["/sharing", "/reports/new", "/reports/journal-summary", "/reports/documents"],
  careSharing: ["/sharing", "/care", "/settings/sharing"],
  settingsControl: ["/browse", "/settings", "/settings/privacy", "/settings/sharing", "/data"],
} as const;

export function isPasswordReady(password: string, confirmation: string) {
  return password.length >= 8 && password === confirmation;
}

export function hasInvitationToken(search: string) {
  const params = new URLSearchParams(search);
  return ["token", "invite", "shareCode", "linkCode"].some((key) => Boolean(params.get(key)?.trim()));
}

export function nextTabBarMinimized(current: boolean, lastScrollY: number, nextScrollY: number) {
  if (nextScrollY < 80) return false;
  if (nextScrollY > lastScrollY + 5) return true;
  if (nextScrollY < lastScrollY - 5) return false;
  return current;
}

export function appendLocalMessage(messages: string[], draft: string) {
  const message = draft.trim();
  return message ? [...messages, message] : messages;
}

export function isFeedbackReady(message: string) {
  return message.trim().length >= 3;
}
