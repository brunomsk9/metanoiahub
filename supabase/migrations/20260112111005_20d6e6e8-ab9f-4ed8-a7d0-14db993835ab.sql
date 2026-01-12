-- Create secure function for church admins to access user auth details (emails) only for their church
CREATE OR REPLACE FUNCTION public.get_church_user_auth_details()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_church_id uuid;
BEGIN
  -- Verify caller is a church admin (not super_admin - they use get_user_auth_details_secure)
  IF NOT public.is_admin_of_own_church(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não é administrador da igreja';
  END IF;

  -- Get the admin's church
  SELECT p.church_id INTO user_church_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Return auth details only for users in the same church
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE p.church_id = user_church_id;
END;
$$;