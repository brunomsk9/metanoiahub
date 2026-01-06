-- Create trigger function to auto-encrypt profile phone on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_profile_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only encrypt if telefone changed
  IF NEW.telefone IS DISTINCT FROM OLD.telefone THEN
    NEW.telefone_encrypted := public.encrypt_sensitive(NEW.telefone);
    NEW.telefone_hash := public.hash_for_search(NEW.telefone);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for profiles
DROP TRIGGER IF EXISTS encrypt_phone_trigger ON public.profiles;
CREATE TRIGGER encrypt_phone_trigger
BEFORE INSERT OR UPDATE OF telefone ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_profile_phone();

-- Create trigger function to auto-encrypt newsletter subscriber data on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_newsletter_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt email if changed
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email_encrypted := public.encrypt_sensitive(NEW.email);
    NEW.email_hash := public.hash_for_search(NEW.email);
  END IF;
  
  -- Encrypt nome if changed
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    NEW.nome_encrypted := public.encrypt_sensitive(NEW.nome);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for newsletter_subscribers
DROP TRIGGER IF EXISTS encrypt_newsletter_trigger ON public.newsletter_subscribers;
CREATE TRIGGER encrypt_newsletter_trigger
BEFORE INSERT OR UPDATE OF email, nome ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_newsletter_data();

-- Add comments
COMMENT ON FUNCTION public.encrypt_profile_phone IS 'Automatically encrypts phone when profile is created or updated.';
COMMENT ON FUNCTION public.encrypt_newsletter_data IS 'Automatically encrypts email and name when newsletter subscriber is created or updated.';