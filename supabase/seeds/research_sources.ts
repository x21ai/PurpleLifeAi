/**
 * One-time seed for the curated epilepsy research library.
 *
 * Usage (from repo root, with .env loaded):
 *   bun run supabase/seeds/research_sources.ts
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 *
 * Idempotent: upserts on unique url. Re-run safely after adding entries to
 * research-sources-data.ts.
 */
import { createClient } from "@supabase/supabase-js";
import { RESEARCH_SOURCE_ENTRIES } from "./research-sources-data";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE || !OPENAI_API_KEY) {
  console.error(
    "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY in environment.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function embedText(text: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });
  if (!r.ok) {
    throw new Error(`OpenAI embed failed: ${r.status} ${await r.text()}`);
  }
  const j = await r.json();
  const vec = j.data?.[0]?.embedding;
  if (!vec) throw new Error("No embedding returned");
  return vec;
}

function embedInput(entry: (typeof RESEARCH_SOURCE_ENTRIES)[0]) {
  return [entry.title, entry.abstract, entry.content].join("\n\n");
}

async function main() {
  console.log(`Seeding ${RESEARCH_SOURCE_ENTRIES.length} research sources…`);
  let ok = 0;
  for (const entry of RESEARCH_SOURCE_ENTRIES) {
    const embedding = await embedText(embedInput(entry));
    const { error } = await admin.from("research_sources").upsert(
      {
        title: entry.title,
        authors: entry.authors ?? null,
        publication: entry.publication,
        year: entry.year,
        url: entry.url,
        source_type: entry.source_type,
        evidence_grade: entry.evidence_grade,
        abstract: entry.abstract,
        content: entry.content,
        embedding: embedding as unknown as string,
      },
      { onConflict: "url" },
    );
    if (error) {
      console.error(`Failed: ${entry.title}`, error.message);
      process.exit(1);
    }
    ok++;
    console.log(`  [${ok}/${RESEARCH_SOURCE_ENTRIES.length}] ${entry.title}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
