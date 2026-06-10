-- Backfill dna_files.kind from filename for old rows that predate the kind column.
UPDATE public.dna_files
SET kind = CASE
  WHEN original_filename ~* '\.bam$'                       THEN 'bam'
  WHEN original_filename ~* '\.cram$'                      THEN 'cram'
  WHEN original_filename ~* '\.(tbi|crai|bai|csi)$'        THEN 'index'
  WHEN original_filename ~* '\.vcf(\.gz)?$'                THEN 'vcf'
  WHEN original_filename ~* '\.json(\.gz)?$'               THEN 'json'
  WHEN original_filename ~* '\.(txt|tsv|csv)(\.gz)?$'      THEN 'genotype'
  ELSE 'unknown'
END
WHERE kind IS NULL;