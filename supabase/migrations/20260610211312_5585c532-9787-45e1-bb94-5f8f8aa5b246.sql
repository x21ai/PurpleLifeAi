DELETE FROM public.dna_variants
WHERE file_id IN (
  '83d55def-56c7-4c73-b1cb-fcbb48d7ebd6',
  '52461e70-ba6f-4ac3-81dc-506854be84e2'
);

DELETE FROM public.dna_files
WHERE id IN (
  '83d55def-56c7-4c73-b1cb-fcbb48d7ebd6',
  '52461e70-ba6f-4ac3-81dc-506854be84e2'
);