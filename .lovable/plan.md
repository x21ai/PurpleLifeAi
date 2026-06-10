## Why you're seeing no DNA metrics

The three files you uploaded are alignment outputs from a sequencing pipeline, not parseable variant tables:

- `…bqsr.hc.gz` — likely a HaplotypeCaller intermediate (not a `.vcf.gz`, no `#CHROM` header to parse)
- `…bqsr.hc.vcf.gz.tbi` — **index file only** (Tabix index, ~tens of KB, no data)
- `…bqsr.cram.crai` — **index file only** (CRAM index, no reads)

Our parser (`src/lib/dna-parse.server.ts`) only extracts genotypes from:
- 23andMe / AncestryDNA / MyHeritage / FTDNA raw text exports (`.txt`/`.tsv`/`.csv`)
- `.vcf` / `.vcf.gz` (full VCF with header + records)
- `.json` exports
- inside `.zip` / `.tar.gz` if one of the above is in there

`.bam`, `.cram`, `.tbi`, `.crai`, `.bai`, `.csi` are explicitly skipped — they're stored privately but produce **zero variants**, which is why no metrics render. The fine-print under the uploader already says this ("Alignment files (.bam / .cram) are stored but not yet parsed"), but the row badges currently say `UNKNOWN · PARSED` which is misleading — "parsed" implies we got data when we didn't.

### What to upload to actually see metrics
- A real `.vcf.gz` (the file BEFORE `.tbi` — typically a few MB to hundreds of MB, header starts with `##fileformat=VCFv4`)
- Or your 23andMe / Ancestry raw data export (`.txt` or zipped)

### Small fixes I'd make in this pass
1. **Honest status badges**: when `kind` is `bam`/`cram`/`index` and `variants.length === 0`, show `STORED · NOT PARSED` (amber) instead of `PARSED`, with a tooltip: "Alignment/index file — upload the matching `.vcf.gz` or raw genotype export to see metrics."
2. **Inline hint on the uploader** when the last upload was an index/alignment file: "Looks like a sequencing index. We need the `.vcf.gz` (not `.tbi`) or your raw genotype `.txt` to extract markers."
3. **Reject `.tbi` / `.crai` / `.bai` / `.csi` at the picker** with a friendly toast — they're pure index sidecars, nothing for us to ever do with them alone.

No schema changes; just `dna-parse.server.ts` returning a clearer status and `my-health-dna.tsx` rendering it.

---

## What's left from the Pro/billing track

Already done in this session:
- ✅ `pro_free_for_everyone` flag + `isPro` helper
- ✅ Billing serverFns + admin toggle at `/admin/billing`
- ✅ `<ProGate>` wrapping DNA upload, Ask Purple 24h limit, report sharing, monthly auto-report, caregiver seats > 1
- ✅ Public `/pricing` page with banner, FAQ, JSON-LD

Still open (parked until you flip the free flag off):
- Add the 5 Stripe test secrets and run a real checkout end-to-end
- Server-side enforcement of the Ask Purple 24h limit (today it's client-side only — fine while everyone is free, but trivially bypassable once gated)
- Stripe customer portal link in `/account` (cancel / change plan / update card)
- Webhook idempotency log table so retried Stripe events don't double-apply
- Receipts / invoice history surface in account
- "Refer a friend → free month" if you want growth loops before launch

---

## Proposed next move

1. **Now (5 min):** ship the three DNA UX fixes above so the page tells the truth about what was and wasn't parsed.
2. **Then:** you tell me — back to DNA/Today/Care feature work, or knock out the post-flip billing items (portal + webhook log + server-side Ask limit) so flipping the switch is a one-click moment later?
