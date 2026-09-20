// CI performance budget for the shared client entry chunk.
// The entry chunk is the largest assets/index-*.js file in the client build.
// Budget = measured entry gzip after Cloudflare client shims (279 kB, 2026-09-20)
// + ~1% headroom. Baseline was 244 kB (2026-06-12) + 10% before D1/auth bundle growth.
// If this fails: move new static imports behind route chunks or dynamic import().
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_GZIP_BYTES = 282_000;

const assetsDir = join(process.cwd(), "dist", "client", "assets");

let entries;
try {
  entries = readdirSync(assetsDir).filter((f) => /^index-.*\.js$/.test(f));
} catch {
  console.error("check-entry-budget: dist/client/assets not found. Run `bun run build` first.");
  process.exit(1);
}

if (entries.length === 0) {
  console.error("check-entry-budget: no assets/index-*.js chunks found.");
  process.exit(1);
}

const largest = entries
  .map((f) => ({ f, size: statSync(join(assetsDir, f)).size }))
  .sort((a, b) => b.size - a.size)[0];

const gzip = gzipSync(readFileSync(join(assetsDir, largest.f))).length;

if (gzip > BUDGET_GZIP_BYTES) {
  console.error(
    `Entry chunk over budget: ${largest.f} is ${gzip} bytes gzipped (budget ${BUDGET_GZIP_BYTES}).`,
  );
  console.error(
    "A static import probably crept into the startup path. Split it out instead of raising the budget.",
  );
  process.exit(1);
}

console.log(
  `Entry chunk within budget: ${largest.f} ${gzip} bytes gzipped (budget ${BUDGET_GZIP_BYTES}). ✓`,
);
