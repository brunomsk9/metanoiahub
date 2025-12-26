-- Ensure the view runs with the invoker privileges (avoid SECURITY DEFINER view issues)
ALTER VIEW public.v_user_auth_details SET (security_invoker = true);

-- Optional hardening
ALTER VIEW public.v_user_auth_details SET (security_barrier = true);