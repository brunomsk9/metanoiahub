-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policy that includes super_admin
CREATE POLICY "Admins and super_admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()));