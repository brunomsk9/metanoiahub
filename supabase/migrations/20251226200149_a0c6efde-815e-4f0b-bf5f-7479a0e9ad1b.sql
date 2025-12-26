-- Drop existing policy
DROP POLICY IF EXISTS "Users can view profiles in their church" ON public.profiles;

-- Create updated policy that allows ministry leaders to view all profiles in their church
CREATE POLICY "Users can view profiles in their church" 
ON public.profiles 
FOR SELECT 
USING (
  is_super_admin(auth.uid()) 
  OR (auth.uid() = id) 
  OR (
    user_belongs_to_church(auth.uid(), church_id) 
    AND (
      is_admin_of_own_church(auth.uid()) 
      OR is_discipulador_of(auth.uid(), id)
      OR is_lider_ministerial(auth.uid())
    )
  )
);