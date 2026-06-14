CREATE TABLE public.notification_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dose_id uuid REFERENCES public.medication_doses(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  fired_at timestamptz,
  delivery_channel text NOT NULL CHECK (delivery_channel IN ('sw_local', 'web_push')),
  acknowledged_at timestamptz,
  acknowledged_action text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_delivery_user_scheduled
  ON public.notification_delivery_log (user_id, scheduled_at DESC);
CREATE INDEX idx_notification_delivery_dose
  ON public.notification_delivery_log (dose_id);

GRANT SELECT, INSERT, UPDATE ON public.notification_delivery_log TO authenticated;
GRANT ALL ON public.notification_delivery_log TO service_role;

ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read own delivery log" ON public.notification_delivery_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owners insert own delivery log" ON public.notification_delivery_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners update own delivery log" ON public.notification_delivery_log
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());