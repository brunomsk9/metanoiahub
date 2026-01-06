-- Add encrypted columns and search hash columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telefone_encrypted text,
ADD COLUMN IF NOT EXISTS telefone_hash text;

-- Add encrypted columns to newsletter_subscribers
ALTER TABLE public.newsletter_subscribers
ADD COLUMN IF NOT EXISTS email_encrypted text,
ADD COLUMN IF NOT EXISTS email_hash text,
ADD COLUMN IF NOT EXISTS nome_encrypted text;

-- Create indexes for hash columns (for fast search)
CREATE INDEX IF NOT EXISTS idx_profiles_telefone_hash ON public.profiles(telefone_hash);
CREATE INDEX IF NOT EXISTS idx_newsletter_email_hash ON public.newsletter_subscribers(email_hash);