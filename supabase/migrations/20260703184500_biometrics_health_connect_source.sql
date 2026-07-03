-- Allow Health Connect as a biometrics source for native Android sync.
ALTER TABLE public.biometrics DROP CONSTRAINT IF EXISTS biometrics_source_check;
ALTER TABLE public.biometrics ADD CONSTRAINT biometrics_source_check
  CHECK (source = ANY (ARRAY[
    'oura'::text,
    'whoop'::text,
    'apple_health'::text,
    'health_connect'::text,
    'manual'::text,
    'computed'::text
  ]));
