-- Create enum for meeting types
CREATE TYPE public.meeting_type AS ENUM ('individual', 'celula');

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulador_id UUID NOT NULL,
  tipo meeting_type NOT NULL DEFAULT 'individual',
  discipulo_id UUID NULL, -- Only for individual meetings
  data_encontro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notas TEXT,
  local TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table for cell meetings
CREATE TABLE public.meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  discipulo_id UUID NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, discipulo_id)
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for meetings
CREATE POLICY "Discipuladores can view their own meetings"
ON public.meetings FOR SELECT
USING (auth.uid() = discipulador_id OR is_admin(auth.uid()));

CREATE POLICY "Discipuladores can insert their own meetings"
ON public.meetings FOR INSERT
WITH CHECK (auth.uid() = discipulador_id AND has_role(auth.uid(), 'discipulador'));

CREATE POLICY "Discipuladores can update their own meetings"
ON public.meetings FOR UPDATE
USING (auth.uid() = discipulador_id);

CREATE POLICY "Discipuladores can delete their own meetings"
ON public.meetings FOR DELETE
USING (auth.uid() = discipulador_id);

-- RLS policies for attendance
CREATE POLICY "Discipuladores can view attendance for their meetings"
ON public.meeting_attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m 
    WHERE m.id = meeting_id AND (m.discipulador_id = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Discipuladores can insert attendance for their meetings"
ON public.meeting_attendance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meetings m 
    WHERE m.id = meeting_id AND m.discipulador_id = auth.uid()
  )
);

CREATE POLICY "Discipuladores can update attendance for their meetings"
ON public.meeting_attendance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m 
    WHERE m.id = meeting_id AND m.discipulador_id = auth.uid()
  )
);

CREATE POLICY "Discipuladores can delete attendance for their meetings"
ON public.meeting_attendance FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m 
    WHERE m.id = meeting_id AND m.discipulador_id = auth.uid()
  )
);