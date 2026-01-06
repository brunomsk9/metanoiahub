-- Fix: Remove the security definer view and keep only the function
-- Views with security definer can cause security issues

-- Drop the view that was created
DROP VIEW IF EXISTS public.v_user_auth_details;

-- The function get_user_auth_details_secure() already exists and is properly protected
-- Applications should call the function directly: SELECT * FROM public.get_user_auth_details_secure()

-- Update comment on function
COMMENT ON FUNCTION public.get_user_auth_details_secure IS 
'Returns user authentication details. RESTRICTED: Only accessible to super admins. 
Call directly: SELECT * FROM get_user_auth_details_secure()';