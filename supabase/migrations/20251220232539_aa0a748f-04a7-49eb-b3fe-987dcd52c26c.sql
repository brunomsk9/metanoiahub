-- Create function to count active disciples for a discipulador
CREATE OR REPLACE FUNCTION public.count_active_disciples(_discipulador_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.discipleship_relationships
  WHERE discipulador_id = _discipulador_id
    AND status = 'active'
$$;

-- Create function to validate max disciples limit
CREATE OR REPLACE FUNCTION public.validate_max_disciples()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_disciples integer := 15;
BEGIN
  -- Only check on INSERT or when discipulador_id changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.discipulador_id IS DISTINCT FROM NEW.discipulador_id) THEN
    -- Count current active disciples for the new discipulador
    SELECT COUNT(*)::integer INTO current_count
    FROM public.discipleship_relationships
    WHERE discipulador_id = NEW.discipulador_id
      AND status = 'active'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF current_count >= max_disciples THEN
      RAISE EXCEPTION 'Discipulador já atingiu o limite máximo de % discípulos', max_disciples;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce max disciples limit
CREATE TRIGGER enforce_max_disciples
  BEFORE INSERT OR UPDATE ON public.discipleship_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_max_disciples();