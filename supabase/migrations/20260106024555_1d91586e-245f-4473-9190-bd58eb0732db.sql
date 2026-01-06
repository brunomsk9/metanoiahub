-- Migrate existing profiles data to encrypted columns
UPDATE public.profiles
SET 
  telefone_encrypted = public.encrypt_sensitive(telefone),
  telefone_hash = public.hash_for_search(telefone)
WHERE telefone IS NOT NULL 
  AND telefone != ''
  AND telefone_encrypted IS NULL;

-- Migrate newsletter_subscribers data
UPDATE public.newsletter_subscribers
SET 
  email_encrypted = public.encrypt_sensitive(email),
  email_hash = public.hash_for_search(email),
  nome_encrypted = public.encrypt_sensitive(nome)
WHERE email IS NOT NULL 
  AND email_encrypted IS NULL;

-- Create secure function for profiles with decrypted data
CREATE OR REPLACE FUNCTION public.get_profile_with_phone(profile_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  telefone text,
  genero gender_type,
  church_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user can access this profile
  IF NOT (
    auth.uid() = profile_id OR
    is_super_admin(auth.uid()) OR
    is_discipulador_of(auth.uid(), profile_id) OR
    (is_admin_of_own_church(auth.uid()) AND EXISTS (
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() AND p2.id = profile_id 
      AND p1.church_id = p2.church_id
    ))
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    public.decrypt_sensitive(p.telefone_encrypted) as telefone,
    p.genero,
    p.church_id
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$;

-- Create search function for phone
CREATE OR REPLACE FUNCTION public.search_profiles_by_phone(phone_search text)
RETURNS TABLE(
  id uuid,
  nome text,
  telefone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_hash text;
  user_church_id uuid;
BEGIN
  -- Only admins can search
  IF NOT is_admin_of_own_church(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem pesquisar por telefone';
  END IF;
  
  -- Get user's church
  SELECT p.church_id INTO user_church_id FROM profiles p WHERE p.id = auth.uid();
  
  search_hash := public.hash_for_search(phone_search);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    public.decrypt_sensitive(p.telefone_encrypted) as telefone
  FROM profiles p
  WHERE p.telefone_hash = search_hash
    AND p.church_id = user_church_id;
END;
$$;

-- Create search function for newsletter subscribers by email
CREATE OR REPLACE FUNCTION public.search_newsletter_by_email(email_search text)
RETURNS TABLE(
  id uuid,
  email text,
  nome text,
  is_subscribed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_hash text;
BEGIN
  -- Only super admins can search newsletter subscribers
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super administradores podem pesquisar assinantes';
  END IF;
  
  search_hash := public.hash_for_search(email_search);
  
  RETURN QUERY
  SELECT 
    ns.id,
    public.decrypt_sensitive(ns.email_encrypted) as email,
    public.decrypt_sensitive(ns.nome_encrypted) as nome,
    ns.is_subscribed
  FROM newsletter_subscribers ns
  WHERE ns.email_hash = search_hash;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_sensitive(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_sensitive(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hash_for_search(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_with_phone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_by_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_newsletter_by_email(text) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.encrypt_sensitive IS 'Encrypts sensitive data using AES-256 via pgcrypto. Returns base64 encoded ciphertext.';
COMMENT ON FUNCTION public.decrypt_sensitive IS 'Decrypts sensitive data. Returns masked value if decryption fails.';
COMMENT ON FUNCTION public.hash_for_search IS 'Creates a searchable hash of sensitive data for exact-match lookups.';
COMMENT ON FUNCTION public.get_profile_with_phone IS 'Returns profile with decrypted phone. Only accessible to profile owner, super admins, discipuladores, or church admins.';
COMMENT ON FUNCTION public.search_profiles_by_phone IS 'Allows admins to search profiles by phone number using secure hash matching.';
COMMENT ON FUNCTION public.search_newsletter_by_email IS 'Allows super admins to search newsletter subscribers by email using secure hash matching.';