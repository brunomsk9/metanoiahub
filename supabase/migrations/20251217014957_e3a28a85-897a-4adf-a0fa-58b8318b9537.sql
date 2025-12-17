-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.resources;

-- Create new policy restricting to discipuladores and admins
CREATE POLICY "Discipuladores and admins can view resources" 
ON public.resources 
FOR SELECT 
USING (
  has_role(auth.uid(), 'discipulador') OR 
  has_role(auth.uid(), 'admin')
);