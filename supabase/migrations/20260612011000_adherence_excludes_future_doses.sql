-- Adherence should only judge doses whose time has passed. The previous
-- window extended a day into the future, so tonight's not-yet-due doses
-- counted against the score and the med-detail number disagreed with the
-- meds-list card (which already used <= now()).
create or replace function public.medication_adherence(med_id uuid, days_back integer default 14)
returns table(scheduled_count bigint, taken_count bigint, adherence_pct numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as scheduled_count,
    count(*) filter (where status = 'taken')::bigint as taken_count,
    case when count(*) = 0 then 0
         else round((count(*) filter (where status = 'taken'))::numeric * 100 / count(*), 0)
    end as adherence_pct
  from public.medication_doses d
  where d.medication_id = med_id
    and d.scheduled_at >= now() - make_interval(days => days_back)
    and d.scheduled_at <= now();
$$;
