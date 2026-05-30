-- 1. Timezone-aware daily dose seeding
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
  -- mark prior-day pending as missed (UTC-based bound, fine: gives users full day)
  update public.medication_doses
  set status = 'missed'
  where status = 'pending'
    and scheduled_at < date_trunc('day', now());

  for med in
    select m.id, m.user_id, m.times_of_day, m.schedule, m.dosage_amount, m.dosage_unit,
           m.start_date, m.end_date, coalesce(p.timezone, 'UTC') as tz
    from public.medications m
    left join public.profiles p on p.id = m.user_id
    where m.active = true
      and m.is_rescue = false
      and (m.start_date is null or m.start_date <= current_date)
      and (m.end_date is null or m.end_date >= current_date)
  loop
    tz := med.tz;
    -- today in the user's local timezone
    user_today := (now() at time zone tz)::date;

    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          -- interpret "HH:MM" as local time in user's tz, then convert to UTC tstz
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

-- 2. One-shot helper to regenerate today's PENDING doses for a single user
--    after their timezone changes or after a schedule edit.
CREATE OR REPLACE FUNCTION public.regenerate_today_pending_doses(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  tz text;
  user_today date;
  med record;
  slot jsonb;
  scheduled timestamptz;
  t text;
  amt numeric;
  un text;
  day_start timestamptz;
  day_end timestamptz;
begin
  select coalesce(timezone, 'UTC') into tz from public.profiles where id = _user_id;
  if tz is null then tz := 'UTC'; end if;
  user_today := (now() at time zone tz)::date;
  day_start := (user_today::text || ' 00:00')::timestamp at time zone tz;
  day_end := ((user_today + 1)::text || ' 00:00')::timestamp at time zone tz;

  -- delete only pending doses for today's window (preserve taken/missed/skipped history)
  delete from public.medication_doses
  where user_id = _user_id
    and status = 'pending'
    and scheduled_at >= day_start
    and scheduled_at < day_end;

  for med in
    select id, times_of_day, schedule, dosage_amount, dosage_unit
    from public.medications
    where user_id = _user_id
      and active = true
      and is_rescue = false
      and (start_date is null or start_date <= user_today)
      and (end_date is null or end_date >= user_today)
  loop
    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        amt := nullif(slot->>'amount','')::numeric;
        un := nullif(slot->>'unit','');
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        values (_user_id, med.id, scheduled, 'pending', amt, un)
        on conflict do nothing;
      end loop;
    elsif med.times_of_day is not null then
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        values (_user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit)
        on conflict do nothing;
      end loop;
    end if;
  end loop;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.regenerate_today_pending_doses(uuid) TO authenticated;

-- 3. Auto-fail stuck journal entries (running 'processing' for >15 min).
CREATE OR REPLACE FUNCTION public.cleanup_stuck_journal_entries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  affected integer;
begin
  update public.journal_entries
  set status = 'failed'
  where status = 'processing'
    and created_at < now() - interval '15 minutes';
  GET DIAGNOSTICS affected = ROW_COUNT;
  return affected;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() TO authenticated, service_role;