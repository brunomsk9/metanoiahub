-- Fix: Discipuladores só podem ver perfis de seus próprios discípulos
DROP POLICY IF EXISTS "Discipuladores can view discipulos profiles" ON public.profiles;
CREATE POLICY "Discipuladores can view their disciples profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_discipulador_of(auth.uid(), id)
);

-- Fix: Discípulos podem ver seus próprios encontros
DROP POLICY IF EXISTS "Discipuladores can view their own meetings" ON public.meetings;
CREATE POLICY "Users can view their meetings" 
ON public.meetings 
FOR SELECT 
USING (
  auth.uid() = discipulador_id 
  OR auth.uid() = discipulo_id 
  OR is_admin(auth.uid())
);

-- Fix: Discípulos podem ver sua própria presença
DROP POLICY IF EXISTS "Discipuladores can view attendance for their meetings" ON public.meeting_attendance;
CREATE POLICY "Users can view attendance for their meetings" 
ON public.meeting_attendance 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_attendance.meeting_id 
    AND (m.discipulador_id = auth.uid() OR m.discipulo_id = auth.uid() OR is_admin(auth.uid()))
  )
  OR discipulo_id = auth.uid()
);