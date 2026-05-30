-- Add owner check to regenerate_today_pending_doses to prevent cross-user mutation
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
  -- Owner check: only allow regenerating one's own doses
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

-- Restrict cleanup_stuck_journal_entries to service_role only (maintenance/cron)
REVOKE EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() TO service_role;