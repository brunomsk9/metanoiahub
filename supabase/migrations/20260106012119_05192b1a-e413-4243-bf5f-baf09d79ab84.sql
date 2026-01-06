-- Drop existing SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view profiles in their church" ON public.profiles;

-- Create more restrictive SELECT policy
-- Users can view:
-- 1. Their own profile (full access)
-- 2. Super admins can view all
-- 3. Church admins can view all in their church
-- 4. Discipuladores can view only their direct disciples
-- 5. Lider ministerial can view volunteers in their ministries
CREATE POLICY "Restricted profile access" ON public.profiles
FOR SELECT USING (
  -- Super admin: full access
  public.is_super_admin(auth.uid())
  -- Own profile: always allowed
  OR auth.uid() = id
  -- Church admin: can view all in their church
  OR (
    public.user_belongs_to_church(auth.uid(), church_id) 
    AND public.is_admin_of_own_church(auth.uid())
  )
  -- Discipulador: can only view their direct disciples
  OR public.is_discipulador_of(auth.uid(), id)
  -- Lider ministerial: can view volunteers in ministries they lead
  OR (
    public.is_lider_ministerial(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ministry_volunteers mv
      JOIN public.ministries m ON m.id = mv.ministry_id
      WHERE mv.user_id = profiles.id
        AND (m.lider_principal_id = auth.uid() OR m.lider_secundario_id = auth.uid())
    )
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "Restricted profile access" ON public.profiles IS 
'Restricts profile viewing: users see own profile, admins see church members, discipuladores see only direct disciples, ministry leaders see their volunteers. Protects sensitive data like phone numbers.';