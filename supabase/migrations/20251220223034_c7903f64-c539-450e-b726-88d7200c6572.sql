-- Create discipleship history table
CREATE TABLE public.discipleship_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulo_id UUID NOT NULL,
  old_discipulador_id UUID,
  new_discipulador_id UUID,
  church_id UUID REFERENCES public.churches(id),
  changed_by UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('assigned', 'transferred', 'removed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discipleship_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view history in their church"
ON public.discipleship_history
FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can insert history in their church"
ON public.discipleship_history
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

-- Create index for better query performance
CREATE INDEX idx_discipleship_history_discipulo ON public.discipleship_history(discipulo_id);
CREATE INDEX idx_discipleship_history_church ON public.discipleship_history(church_id);
CREATE INDEX idx_discipleship_history_created ON public.discipleship_history(created_at DESC);

-- Create trigger function to auto-log discipleship changes
CREATE OR REPLACE FUNCTION public.log_discipleship_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT (new relationship)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.discipleship_history (
      discipulo_id,
      old_discipulador_id,
      new_discipulador_id,
      church_id,
      changed_by,
      change_type
    ) VALUES (
      NEW.discipulo_id,
      NULL,
      NEW.discipulador_id,
      NEW.church_id,
      auth.uid(),
      'assigned'
    );
    RETURN NEW;
  END IF;
  
  -- On UPDATE (transfer or status change)
  IF TG_OP = 'UPDATE' THEN
    -- Only log if discipulador changed
    IF OLD.discipulador_id IS DISTINCT FROM NEW.discipulador_id THEN
      INSERT INTO public.discipleship_history (
        discipulo_id,
        old_discipulador_id,
        new_discipulador_id,
        church_id,
        changed_by,
        change_type
      ) VALUES (
        NEW.discipulo_id,
        OLD.discipulador_id,
        NEW.discipulador_id,
        NEW.church_id,
        auth.uid(),
        'transferred'
      );
    END IF;
    
    -- Log if status changed to inactive (removal)
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      INSERT INTO public.discipleship_history (
        discipulo_id,
        old_discipulador_id,
        new_discipulador_id,
        church_id,
        changed_by,
        change_type
      ) VALUES (
        NEW.discipulo_id,
        NEW.discipulador_id,
        NULL,
        NEW.church_id,
        auth.uid(),
        'removed'
      );
    END IF;
    RETURN NEW;
  END IF;
  
  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.discipleship_history (
      discipulo_id,
      old_discipulador_id,
      new_discipulador_id,
      church_id,
      changed_by,
      change_type
    ) VALUES (
      OLD.discipulo_id,
      OLD.discipulador_id,
      NULL,
      OLD.church_id,
      auth.uid(),
      'removed'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on discipleship_relationships
CREATE TRIGGER on_discipleship_change
  AFTER INSERT OR UPDATE OR DELETE ON public.discipleship_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_discipleship_change();