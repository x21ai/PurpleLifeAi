CREATE POLICY report_metrics_caregiver_select ON public.report_metrics
  FOR SELECT
  USING (public.has_care_scope(user_id, auth.uid(), 'reports:read'));