ALTER TABLE public.report_metrics ADD COLUMN source_text TEXT;
GRANT SELECT, INSERT, UPDATE ON public.report_metrics TO authenticated;
GRANT ALL ON public.report_metrics TO service_role;