-- Emit "table<TAB>rowcount" for every public table on the connected DB.
-- Run with: psql "$NEW_DB_URL" -At -F $'\t' -f verify-counts.sql > counts-new.txt
select string_agg(
  format('select %L::text as t, count(*)::text as c from public.%I', c.relname, c.relname),
  E'\nunion all\n'
) || E'\norder by t'
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relkind='r'
\gset sql_
:sql_string_agg ;