-- Drop and recreate encryption function with correct signature
DROP FUNCTION IF EXISTS public.encrypt_sensitive(text);
DROP FUNCTION IF EXISTS public.decrypt_sensitive(text);

-- Recreate encryption function with correct pgcrypto call
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(plain_text text)
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
  
  -- Use a fixed key derived from database
  encryption_key := encode(
    extensions.digest(current_database() || 'metanoia_secure_key_v1', 'sha256'),
    'hex'
  );
  
  -- pgp_sym_encrypt expects text for first arg
  RETURN encode(
    extensions.pgp_sym_encrypt(plain_text, encryption_key),
    'base64'
  );
END;
$$;

-- Create decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(encrypted_text text)
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
    extensions.digest(current_database() || 'metanoia_secure_key_v1', 'sha256'),
    'hex'
  );
  
  BEGIN
    RETURN extensions.pgp_sym_decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key
    );
  EXCEPTION WHEN OTHERS THEN
    -- Return masked value if decryption fails
    RETURN '***ENCRYPTED***';
  END;
END;
$$;