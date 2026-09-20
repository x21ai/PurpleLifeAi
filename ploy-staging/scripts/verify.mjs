#!/usr/bin/env node
// @ts-check
/**
 * Verify the project compiles and builds cleanly.
 *
 * Runs ESLint alongside Astro sync, then overlaps the read-only Astro check
 * with the build. Each child has its own combined stdout/stderr buffer.
 * Waits for all children, then emits only the first failure in step order,
 * without ANSI formatting, and exits with that step's code. Success is silent.
 *
 * Run via `bun run verify` / `npm run verify` — those runners add
 * `./node_modules/.bin` to PATH so the bare `astro` spawn resolves.
 */

import { spawn } from "node:child_process";
import { exit } from "node:process";
import { stripVTControlCharacters } from "node:util";

const env = {
  ...process.env,
  // Disable ANSI at the source for anything that honors these. astro CLI,
  // vite, tsc, rollup all do. @astrojs/check's diagnostic formatter does
  // not — that's handled by stripVTControlCharacters() below.
  NO_COLOR: "1",
  FORCE_COLOR: "0",
  // CI=1 makes some tools pick their non-interactive, non-TTY code paths
  // (no spinners, no progress bars, no prompts).
  CI: "1",
};

/**
 * Spawn a command, capture stdout+stderr together, resolve with exit code
 * and combined buffer. Preserves interleaving as best as Node's stream
 * events allow — good enough for human and LLM reading.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @returns {Promise<{ code: number; output: string }>}
 */
function run(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    proc.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    proc.on("error", (err) => {
      resolve({ code: 1, output: `${output}\n${err.message}` });
    });
    proc.on("close", (code) => {
      resolve({ code: code ?? 1, output });
    });
  });
}

async function runAstroChecks() {
  // `check` normally syncs first. Overlapping that sync with the build makes
  // Cloudflare's workerd contend for the same SQLite state and Vite caches.
  const sync = await run("astro", ["sync"]);
  if (sync.code !== 0) return [sync];

  return Promise.all([
    run("astro", ["check", "--noSync"]),
    run("astro", ["build"]),
  ]);
}

const [lintResult, astroResults] = await Promise.all([
  run("eslint", [
    ".",
    "--cache",
    "--cache-location",
    ".astro/eslintcache",
    "--cache-strategy",
    "content",
  ]),
  runAstroChecks(),
]);

for (const { code, output } of [lintResult, ...astroResults]) {
  if (code !== 0) {
    // Failure: write the buffer (minus ANSI) to STDERR, then exit with
    // the step's code. stderr is the right channel for diagnostics, and
    // it's also the stream that `bun run` / sandbox bash executors tend
    // to surface on non-zero exit — so the caller actually sees it.
    process.stderr.write(stripVTControlCharacters(output));
    exit(code);
  }
}

// Success: exit silently. Nothing to print.
exit(0);
