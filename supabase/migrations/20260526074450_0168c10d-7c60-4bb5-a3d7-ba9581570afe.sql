
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.medication_doses
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS unit text;

-- Backfill schedule from existing times_of_day + dosage_amount + dosage_unit
UPDATE public.medications m
SET schedule = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'time', t,
        'amount', m.dosage_amount,
        'unit', COALESCE(m.dosage_unit, 'mg')
      )
      ORDER BY t
    ),
    '[]'::jsonb
  )
  FROM unnest(COALESCE(m.times_of_day, ARRAY[]::text[])) AS t
)
WHERE jsonb_array_length(m.schedule) = 0
  AND COALESCE(array_length(m.times_of_day, 1), 0) > 0;

-- Replace seed_daily_medication_doses to populate amount/unit per scheduled time
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
begin
  update public.medication_doses
  set status = 'missed'
  where status = 'pending'
    and scheduled_at < date_trunc('day', now());

  for med in
    select id, user_id, times_of_day, schedule, dosage_amount, dosage_unit, start_date, end_date
    from public.medications
    where active = true
      and is_rescue = false
      and (start_date is null or start_date <= current_date)
      and (end_date is null or end_date >= current_date)
  loop
    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          scheduled := (current_date::text || ' ' || t)::timestamptz;
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
          scheduled := (current_date::text || ' ' || t)::timestamptz;
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
