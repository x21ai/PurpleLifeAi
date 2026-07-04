#!/usr/bin/env node
/**
 * Fail fast when the Capacitor local shell is missing. TanStack Start does not
 * emit index.html into dist/client; the iOS WebView needs a bundled fallback
 * before server.url loads.
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dirname, "..");
const shellIndex = join(repoRoot, "capacitor-shell", "index.html");
const iosPublicIndex = join(repoRoot, "ios", "App", "App", "public", "index.html");

function fail(message) {
  console.error(`[check-native-shell] ${message}`);
  process.exit(1);
}

if (!existsSync(shellIndex)) {
  fail("Missing capacitor-shell/index.html. Add the minimal shell before native:sync.");
}

const size = statSync(shellIndex).size;
if (size < 32) {
  fail(`capacitor-shell/index.html is too small (${size} bytes).`);
}

if (!existsSync(iosPublicIndex)) {
  fail("Missing ios/App/App/public/index.html. Run: bun run native:sync");
}

console.log("[check-native-shell] OK");
