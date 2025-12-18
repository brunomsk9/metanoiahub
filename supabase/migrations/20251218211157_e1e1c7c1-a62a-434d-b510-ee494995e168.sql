-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that allows users to update their own profile OR super_admins to update any profile
CREATE POLICY "Users can update their own profile or super_admins can update any"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
);