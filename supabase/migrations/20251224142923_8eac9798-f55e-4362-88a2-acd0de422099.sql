-- Create ministries table (areas)
CREATE TABLE public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#8B5CF6',
  icone TEXT DEFAULT 'users',
  lider_principal_id UUID,
  lider_secundario_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ministry volunteers table (many-to-many)
CREATE TABLE public.ministry_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL,
  user_id UUID NOT NULL,
  church_id UUID NOT NULL,
  funcao TEXT DEFAULT 'voluntario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ministry_id, user_id)
);

-- Enable RLS
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_volunteers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_ministries_church_id ON public.ministries(church_id);
CREATE INDEX idx_ministries_lider_principal ON public.ministries(lider_principal_id);
CREATE INDEX idx_ministries_lider_secundario ON public.ministries(lider_secundario_id);
CREATE INDEX idx_ministry_volunteers_ministry ON public.ministry_volunteers(ministry_id);
CREATE INDEX idx_ministry_volunteers_user ON public.ministry_volunteers(user_id);
CREATE INDEX idx_ministry_volunteers_church ON public.ministry_volunteers(church_id);

-- Function to check if user is ministry leader
CREATE OR REPLACE FUNCTION public.is_ministry_leader(_user_id uuid, _ministry_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ministries
    WHERE id = _ministry_id
      AND (lider_principal_id = _user_id OR lider_secundario_id = _user_id)
  )
$$;

-- Create function to check if user has lider_ministerial role (using text comparison)
CREATE OR REPLACE FUNCTION public.is_lider_ministerial(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'lider_ministerial'
  )
$$;

-- Function to validate volunteer can only be in one church
CREATE OR REPLACE FUNCTION public.validate_volunteer_single_church()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_church_id uuid;
BEGIN
  -- Check if user already has volunteering in another church
  SELECT DISTINCT mv.church_id INTO existing_church_id
  FROM public.ministry_volunteers mv
  WHERE mv.user_id = NEW.user_id
    AND mv.church_id != NEW.church_id
  LIMIT 1;
  
  IF existing_church_id IS NOT NULL THEN
    RAISE EXCEPTION 'Voluntário já está vinculado a outra igreja';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to enforce single church rule for volunteers
CREATE TRIGGER validate_volunteer_church
BEFORE INSERT OR UPDATE ON public.ministry_volunteers
FOR EACH ROW
EXECUTE FUNCTION public.validate_volunteer_single_church();

-- RLS Policies for ministries

-- View: Users can view ministries in their church
CREATE POLICY "Users can view ministries in their church"
ON public.ministries
FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR user_belongs_to_church(auth.uid(), church_id)
);

-- Insert: Only admins and lider_ministerial can create
CREATE POLICY "Admins can insert ministries"
ON public.ministries
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND is_lider_ministerial(auth.uid()))
);

-- Update: Admins, lider_ministerial, or ministry leaders can update
CREATE POLICY "Authorized users can update ministries"
ON public.ministries
FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND is_lider_ministerial(auth.uid()))
  OR is_ministry_leader(auth.uid(), id)
);

-- Delete: Only admins can delete
CREATE POLICY "Admins can delete ministries"
ON public.ministries
FOR DELETE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

-- RLS Policies for ministry_volunteers

-- View: Users can view volunteers in their church
CREATE POLICY "Users can view volunteers in their church"
ON public.ministry_volunteers
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR user_belongs_to_church(auth.uid(), church_id)
  OR user_id = auth.uid()
);

-- Insert: Admins, lider_ministerial, or ministry leaders can add volunteers
CREATE POLICY "Authorized users can add volunteers"
ON public.ministry_volunteers
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND is_lider_ministerial(auth.uid()))
  OR is_ministry_leader(auth.uid(), ministry_id)
);

-- Update: Admins, lider_ministerial, or ministry leaders can update
CREATE POLICY "Authorized users can update volunteers"
ON public.ministry_volunteers
FOR UPDATE
USING (
  is_super_admin(auth.uid())
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND is_lider_ministerial(auth.uid()))
  OR is_ministry_leader(auth.uid(), ministry_id)
);

-- Delete: Admins, lider_ministerial, or ministry leaders can remove volunteers
CREATE POLICY "Authorized users can remove volunteers"
ON public.ministry_volunteers
FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND is_lider_ministerial(auth.uid()))
  OR is_ministry_leader(auth.uid(), ministry_id)
);

-- Trigger for updated_at on ministries
CREATE TRIGGER update_ministries_updated_at
BEFORE UPDATE ON public.ministries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();