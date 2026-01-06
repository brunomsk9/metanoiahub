-- Update trigger to use active key version
CREATE OR REPLACE FUNCTION public.encrypt_profile_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_version integer;
BEGIN
  -- Only encrypt if telefone changed
  IF NEW.telefone IS DISTINCT FROM OLD.telefone THEN
    -- Get active key version
    SELECT version INTO active_version FROM encryption_keys WHERE is_active = true;
    active_version := COALESCE(active_version, 1);
    
    NEW.telefone_encrypted := encrypt_with_version(NEW.telefone, active_version);
    NEW.telefone_hash := hash_for_search(NEW.telefone);
    NEW.encryption_key_version := active_version;
  END IF;
  RETURN NEW;
END;
$$;

-- Update newsletter trigger to use active key version
CREATE OR REPLACE FUNCTION public.encrypt_newsletter_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_version integer;
BEGIN
  -- Get active key version
  SELECT version INTO active_version FROM encryption_keys WHERE is_active = true;
  active_version := COALESCE(active_version, 1);

  -- Encrypt email if changed
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email_encrypted := encrypt_with_version(NEW.email, active_version);
    NEW.email_hash := hash_for_search(NEW.email);
    NEW.encryption_key_version := active_version;
  END IF;
  
  -- Encrypt nome if changed
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    NEW.nome_encrypted := encrypt_with_version(NEW.nome, active_version);
    -- Update version if nome changed (same record)
    NEW.encryption_key_version := active_version;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update get_profile_with_phone to use versioned decryption
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
    decrypt_with_version(p.telefone_encrypted, p.encryption_key_version) as telefone,
    p.genero,
    p.church_id
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$;

-- Create function to rotate newsletter subscriber keys
CREATE OR REPLACE FUNCTION public.rotate_all_subscriber_keys(new_version integer, batch_size integer DEFAULT 100)
RETURNS TABLE(rotated_count integer, remaining_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  rotated integer := 0;
  remaining integer;
BEGIN
  -- Only super admins can rotate keys
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super administradores podem rotacionar chaves';
  END IF;

  -- Verify new version exists
  IF NOT EXISTS (SELECT 1 FROM encryption_keys WHERE version = new_version) THEN
    RAISE EXCEPTION 'Versão de chave % não existe', new_version;
  END IF;

  -- Rotate batch of subscribers
  FOR sub_record IN 
    SELECT id, encryption_key_version, email_encrypted, nome_encrypted
    FROM newsletter_subscribers 
    WHERE encryption_key_version != new_version
      AND email_encrypted IS NOT NULL
    LIMIT batch_size
  LOOP
    UPDATE newsletter_subscribers
    SET 
      email_encrypted = encrypt_with_version(
        decrypt_with_version(sub_record.email_encrypted, sub_record.encryption_key_version),
        new_version
      ),
      nome_encrypted = CASE 
        WHEN sub_record.nome_encrypted IS NOT NULL THEN
          encrypt_with_version(
            decrypt_with_version(sub_record.nome_encrypted, sub_record.encryption_key_version),
            new_version
          )
        ELSE NULL
      END,
      encryption_key_version = new_version
    WHERE id = sub_record.id;
    
    rotated := rotated + 1;
  END LOOP;

  -- Count remaining
  SELECT COUNT(*) INTO remaining
  FROM newsletter_subscribers 
  WHERE encryption_key_version != new_version
    AND email_encrypted IS NOT NULL;

  RETURN QUERY SELECT rotated, remaining;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rotate_all_subscriber_keys(integer, integer) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.rotate_all_subscriber_keys IS 'Rotates encryption keys for all newsletter subscribers in batches.';