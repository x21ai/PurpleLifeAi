## Why no metrics show

Your file `…bqsr.hc.gz` is a HaplotypeCaller VCF (gzipped). Our parser correctly decompressed it and identified it as a VCF — that's why it says "Parsed". But it found **0 curated variants**.

The reason: HaplotypeCaller VCFs almost always leave the **ID column as `.`** (no rsid annotation). They only carry chromosome + position. Our matcher only looks at the ID column (`rs429358`, etc.), so every row fails to match the curated allow-list.

This is a parser limitation, not a problem with your file.

## What it's doing with the file right now

- Decompresses `.hc.gz` → reads as VCF text
- Walks each line, checks `cols[2]` (ID) against the curated rsid set
- Since IDs are `.`, nothing matches → empty result, nothing displayed
- The raw file stays in private storage; no whole-genome data is extracted or stored

## The fix

Add **coordinate-based matching** so we can find curated variants in clinical VCFs that lack rsid annotations.

1. **`src/lib/dna-curated-rsids.ts`** — add `chrom` + `pos37` + `pos38` (GRCh37 and GRCh38 coordinates) to every curated entry. Build a lookup map `chr:pos → curatedRsid`. These coordinates are public/static (dbSNP).

2. **`src/lib/dna-parse.server.ts`** — in the VCF branch:
   - First try matching by ID (existing behavior, fast path for 23andMe/Ancestry exports).
   - If ID is `.` or missing, look up `chrom:pos` in both the build-37 and build-38 maps. On hit, synthesize the rsid from the curated entry and decode REF/ALT against the GT field exactly like today.
   - Auto-detect genome build from VCF header (`##reference=…GRCh38…` / `hg19` / `hg38`) and prefer that map; fall back to trying both.
   - Normalize chromosome names (`chr1` vs `1`).

3. **UI** — no changes needed; once variants are extracted the existing "What we found" section will populate.

4. **Re-parse the existing file** — add a small "Re-analyze" button on each file row that calls `parseDnaFile` again so users don't have to delete + re-upload after the parser improves. (Backend already supports re-parse.)

## Technical notes

- Coordinates source: dbSNP build 156 (both GRCh37 and GRCh38). About 50 rsids × 2 builds = ~100 small constants, no network calls.
- Chromosome normalization: strip leading `chr`, map `MT`/`M`/`chrM` to one form.
- Indels in curated set: none currently — all SNVs, so REF/ALT decoding stays trivial.
- The `.cram.crai` and `.vcf.gz.tbi` files remain non-parseable (index sidecars, no biological content) — current behavior is correct.

## Out of scope

- BAM/CRAM parsing (needs a WASM htslib, large dependency).
- Whole-genome interpretation — we keep the curated allow-list philosophy.
