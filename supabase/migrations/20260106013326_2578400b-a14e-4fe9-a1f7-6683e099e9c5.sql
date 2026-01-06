-- Step 1: Drop existing policy
DROP POLICY IF EXISTS "Restricted profile access" ON public.profiles;

-- Step 2: Create stricter policy - only owner and super admin have direct access
-- Church admins will use a secure function instead
CREATE POLICY "Strict profile access" ON public.profiles
FOR SELECT USING (
  -- Super admin: full access
  public.is_super_admin(auth.uid())
  -- Own profile: always allowed (full access)
  OR auth.uid() = id
);

-- Step 3: Create secure function for church admins to get member profiles
-- Returns profile data WITHOUT sensitive fields (telefone)
CREATE OR REPLACE FUNCTION public.get_church_member_profiles()
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
  data_batismo date,
  batizou_na_igreja boolean,
  is_novo_convertido boolean,
  is_transferido boolean,
  onboarding_completed boolean,
  needs_password_change boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_church_id uuid;
BEGIN
  -- Verify caller is a church admin
  IF NOT public.is_admin_of_own_church(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não é administrador da igreja';
  END IF;

  -- Get the user's church
  SELECT p.church_id INTO user_church_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

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
    p.data_batismo,
    p.batizou_na_igreja,
    p.is_novo_convertido,
    p.is_transferido,
    p.onboarding_completed,
    p.needs_password_change,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.church_id = user_church_id;
END;
$$;

-- Step 4: Create function to get a single member profile (for admin)
CREATE OR REPLACE FUNCTION public.get_church_member_profile(member_id uuid)
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
  data_batismo date,
  batizou_na_igreja boolean,
  is_novo_convertido boolean,
  is_transferido boolean,
  onboarding_completed boolean,
  needs_password_change boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_church_id uuid;
  member_church_id uuid;
BEGIN
  -- Verify caller is a church admin
  IF NOT public.is_admin_of_own_church(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não é administrador da igreja';
  END IF;

  -- Get the admin's church
  SELECT p.church_id INTO user_church_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Get the member's church
  SELECT p.church_id INTO member_church_id
  FROM public.profiles p
  WHERE p.id = member_id;

  -- Verify member belongs to the same church
  IF user_church_id IS DISTINCT FROM member_church_id THEN
    RAISE EXCEPTION 'Acesso negado: membro não pertence à sua igreja';
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
    p.data_batismo,
    p.batizou_na_igreja,
    p.is_novo_convertido,
    p.is_transferido,
    p.onboarding_completed,
    p.needs_password_change,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = member_id;
END;
$$;

-- Step 5: Create aggregated stats function for church admins
CREATE OR REPLACE FUNCTION public.get_church_member_stats()
RETURNS TABLE (
  total_members bigint,
  total_batizados bigint,
  total_novos_convertidos bigint,
  total_transferidos bigint,
  total_onboarding_completed bigint,
  total_by_gender jsonb,
  total_by_role jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_church_id uuid;
BEGIN
  -- Verify caller is a church admin
  IF NOT public.is_admin_of_own_church(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você não é administrador da igreja';
  END IF;

  -- Get the user's church
  SELECT p.church_id INTO user_church_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_members,
    COUNT(*) FILTER (WHERE p.is_batizado = true)::bigint as total_batizados,
    COUNT(*) FILTER (WHERE p.is_novo_convertido = true)::bigint as total_novos_convertidos,
    COUNT(*) FILTER (WHERE p.is_transferido = true)::bigint as total_transferidos,
    COUNT(*) FILTER (WHERE p.onboarding_completed = true)::bigint as total_onboarding_completed,
    jsonb_object_agg(COALESCE(p.genero::text, 'nao_informado'), gender_count) as total_by_gender,
    jsonb_object_agg(p.role::text, role_count) as total_by_role
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as gender_count 
    FROM public.profiles p2 
    WHERE p2.church_id = user_church_id AND p2.genero IS NOT DISTINCT FROM p.genero
  ) gc ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as role_count 
    FROM public.profiles p3 
    WHERE p3.church_id = user_church_id AND p3.role = p.role
  ) rc ON true
  WHERE p.church_id = user_church_id
  GROUP BY ();
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.get_church_member_profiles IS 
'Returns all member profiles for the current admin church WITHOUT sensitive fields like telefone.';

COMMENT ON FUNCTION public.get_church_member_profile IS 
'Returns a single member profile for church admins WITHOUT sensitive fields like telefone.';

COMMENT ON FUNCTION public.get_church_member_stats IS 
'Returns aggregated statistics about church members. No individual data is exposed.';

COMMENT ON POLICY "Strict profile access" ON public.profiles IS 
'Strict access: only super admins and profile owners can directly access profiles. All other roles use secure functions.';