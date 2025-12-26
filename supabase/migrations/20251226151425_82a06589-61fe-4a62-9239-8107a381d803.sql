-- Function to get user details from auth.users (for admins only)
CREATE OR REPLACE FUNCTION public.get_user_auth_details()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  WHERE public.is_admin_of_own_church(auth.uid()) 
     OR public.is_super_admin(auth.uid())
$$;