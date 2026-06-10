## Plan (approved by user)

1. **Delete the two stuck DB rows** for `…vcf.gz.tbi` and `…cram.crai` — already executed via migration ✅.
2. **Replace `window.confirm` with shadcn `AlertDialog`** in `src/routes/_app/my-health-dna.tsx` so the delete button works inside the preview iframe.
3. **No parser change needed** — the existing pipeline already calls `detectProvider` on the decompressed content, so when you upload `…bqsr.hc.gz` the VCF header (`##fileformat=VCF…`) will be detected and parsed regardless of filename. We'll see in practice; if it still misses, we add an explicit content sniff in a follow-up.

After this, refresh `/my-health-dna`:
- The two stuck rows are gone.
- Upload `NG11CBJHKB.mm2.sortdup.bqsr.hc.gz` — that's your actual variant file.
- Delete button now works via in-app dialog.
