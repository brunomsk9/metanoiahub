-- Create a function to get public church data (no auth required)
-- This allows the signup flow to work while protecting the main table
CREATE OR REPLACE FUNCTION public.get_public_churches()
RETURNS TABLE (
  id uuid,
  nome text,
  slug text,
  logo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, slug, logo_url
  FROM public.churches
  WHERE is_active = true
  ORDER BY nome
$$;

-- Drop the overly permissive policy that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can view active churches" ON public.churches;

-- Create a new policy requiring authentication for viewing active churches
CREATE POLICY "Authenticated users can view active churches"
ON public.churches
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);