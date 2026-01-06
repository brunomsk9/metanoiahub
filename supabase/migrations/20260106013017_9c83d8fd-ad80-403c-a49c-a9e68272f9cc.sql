-- Step 1: Drop existing policy
DROP POLICY IF EXISTS "Restricted profile access" ON public.profiles;

-- Step 2: Create new policy WITHOUT direct discipulador access
-- Discipuladores will use a secure function instead
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
);

-- Step 3: Create secure function for discipuladores to get disciple profiles
-- Returns profile data WITHOUT sensitive fields (telefone)
CREATE OR REPLACE FUNCTION public.get_disciple_profile(discipulo_id_param uuid)
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
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is a discipulador of this disciple
  IF NOT public.is_discipulador_of(auth.uid(), discipulo_id_param) THEN
    RAISE EXCEPTION 'Acesso negado: você não é discipulador deste discípulo';
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
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = discipulo_id_param;
END;
$$;

-- Step 4: Create function for discipuladores to get ALL their disciples
CREATE OR REPLACE FUNCTION public.get_all_disciples_for_discipulador()
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
  relationship_id uuid,
  relationship_status text,
  relationship_started_at timestamptz,
  alicerce_completed_presencial boolean,
  alicerce_completed_at timestamptz,
  conexao_inicial_1 boolean,
  conexao_inicial_2 boolean,
  academia_nivel_1 boolean,
  academia_nivel_2 boolean,
  academia_nivel_3 boolean,
  academia_nivel_4 boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return disciples where caller is the discipulador
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
    dr.id as relationship_id,
    dr.status as relationship_status,
    dr.started_at as relationship_started_at,
    dr.alicerce_completed_presencial,
    dr.alicerce_completed_at,
    dr.conexao_inicial_1,
    dr.conexao_inicial_2,
    dr.academia_nivel_1,
    dr.academia_nivel_2,
    dr.academia_nivel_3,
    dr.academia_nivel_4
  FROM public.profiles p
  JOIN public.discipleship_relationships dr ON dr.discipulo_id = p.id
  WHERE dr.discipulador_id = auth.uid()
    AND dr.status = 'active';
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.get_disciple_profile IS 
'Returns a single disciple profile WITHOUT sensitive fields like telefone. Only accessible to the disciples discipulador.';

COMMENT ON FUNCTION public.get_all_disciples_for_discipulador IS 
'Returns all disciples for the current discipulador, WITHOUT sensitive fields like telefone. Includes discipleship relationship data.';