
-- Seed today's medication_doses rows and reconcile yesterday's misses.
create or replace function public.seed_daily_medication_doses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  med record;
  t text;
  scheduled timestamptz;
begin
  -- Mark previous still-pending doses as missed.
  update public.medication_doses
  set status = 'missed'
  where status = 'pending'
    and scheduled_at < date_trunc('day', now());

  for med in
    select id, user_id, times_of_day, start_date, end_date
    from public.medications
    where active = true
      and is_rescue = false
      and (start_date is null or start_date <= current_date)
      and (end_date is null or end_date >= current_date)
  loop
    if med.times_of_day is null then continue; end if;
    foreach t in array med.times_of_day
    loop
      begin
        scheduled := (current_date::text || ' ' || t)::timestamptz;
      exception when others then
        continue;
      end;

      insert into public.medication_doses (user_id, medication_id, scheduled_at, status)
      select med.user_id, med.id, scheduled, 'pending'
      where not exists (
        select 1 from public.medication_doses d
        where d.medication_id = med.id
          and d.scheduled_at = scheduled
      );
    end loop;
  end loop;
end;
$$;

-- Adherence over the last N days for a single medication.
create or replace function public.medication_adherence(med_id uuid, days_back integer default 14)
returns table(scheduled_count bigint, taken_count bigint, adherence_pct numeric)
language sql
stable
security definer
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
    and d.scheduled_at < now() + interval '1 day';
$$;
