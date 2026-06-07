
-- Care chat attachments: scope to thread participants only.
-- Path layout: {thread_id}/{message_id_or_pending}/{filename}

CREATE POLICY "care_chat_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'care-chat-attachments'
    AND public.is_care_thread_participant(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
  );

CREATE POLICY "care_chat_attachments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'care-chat-attachments'
    AND public.is_care_thread_participant(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
    AND owner = auth.uid()
  );

CREATE POLICY "care_chat_attachments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'care-chat-attachments'
    AND owner = auth.uid()
  );
