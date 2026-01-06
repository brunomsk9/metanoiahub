-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "Restricted profile access" ON public.profiles;

-- Step 2: Create a new policy WITHOUT direct ministry leader access
-- Ministry leaders will use a secure function instead
CREATE POLICY "Restricted profile access" ON public.profiles
FOR SELECT USING (
  -- Super admin: full access
  public.is_super_admin(auth.uid())
  -- Own profile: always allowed
  OR auth.uid() = id
  -- Church admin: can view all in their church
  OR (
    public.user_belongs_to_church(church_id, auth.uid()) 
    AND public.is_admin_of_own_church(auth.uid())
  )
  -- Discipulador: can only view their direct disciples
  OR public.is_discipulador_of(auth.uid(), id)
);

-- Step 3: Create a secure function for ministry leaders to get volunteer profiles
-- This function returns profile data WITHOUT sensitive fields (telefone)
CREATE OR REPLACE FUNCTION public.get_ministry_volunteer_profiles(ministry_id_param uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  avatar_url text,
  genero public.gender_type,
  church_id uuid,
  role public.app_role,
  xp_points integer,
  current_streak integer,
  is_batizado boolean,
  funcao text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is a leader of this ministry
  IF NOT EXISTS (
    SELECT 1 FROM public.ministries m
    WHERE m.id = ministry_id_param
      AND (m.lider_principal_id = auth.uid() OR m.lider_secundario_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Acesso negado: você não é líder deste ministério';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.avatar_url,
    p.genero,
    p.church_id,
    p.role,
    p.xp_points,
    p.current_streak,
    p.is_batizado,
    mv.funcao
  FROM public.profiles p
  JOIN public.ministry_volunteers mv ON mv.user_id = p.id
  WHERE mv.ministry_id = ministry_id_param;
END;
$$;

-- Step 4: Create a function for ministry leaders to get ALL their volunteers across ministries
CREATE OR REPLACE FUNCTION public.get_all_ministry_volunteers_for_leader()
RETURNS TABLE (
  id uuid,
  nome text,
  avatar_url text,
  genero public.gender_type,
  church_id uuid,
  role public.app_role,
  xp_points integer,
  current_streak integer,
  is_batizado boolean,
  ministry_id uuid,
  ministry_name text,
  funcao text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return volunteers from ministries where the caller is a leader
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.avatar_url,
    p.genero,
    p.church_id,
    p.role,
    p.xp_points,
    p.current_streak,
    p.is_batizado,
    m.id as ministry_id,
    m.nome as ministry_name,
    mv.funcao
  FROM public.profiles p
  JOIN public.ministry_volunteers mv ON mv.user_id = p.id
  JOIN public.ministries m ON m.id = mv.ministry_id
  WHERE m.lider_principal_id = auth.uid() OR m.lider_secundario_id = auth.uid();
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.get_ministry_volunteer_profiles IS 
'Returns volunteer profiles for a specific ministry WITHOUT sensitive fields like telefone. Only accessible to ministry leaders.';

COMMENT ON FUNCTION public.get_all_ministry_volunteers_for_leader IS 
'Returns all volunteers across all ministries the current user leads, WITHOUT sensitive fields like telefone.';