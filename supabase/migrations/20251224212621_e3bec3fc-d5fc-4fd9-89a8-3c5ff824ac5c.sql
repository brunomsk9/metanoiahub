-- Function to auto-add ministry leader as volunteer
CREATE OR REPLACE FUNCTION public.auto_add_leader_as_volunteer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Add lider_principal as volunteer if not already
  IF NEW.lider_principal_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR 
    (TG_OP = 'UPDATE' AND OLD.lider_principal_id IS DISTINCT FROM NEW.lider_principal_id)
  ) THEN
    INSERT INTO public.ministry_volunteers (ministry_id, user_id, church_id, funcao)
    VALUES (NEW.id, NEW.lider_principal_id, NEW.church_id, 'lider_principal')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add lider_secundario as volunteer if not already
  IF NEW.lider_secundario_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR 
    (TG_OP = 'UPDATE' AND OLD.lider_secundario_id IS DISTINCT FROM NEW.lider_secundario_id)
  ) THEN
    INSERT INTO public.ministry_volunteers (ministry_id, user_id, church_id, funcao)
    VALUES (NEW.id, NEW.lider_secundario_id, NEW.church_id, 'lider_secundario')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create unique constraint to allow ON CONFLICT
ALTER TABLE public.ministry_volunteers 
ADD CONSTRAINT ministry_volunteers_unique_user_ministry 
UNIQUE (ministry_id, user_id);

-- Create trigger on ministries table
CREATE TRIGGER auto_add_leader_volunteer
  AFTER INSERT OR UPDATE OF lider_principal_id, lider_secundario_id
  ON public.ministries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_leader_as_volunteer();