-- Create junction table for service types and ministries
CREATE TABLE public.service_type_ministries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_id uuid NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
  ministry_id uuid NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(service_type_id, ministry_id)
);

-- Enable RLS
ALTER TABLE public.service_type_ministries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view service type ministries in their church"
ON public.service_type_ministries
FOR SELECT
USING (is_super_admin(auth.uid()) OR user_belongs_to_church(auth.uid(), church_id));

CREATE POLICY "Admins can insert service type ministries"
ON public.service_type_ministries
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

CREATE POLICY "Admins can update service type ministries"
ON public.service_type_ministries
FOR UPDATE
USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

CREATE POLICY "Admins can delete service type ministries"
ON public.service_type_ministries
FOR DELETE
USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));