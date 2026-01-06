-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Strict profile access" ON public.profiles;

-- Create more restrictive SELECT policy
-- Users can view:
-- 1. Their own profile
-- 2. Super admins can view all
-- 3. Admins can view profiles from their church
-- 4. Discipuladores can view their disciples' profiles
CREATE POLICY "Secure profile access" ON public.profiles
FOR SELECT USING (
  -- User viewing their own profile
  (auth.uid() = id)
  OR 
  -- Super admins can view all
  is_super_admin(auth.uid())
  OR 
  -- Admins can view profiles from their own church
  (user_belongs_to_church(auth.uid(), church_id) AND is_admin_of_own_church(auth.uid()))
  OR 
  -- Discipuladores can view their disciples' profiles
  is_discipulador_of(auth.uid(), id)
);

-- Add comment explaining the policy
COMMENT ON POLICY "Secure profile access" ON public.profiles IS 
'Restricts profile access to: own profile, super admins, church admins, and discipuladores viewing their disciples. Prevents user enumeration and protects PII like phone numbers.';