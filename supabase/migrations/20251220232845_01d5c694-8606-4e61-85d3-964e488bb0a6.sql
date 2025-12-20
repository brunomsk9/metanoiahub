-- Update the validate_max_disciples function to read limit from church settings
CREATE OR REPLACE FUNCTION public.validate_max_disciples()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_disciples integer;
  church_config jsonb;
BEGIN
  -- Only check on INSERT or when discipulador_id changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.discipulador_id IS DISTINCT FROM NEW.discipulador_id) THEN
    -- Get the church configuration for max disciples
    SELECT c.configuracoes INTO church_config
    FROM public.profiles p
    JOIN public.churches c ON c.id = p.church_id
    WHERE p.id = NEW.discipulador_id;
    
    -- Get max_disciples from config, default to 15 if not set
    max_disciples := COALESCE((church_config->>'max_disciples_per_discipulador')::integer, 15);
    
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

-- Create a function to get max disciples limit for a church
CREATE OR REPLACE FUNCTION public.get_max_disciples_limit(_church_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((configuracoes->>'max_disciples_per_discipulador')::integer, 15)
  FROM public.churches
  WHERE id = _church_id
$$;