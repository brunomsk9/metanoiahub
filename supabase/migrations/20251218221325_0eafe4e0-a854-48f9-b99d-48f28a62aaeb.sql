
-- Create a function to get user emails (only accessible by super_admin)
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE public.is_super_admin(auth.uid())
$$;
