-- Fix process-email-queue pg_cron: pgmq.metrics view does not exist on this PGMQ version.
-- Use direct counts from queue tables instead.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'process-email-queue';

SELECT cron.schedule(
  'process-email-queue',
  '*/1 * * * *',
  $cron$
DO $job$
DECLARE bearer text; cooldown timestamptz; auth_depth bigint; txn_depth bigint;
BEGIN
  SELECT retry_after_until INTO cooldown FROM public.email_send_state WHERE id = 1;
  IF cooldown IS NOT NULL AND cooldown > now() THEN RETURN; END IF;
  SELECT count(*) INTO auth_depth FROM pgmq.q_auth_emails;
  SELECT count(*) INTO txn_depth FROM pgmq.q_transactional_emails;
  IF auth_depth = 0 AND txn_depth = 0 THEN RETURN; END IF;
  SELECT decrypted_secret INTO bearer FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF bearer IS NULL OR length(bearer) < 20 THEN
    RAISE WARNING 'missing vault secret email_queue_service_role_key';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := 'https://www.purplelife.org/api/email/queue/process',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer
    ),
    body := '{}'::jsonb
  );
END $job$;
$cron$
);

SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'process-email-queue';
