-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Discipuladores and admins can view resources" ON public.resources;

-- Create policy that allows:
-- - All authenticated users to see livro, musica, pregacao
-- - Only discipuladores/admins to see sos resources
CREATE POLICY "Resource access by category and role" 
ON public.resources 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    categoria IN ('livro', 'musica', 'pregacao') OR 
    (categoria = 'sos' AND (has_role(auth.uid(), 'discipulador') OR has_role(auth.uid(), 'admin')))
  )
);