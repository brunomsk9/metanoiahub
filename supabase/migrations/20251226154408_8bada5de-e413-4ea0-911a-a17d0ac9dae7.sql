-- Create a view to easily query user auth details
CREATE OR REPLACE VIEW public.v_user_auth_details AS
SELECT * FROM public.get_user_auth_details();

-- Add comment
COMMENT ON VIEW public.v_user_auth_details IS 'View para consultar dados de auth.users (apenas para admins)';