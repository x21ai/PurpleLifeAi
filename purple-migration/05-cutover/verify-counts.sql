-- Print one line per public table: "<name>\t<row count>" via RAISE NOTICE.
DO $$
DECLARE r record; n bigint;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname='public' AND c.relkind='r'
    ORDER BY c.relname
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', r.relname) INTO n;
    RAISE NOTICE '%	%', r.relname, n;
  END LOOP;
END $$;