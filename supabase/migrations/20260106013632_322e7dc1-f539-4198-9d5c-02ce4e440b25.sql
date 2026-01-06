-- Views cannot have RLS directly in PostgreSQL
-- Solution: Drop the view and create a secure function instead

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS public.v_user_auth_details;

-- Step 2: Create a secure function that only super admins can access
CREATE OR REPLACE FUNCTION public.get_user_auth_details_secure()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can access this data
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores podem acessar detalhes de autenticação';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at
  FROM auth.users u;
END;
$$;

-- Step 3: Create the view using the secure function for backwards compatibility
-- This view will only work for super admins
CREATE OR REPLACE VIEW public.v_user_auth_details AS
SELECT * FROM public.get_user_auth_details_secure();

-- Step 4: Revoke direct access to the view from public/anon
REVOKE ALL ON public.v_user_auth_details FROM anon;
REVOKE ALL ON public.v_user_auth_details FROM authenticated;

-- Step 5: Grant access only through the function (which has its own security check)
GRANT SELECT ON public.v_user_auth_details TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_user_auth_details_secure IS 
'Returns user authentication details. RESTRICTED: Only accessible to super admins.';

COMMENT ON VIEW public.v_user_auth_details IS 
'View of user authentication details. Protected by security definer function - only super admins can access.';