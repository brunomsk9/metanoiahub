-- Create table to associate positions with service types
-- Positions belong to ministries but we mark which ones participate in each service type

CREATE TABLE public.service_type_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_id UUID NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.ministry_positions(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  quantidade_minima INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_type_id, position_id)
);

-- Enable RLS
ALTER TABLE public.service_type_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view service type positions in their church"
ON public.service_type_positions
FOR SELECT
USING (is_super_admin(auth.uid()) OR user_belongs_to_church(auth.uid(), church_id));

CREATE POLICY "Admins can insert service type positions"
ON public.service_type_positions
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

CREATE POLICY "Admins can update service type positions"
ON public.service_type_positions
FOR UPDATE
USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

CREATE POLICY "Admins can delete service type positions"
ON public.service_type_positions
FOR DELETE
USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

-- Add index for faster lookups
CREATE INDEX idx_service_type_positions_service_type ON public.service_type_positions(service_type_id);
CREATE INDEX idx_service_type_positions_position ON public.service_type_positions(position_id);