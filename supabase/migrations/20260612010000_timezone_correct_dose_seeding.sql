-- Time integrity fixes for daily dose seeding (see PR "time integrity"):
-- 1. Pending doses are marked missed at the USER'S local midnight, not UTC
--    midnight. Previously, evening doses in UTC+10 could flip to missed up to
--    10 hours early, and UTC-8 doses could linger into the next local morning.
-- 2. Medication start_date / end_date are compared against the user's local
--    "today" instead of the server's UTC current_date, so meds do not start
--    or stop a day early/late near midnight.
-- The function stays idempotent (NOT EXISTS guards), so it is safe to run
-- hourly; each timezone gets its local day seeded shortly after midnight.

CREATE OR REPLACE FUNCTION public.seed_daily_medication_doses()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  med record;
  slot jsonb;
  scheduled timestamptz;
  t text;
  amt numeric;
  un text;
  tz text;
  user_today date;
begin
  -- Mark pending doses missed once the USER'S local day has ended.
  update public.medication_doses d
  set status = 'missed'
  where d.status = 'pending'
    and d.scheduled_at < (
      select date_trunc(
               'day',
               now() at time zone coalesce(p.timezone, 'UTC')
             ) at time zone coalesce(p.timezone, 'UTC')
      from public.profiles p
      where p.id = d.user_id
    );

  -- Safety net for doses whose user has no profile row: UTC midnight.
  update public.medication_doses d
  set status = 'missed'
  where d.status = 'pending'
    and d.scheduled_at < date_trunc('day', now())
    and not exists (select 1 from public.profiles p where p.id = d.user_id);

  for med in
    select m.id, m.user_id, m.times_of_day, m.schedule, m.dosage_amount, m.dosage_unit,
           m.start_date, m.end_date, coalesce(p.timezone, 'UTC') as tz
    from public.medications m
    left join public.profiles p on p.id = m.user_id
    where m.active = true
      and m.is_rescue = false
  loop
    tz := med.tz;
    -- today in the user's local timezone
    user_today := (now() at time zone tz)::date;

    -- start/end window evaluated against the user's local today
    if med.start_date is not null and med.start_date > user_today then continue; end if;
    if med.end_date is not null and med.end_date < user_today then continue; end if;

    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then
          continue;
        end;
        amt := nullif(slot->>'amount','')::numeric;
        un := nullif(slot->>'unit','');
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select med.user_id, med.id, scheduled, 'pending', amt, un
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    else
      if med.times_of_day is null then continue; end if;
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then
          continue;
        end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select med.user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    end if;
  end loop;
end;
$function$;

-- The seeder is invoked by the scheduled job through the service role.
REVOKE EXECUTE ON FUNCTION public.seed_daily_medication_doses() FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.seed_daily_medication_doses() TO service_role;
