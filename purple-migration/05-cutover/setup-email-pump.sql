-- Replace __SERVICE_ROLE_KEY__ with Doppler SERVICE_ROLE_KEY before running in Supabase SQL editor
-- Email queue pump for production (NEW Supabase)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'process-email-queue';
DO $$
DECLARE existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM vault.secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF existing_id IS NULL THEN
    PERFORM vault.create_secret('__SERVICE_ROLE_KEY__','email_queue_service_role_key','Bearer token for email queue pump');
  ELSE
    PERFORM vault.update_secret(existing_id, '__SERVICE_ROLE_KEY__');
  END IF;
END $$;
SELECT cron.schedule('process-email-queue','*/1 * * * *',$$
DO $job$
DECLARE bearer text; cooldown timestamptz; auth_depth bigint; txn_depth bigint;
BEGIN
  SELECT retry_after_until INTO cooldown FROM public.email_send_state WHERE id = 1;
  IF cooldown IS NOT NULL AND cooldown > now() THEN RETURN; END IF;
  -- pgmq.metrics view is absent on some PGMQ versions; count queue tables directly.
  SELECT count(*) INTO auth_depth FROM pgmq.q_auth_emails;
  SELECT count(*) INTO txn_depth FROM pgmq.q_transactional_emails;
  IF auth_depth=0 AND txn_depth=0 THEN RETURN; END IF;
  SELECT decrypted_secret INTO bearer FROM vault.decrypted_secrets WHERE name='email_queue_service_role_key' LIMIT 1;
  IF bearer IS NULL OR length(bearer)<20 THEN RAISE WARNING 'missing vault secret'; RETURN; END IF;
  PERFORM net.http_post(url:='https://www.purplelife.org/api/email/queue/process',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||bearer),body:='{}'::jsonb);
END $job$;$$);
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname='process-email-queue';
