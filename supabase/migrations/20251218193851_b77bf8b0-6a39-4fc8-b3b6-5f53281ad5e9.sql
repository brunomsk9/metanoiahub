-- Update handle_new_user function to accept church_id from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _church_id uuid;
BEGIN
  -- Get church_id from user metadata, or use first active church as default
  _church_id := (new.raw_user_meta_data ->> 'church_id')::uuid;
  
  IF _church_id IS NULL THEN
    SELECT id INTO _church_id FROM public.churches WHERE is_active = true LIMIT 1;
  END IF;
  
  INSERT INTO public.profiles (id, nome, church_id)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'nome', ''),
    _church_id
  );
  
  -- Also add default 'discipulo' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'discipulo');
  
  RETURN new;
END;
$$;