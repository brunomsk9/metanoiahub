
-- Drop existing INSERT policy that allows discipuladores to create
DROP POLICY IF EXISTS "Discipuladores can create relationships in their church" ON public.discipleship_relationships;

-- Create new INSERT policy that only allows admins
CREATE POLICY "Only admins can create relationships in their church"
ON public.discipleship_relationships
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

-- Add a unique constraint to ensure a disciple can only have ONE active relationship
-- First, create a unique partial index (since we only want uniqueness for active relationships)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_disciple 
ON public.discipleship_relationships (discipulo_id) 
WHERE status = 'active';

-- Create a function to validate that disciple and discipulador are from the same church
CREATE OR REPLACE FUNCTION public.validate_discipleship_same_church()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discipulo_church_id uuid;
  discipulador_church_id uuid;
BEGIN
  -- Get church_id of discipulo
  SELECT church_id INTO discipulo_church_id FROM public.profiles WHERE id = NEW.discipulo_id;
  
  -- Get church_id of discipulador
  SELECT church_id INTO discipulador_church_id FROM public.profiles WHERE id = NEW.discipulador_id;
  
  -- Check if both are from the same church
  IF discipulo_church_id IS DISTINCT FROM discipulador_church_id THEN
    RAISE EXCEPTION 'Discípulo e discipulador devem ser da mesma igreja';
  END IF;
  
  -- Set the church_id on the relationship if not already set
  IF NEW.church_id IS NULL THEN
    NEW.church_id := discipulador_church_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate same church on insert and update
DROP TRIGGER IF EXISTS validate_discipleship_same_church_trigger ON public.discipleship_relationships;
CREATE TRIGGER validate_discipleship_same_church_trigger
BEFORE INSERT OR UPDATE ON public.discipleship_relationships
FOR EACH ROW
EXECUTE FUNCTION public.validate_discipleship_same_church();
