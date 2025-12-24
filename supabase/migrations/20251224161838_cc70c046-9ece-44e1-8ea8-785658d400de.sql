-- Create table for service types (cultos recorrentes)
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  dia_semana INTEGER, -- 0=domingo, 1=segunda, etc. NULL para eventos únicos
  horario TIME,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for specific service instances (instâncias de cultos/eventos)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  is_special_event BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for ministry positions (posições por ministério)
CREATE TABLE public.ministry_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade_minima INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for schedules (escalas)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.ministry_positions(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, declined, no_response
  confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, position_id, volunteer_id)
);

-- Enable RLS on all tables
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_types
CREATE POLICY "Users can view service types in their church"
ON public.service_types FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Admins can insert service types"
ON public.service_types FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update service types"
ON public.service_types FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete service types"
ON public.service_types FOR DELETE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

-- RLS Policies for services
CREATE POLICY "Users can view services in their church"
ON public.services FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Admins can insert services"
ON public.services FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update services"
ON public.services FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete services"
ON public.services FOR DELETE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
);

-- RLS Policies for ministry_positions
CREATE POLICY "Users can view positions in their church"
ON public.ministry_positions FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Admins and ministry leaders can insert positions"
ON public.ministry_positions FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR is_ministry_leader(auth.uid(), ministry_id)
);

CREATE POLICY "Admins and ministry leaders can update positions"
ON public.ministry_positions FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR is_ministry_leader(auth.uid(), ministry_id)
);

CREATE POLICY "Admins and ministry leaders can delete positions"
ON public.ministry_positions FOR DELETE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR is_ministry_leader(auth.uid(), ministry_id)
);

-- RLS Policies for schedules
CREATE POLICY "Users can view schedules in their church"
ON public.schedules FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Admins and ministry leaders can insert schedules"
ON public.schedules FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR is_ministry_leader(auth.uid(), ministry_id)
);

CREATE POLICY "Admins, ministry leaders and volunteers can update schedules"
ON public.schedules FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR is_ministry_leader(auth.uid(), ministry_id)
  OR (auth.uid() = volunteer_id AND status = 'pending')
);

CREATE POLICY "Admins and ministry leaders can delete schedules"
ON public.schedules FOR DELETE
USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR is_ministry_leader(auth.uid(), ministry_id)
);

-- Create indexes for better performance
CREATE INDEX idx_services_church_date ON public.services(church_id, data_hora);
CREATE INDEX idx_schedules_service ON public.schedules(service_id);
CREATE INDEX idx_schedules_volunteer ON public.schedules(volunteer_id);
CREATE INDEX idx_schedules_ministry ON public.schedules(ministry_id);
CREATE INDEX idx_ministry_positions_ministry ON public.ministry_positions(ministry_id);

-- Trigger for updated_at
CREATE TRIGGER update_service_types_updated_at
  BEFORE UPDATE ON public.service_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();