-- Print one line per public table: "<name>\t<rls_enabled>\t<policy_count>".
DO $$
DECLARE r record; pcount int;
BEGIN
  FOR r IN
    SELECT c.relname, c.relrowsecurity FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname='public' AND c.relkind='r'
    ORDER BY c.relname
  LOOP
    SELECT count(*) INTO pcount FROM pg_policies WHERE schemaname='public' AND tablename = r.relname;
    RAISE NOTICE '%	%	%', r.relname, r.relrowsecurity, pcount;
  END LOOP;
END $$;