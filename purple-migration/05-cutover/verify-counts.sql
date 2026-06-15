-- Tab-separated table\tcount for every public table on the CURRENT DB.
-- Run with: psql "$NEW_DB_URL" -At -f verify-counts.sql > counts-new.txt
select format(
  'select %L as table, count(*)::text as rows from public.%I',
  c.relname, c.relname
)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname
\gexec