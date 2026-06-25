
-- Trigger to keep medications.pills_remaining in sync with medication_doses status changes.
-- Decrement when a dose becomes 'taken'; restore when it leaves 'taken'.
-- Uses COALESCE(amount, 1) so doses without a stored amount count as 1 pill.
-- No-op when pills_remaining is NULL (stock not tracked). Clamps at 0.

CREATE OR REPLACE FUNCTION public.medication_doses_pill_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta numeric := 0;
  med_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'taken' THEN
      delta := COALESCE(NEW.amount, 1);
      med_id := NEW.medication_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    med_id := COALESCE(NEW.medication_id, OLD.medication_id);
    IF OLD.status IS DISTINCT FROM 'taken' AND NEW.status = 'taken' THEN
      delta := COALESCE(NEW.amount, 1);
    ELSIF OLD.status = 'taken' AND NEW.status IS DISTINCT FROM 'taken' THEN
      delta := -COALESCE(OLD.amount, 1);
    ELSIF OLD.status = 'taken' AND NEW.status = 'taken'
          AND COALESCE(NEW.amount, 1) <> COALESCE(OLD.amount, 1) THEN
      delta := COALESCE(NEW.amount, 1) - COALESCE(OLD.amount, 1);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'taken' THEN
      delta := -COALESCE(OLD.amount, 1);
      med_id := OLD.medication_id;
    END IF;
  END IF;

  IF delta <> 0 AND med_id IS NOT NULL THEN
    UPDATE public.medications
      SET pills_remaining = GREATEST(0, pills_remaining - delta::int)
      WHERE id = med_id
        AND pills_remaining IS NOT NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medication_doses_pill_stock ON public.medication_doses;
CREATE TRIGGER trg_medication_doses_pill_stock
AFTER INSERT OR UPDATE OR DELETE ON public.medication_doses
FOR EACH ROW EXECUTE FUNCTION public.medication_doses_pill_stock();
