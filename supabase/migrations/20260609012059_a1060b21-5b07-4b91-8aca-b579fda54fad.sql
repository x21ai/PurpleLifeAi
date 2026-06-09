
-- Owner-scoped storage policies for the dna-uploads bucket.
-- Path convention: {user_id}/{file_id}/...
CREATE POLICY "Owners read their DNA files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners upload their DNA files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners update their DNA files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners delete their DNA files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
