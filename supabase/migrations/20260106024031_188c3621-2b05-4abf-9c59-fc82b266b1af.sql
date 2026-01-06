-- Recreate encryption function using qualified pgcrypto functions
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
  
  RETURN encode(
    extensions.pgp_sym_encrypt(plain_text::bytea, encryption_key, 'compress-algo=1, cipher-algo=aes256'),
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
    RETURN convert_from(
      extensions.pgp_sym_decrypt(
        decode(encrypted_text, 'base64'),
        encryption_key
      ),
      'UTF8'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Return masked value if decryption fails
    RETURN '***ENCRYPTED***';
  END;
END;
$$;

-- Create hash function for searchable encryption
CREATE OR REPLACE FUNCTION public.hash_for_search(plain_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Normalize and hash for search (lowercase, trimmed)
  RETURN encode(
    extensions.digest(lower(trim(plain_text)), 'sha256'),
    'hex'
  );
END;
$$;