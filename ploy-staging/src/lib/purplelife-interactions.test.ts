import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { appendLocalMessage, hasInvitationToken, isFeedbackReady, isPasswordReady, nextTabBarMinimized, PURPLELIFE_JOURNEYS, PURPLELIFE_JOURNEY_ROUTES } from "./purplelife-interactions.ts";

const here = dirname(fileURLToPath(import.meta.url));
const pagesRoot = resolve(here, "../pages");

function astroFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? astroFiles(path) : entry.name.endsWith(".astro") ? [path] : [];
  });
}

const routePatterns = astroFiles(pagesRoot).map((file) => {
  const route = relative(pagesRoot, file)
    .replaceAll("\\", "/")
    .replace(/\.astro$/, "")
    .replace(/(^|\/)index$/, "");
  const segments = route.split("/").filter(Boolean).map((segment) => {
    if (/^\[\.\.\..+\]$/.test(segment)) return ".+";
    if (/^\[.+\]$/.test(segment)) return "[^/]+";
    return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  return new RegExp(`^/${segments.join("/")}${segments.length ? "" : ""}/?$`);
});

function hasAstroRoute(target: string) {
  const pathname = target.split(/[?#]/)[0] || "/";
  return routePatterns.some((pattern) => pattern.test(pathname));
}

function source(path: string) {
  return readFileSync(resolve(here, "..", path), "utf8");
}

describe("PurpleLife account and form states", () => {
  test("requires a matching password of at least eight characters", () => {
    assert.equal(isPasswordReady("short", "short"), false);
    assert.equal(isPasswordReady("quiet-purple", "different"), false);
    assert.equal(isPasswordReady("quiet-purple", "quiet-purple"), true);
  });

  test("keeps invitation acceptance gated by a runtime token", () => {
    assert.equal(hasInvitationToken(""), false);
    assert.equal(hasInvitationToken("?token="), false);
    assert.equal(hasInvitationToken("?token=preview-token"), true);
    assert.equal(hasInvitationToken("?linkCode=friend-preview"), true);
  });

  test("requires meaningful feedback before submission", () => {
    assert.equal(isFeedbackReady("  "), false);
    assert.equal(isFeedbackReady("ok"), false);
    assert.equal(isFeedbackReady("The reminder was useful."), true);
  });
});

describe("PurpleLife journey route contracts", () => {
  test("keeps canonical handoffs stable", () => {
    assert.deepEqual(PURPLELIFE_JOURNEY_ROUTES, {
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
    });
  });

  test("maps every step in the core journeys to an Astro route", () => {
    for (const [journey, steps] of Object.entries(PURPLELIFE_JOURNEYS)) {
      for (const step of steps) assert.equal(hasAstroRoute(step), true, `${journey} is missing ${step}`);
    }
  });

  test("keeps visible completion handoffs in their routed screens", () => {
    assert.match(source("components/pages/access-preview/page.tsx"), /href="\/reset-password"/);
    assert.match(source("components/pages/capture/page.tsx"), /href: "\/journal\/new"/);
    assert.match(source("components/pages/health-workflows/page.tsx"), /Review journal/);
    assert.match(source("components/pages/health-workflows/page.tsx"), /Review sharing controls/);
    assert.match(source("components/pages/reports-preview/page.tsx"), /href="\/reports\/journal-summary"/);
    assert.match(source("components/pages/utility-mobile/components/screens.tsx"), /href="\/sign-in"/);
  });
});

describe("PurpleLife navigation and local message states", () => {
  test("minimizes on downward scroll and expands near the top or on upward scroll", () => {
    assert.equal(nextTabBarMinimized(false, 100, 108), true);
    assert.equal(nextTabBarMinimized(true, 108, 97), false);
    assert.equal(nextTabBarMinimized(true, 100, 40), false);
    assert.equal(nextTabBarMinimized(false, 100, 103), false);
  });

  test("ignores empty messages and trims submitted copy", () => {
    const messages = ["First message"];
    assert.equal(appendLocalMessage(messages, "   "), messages);
    assert.deepEqual(appendLocalMessage(messages, "  Second message  "), ["First message", "Second message"]);
  });

  test("keeps fixed sheets viewport-anchored and later sections readable", () => {
    const styles = source("styles/globals.css");
    assert.match(styles, /\.purplelife-screen \{\s*animation: none;/);
    assert.doesNotMatch(styles, /opacity: 0\.01;/);
  });

  test("keeps add controls routed or interactive", () => {
    assert.match(source("components/pages/pilot/expanded/page.tsx"), /href="\/capture" aria-label="Add measurement"/);
    assert.match(source("components/pages/pilot/expanded/page.tsx"), /href="\/chat" aria-label="New message"/);
    assert.match(source("components/pages/pilot/detail/page.tsx"), /href="\/capture" aria-label="Add medication"/);
    assert.match(source("components/pages/pilot/today/page.tsx"), /onClick=\{\(\) => setAddOpen\(true\)\}/);
  });
});
