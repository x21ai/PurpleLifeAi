-- Fix regenerate_today_pending_doses: do not insert a pending row when any dose
-- already exists at the same medication_id + scheduled_at (e.g. after Taken).
-- Also remove duplicate pending rows left by the old behavior.

-- One-time cleanup: drop pending rows that duplicate a non-pending row same slot.
DELETE FROM public.medication_doses pending
WHERE pending.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.medication_doses existing
    WHERE existing.medication_id = pending.medication_id
      AND existing.scheduled_at = pending.scheduled_at
      AND existing.id <> pending.id
      AND existing.status IN ('taken', 'missed', 'skipped')
  );

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
  if _user_id is null or _user_id <> auth.uid() then
    raise exception 'Forbidden: cannot regenerate doses for another user';
  end if;

  select coalesce(timezone, 'UTC') into tz from public.profiles where id = _user_id;
  if tz is null then tz := 'UTC'; end if;
  user_today := (now() at time zone tz)::date;
  day_start := (user_today::text || ' 00:00')::timestamp at time zone tz;
  day_end := ((user_today + 1)::text || ' 00:00')::timestamp at time zone tz;

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
        select _user_id, med.id, scheduled, 'pending', amt, un
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    elsif med.times_of_day is not null then
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select _user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    end if;
  end loop;
end;
$function$;
