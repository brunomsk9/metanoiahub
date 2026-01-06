-- Create table to track encryption key versions
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL UNIQUE,
  key_hash text NOT NULL, -- Hash of the key for verification (not the actual key)
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  retired_at timestamptz,
  created_by uuid
);

-- Enable RLS - only super admins can manage keys
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Super admins can view key metadata
CREATE POLICY "Super admins can view encryption keys" ON public.encryption_keys
FOR SELECT USING (is_super_admin(auth.uid()));

-- Super admins can manage keys
CREATE POLICY "Super admins can manage encryption keys" ON public.encryption_keys
FOR ALL USING (is_super_admin(auth.uid()));

-- Add key version column to encrypted tables
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS encryption_key_version integer DEFAULT 1;

ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS encryption_key_version integer DEFAULT 1;

-- Create indexes for key version lookups
CREATE INDEX IF NOT EXISTS idx_profiles_key_version ON public.profiles(encryption_key_version);
CREATE INDEX IF NOT EXISTS idx_newsletter_key_version ON public.newsletter_subscribers(encryption_key_version);

-- Insert initial key version (version 1)
INSERT INTO public.encryption_keys (version, key_hash, is_active, created_by)
VALUES (
  1, 
  encode(extensions.digest('metanoia_secure_key_v1', 'sha256'), 'hex'),
  true,
  NULL
)
ON CONFLICT (version) DO NOTHING;

-- Create function to get the current active key version
CREATE OR REPLACE FUNCTION public.get_active_key_version()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT version FROM encryption_keys WHERE is_active = true LIMIT 1;
$$;

-- Create function to encrypt with specific key version
CREATE OR REPLACE FUNCTION public.encrypt_with_version(plain_text text, key_version integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Build key based on version
  encryption_key := encode(
    extensions.digest(current_database() || 'metanoia_secure_key_v' || key_version::text, 'sha256'),
    'hex'
  );
  
  RETURN encode(
    extensions.pgp_sym_encrypt(plain_text, encryption_key),
    'base64'
  );
END;
$$;

-- Create function to decrypt with specific key version
CREATE OR REPLACE FUNCTION public.decrypt_with_version(encrypted_text text, key_version integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN NULL;
  END IF;
  
  encryption_key := encode(
    extensions.digest(current_database() || 'metanoia_secure_key_v' || key_version::text, 'sha256'),
    'hex'
  );
  
  BEGIN
    RETURN extensions.pgp_sym_decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN '***DECRYPTION_FAILED***';
  END;
END;
$$;

-- Update decrypt_sensitive to use key version from record
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_versioned(encrypted_text text, key_version integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN decrypt_with_version(encrypted_text, COALESCE(key_version, 1));
END;
$$;

-- Create function to rotate key for a single profile
CREATE OR REPLACE FUNCTION public.rotate_profile_key(profile_id uuid, new_version integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_version integer;
  decrypted_phone text;
BEGIN
  -- Only super admins can rotate keys
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super administradores podem rotacionar chaves';
  END IF;

  -- Get current version
  SELECT encryption_key_version INTO old_version FROM profiles WHERE id = profile_id;
  
  IF old_version = new_version THEN
    RETURN true; -- Already on this version
  END IF;
  
  -- Decrypt with old key
  SELECT decrypt_with_version(telefone_encrypted, old_version) INTO decrypted_phone
  FROM profiles WHERE id = profile_id;
  
  -- Re-encrypt with new key and update
  UPDATE profiles
  SET 
    telefone_encrypted = encrypt_with_version(decrypted_phone, new_version),
    encryption_key_version = new_version
  WHERE id = profile_id;
  
  RETURN true;
END;
$$;

-- Create function to rotate keys for all profiles (batch)
CREATE OR REPLACE FUNCTION public.rotate_all_profile_keys(new_version integer, batch_size integer DEFAULT 100)
RETURNS TABLE(rotated_count integer, remaining_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
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

  -- Rotate batch of profiles
  FOR profile_record IN 
    SELECT id, encryption_key_version, telefone_encrypted
    FROM profiles 
    WHERE encryption_key_version != new_version
      AND telefone_encrypted IS NOT NULL
    LIMIT batch_size
  LOOP
    UPDATE profiles
    SET 
      telefone_encrypted = encrypt_with_version(
        decrypt_with_version(profile_record.telefone_encrypted, profile_record.encryption_key_version),
        new_version
      ),
      encryption_key_version = new_version
    WHERE id = profile_record.id;
    
    rotated := rotated + 1;
  END LOOP;

  -- Count remaining
  SELECT COUNT(*) INTO remaining
  FROM profiles 
  WHERE encryption_key_version != new_version
    AND telefone_encrypted IS NOT NULL;

  RETURN QUERY SELECT rotated, remaining;
END;
$$;

-- Create function to add a new key version
CREATE OR REPLACE FUNCTION public.add_encryption_key_version(new_version integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can add keys
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super administradores podem adicionar chaves';
  END IF;

  -- Deactivate current active key
  UPDATE encryption_keys SET is_active = false WHERE is_active = true;
  
  -- Insert new key version
  INSERT INTO encryption_keys (version, key_hash, is_active, created_by)
  VALUES (
    new_version,
    encode(extensions.digest('metanoia_secure_key_v' || new_version::text, 'sha256'), 'hex'),
    true,
    auth.uid()
  );
  
  RETURN true;
END;
$$;

-- Create function to get key rotation status
CREATE OR REPLACE FUNCTION public.get_key_rotation_status()
RETURNS TABLE(
  active_version integer,
  total_profiles bigint,
  profiles_on_active bigint,
  profiles_needing_rotation bigint,
  total_subscribers bigint,
  subscribers_on_active bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_version integer;
BEGIN
  -- Only super admins can view status
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas super administradores podem visualizar status de rotação';
  END IF;

  SELECT version INTO current_version FROM encryption_keys WHERE is_active = true;

  RETURN QUERY
  SELECT 
    current_version,
    (SELECT COUNT(*) FROM profiles WHERE telefone_encrypted IS NOT NULL),
    (SELECT COUNT(*) FROM profiles WHERE encryption_key_version = current_version AND telefone_encrypted IS NOT NULL),
    (SELECT COUNT(*) FROM profiles WHERE encryption_key_version != current_version AND telefone_encrypted IS NOT NULL),
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE email_encrypted IS NOT NULL),
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE encryption_key_version = current_version AND email_encrypted IS NOT NULL);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_active_key_version() TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_with_version(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_with_version(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_sensitive_versioned(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_profile_key(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_all_profile_keys(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_encryption_key_version(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_key_rotation_status() TO authenticated;

-- Add comments
COMMENT ON TABLE public.encryption_keys IS 'Tracks encryption key versions for key rotation. Does not store actual keys.';
COMMENT ON FUNCTION public.rotate_all_profile_keys IS 'Rotates encryption keys for all profiles in batches. Call multiple times until remaining_count is 0.';
COMMENT ON FUNCTION public.add_encryption_key_version IS 'Adds a new encryption key version and marks it as active.';
COMMENT ON FUNCTION public.get_key_rotation_status IS 'Returns current key rotation status showing how many records need migration.';