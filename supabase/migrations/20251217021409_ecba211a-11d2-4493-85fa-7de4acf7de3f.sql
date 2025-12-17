-- Drop existing policies on discipleship_notes
DROP POLICY IF EXISTS "Discipuladores can view their own notes" ON public.discipleship_notes;
DROP POLICY IF EXISTS "Discipuladores can insert their own notes" ON public.discipleship_notes;
DROP POLICY IF EXISTS "Discipuladores can update their own notes" ON public.discipleship_notes;
DROP POLICY IF EXISTS "Discipuladores can delete their own notes" ON public.discipleship_notes;

-- Create hardened policies that validate relationship ownership
CREATE POLICY "Discipuladores can view their own notes" 
ON public.discipleship_notes 
FOR SELECT 
USING (
  (auth.uid() = discipulador_id AND EXISTS (
    SELECT 1 FROM public.discipleship_relationships dr
    WHERE dr.id = discipleship_notes.relationship_id
      AND dr.discipulador_id = auth.uid()
      AND dr.status = 'active'
  ))
  OR is_admin(auth.uid())
);

CREATE POLICY "Discipuladores can insert their own notes" 
ON public.discipleship_notes 
FOR INSERT 
WITH CHECK (
  auth.uid() = discipulador_id 
  AND EXISTS (
    SELECT 1 FROM public.discipleship_relationships dr
    WHERE dr.id = relationship_id
      AND dr.discipulador_id = auth.uid()
      AND dr.status = 'active'
  )
);

CREATE POLICY "Discipuladores can update their own notes" 
ON public.discipleship_notes 
FOR UPDATE 
USING (
  auth.uid() = discipulador_id 
  AND EXISTS (
    SELECT 1 FROM public.discipleship_relationships dr
    WHERE dr.id = discipleship_notes.relationship_id
      AND dr.discipulador_id = auth.uid()
      AND dr.status = 'active'
  )
);

CREATE POLICY "Discipuladores can delete their own notes" 
ON public.discipleship_notes 
FOR DELETE 
USING (
  (auth.uid() = discipulador_id AND EXISTS (
    SELECT 1 FROM public.discipleship_relationships dr
    WHERE dr.id = discipleship_notes.relationship_id
      AND dr.discipulador_id = auth.uid()
      AND dr.status = 'active'
  ))
  OR is_admin(auth.uid())
);