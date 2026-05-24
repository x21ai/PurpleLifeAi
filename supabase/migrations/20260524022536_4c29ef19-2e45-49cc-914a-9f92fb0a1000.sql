CREATE UNIQUE INDEX IF NOT EXISTS risk_forecasts_user_for_date_uniq
  ON public.risk_forecasts (user_id, for_date);