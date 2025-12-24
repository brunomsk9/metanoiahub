-- Create volunteer availability table
CREATE TABLE public.volunteer_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, service_id)
);

-- Enable RLS
ALTER TABLE public.volunteer_availability ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view availability in their church"
ON public.volunteer_availability
FOR SELECT
USING (is_super_admin(auth.uid()) OR user_belongs_to_church(auth.uid(), church_id));

CREATE POLICY "Users can insert their own availability"
ON public.volunteer_availability
FOR INSERT
WITH CHECK (auth.uid() = volunteer_id AND user_belongs_to_church(auth.uid(), church_id));

CREATE POLICY "Users can update their own availability"
ON public.volunteer_availability
FOR UPDATE
USING (auth.uid() = volunteer_id);

CREATE POLICY "Users can delete their own availability"
ON public.volunteer_availability
FOR DELETE
USING (auth.uid() = volunteer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_volunteer_availability_updated_at
BEFORE UPDATE ON public.volunteer_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();