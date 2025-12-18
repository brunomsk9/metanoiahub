
-- =============================================
-- FASE 2: ATUALIZAR RLS PARA MULTI-IGREJA
-- =============================================

-- Função auxiliar: verificar se é admin da própria igreja
CREATE OR REPLACE FUNCTION public.is_admin_of_own_church(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') 
    OR public.has_role(_user_id, 'church_admin')
    OR public.is_super_admin(_user_id)
$$;

-- Função auxiliar: verificar se usuário pode gerenciar conteúdo da igreja
CREATE OR REPLACE FUNCTION public.can_manage_church_content(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR (public.user_belongs_to_church(_user_id, _church_id) 
        AND (public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'church_admin')))
$$;

-- =============================================
-- PROFILES - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Users can view their own profile or disciples profile" ON public.profiles;
DROP POLICY IF EXISTS "Discipuladores can view their disciples profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in their church"
ON public.profiles
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (auth.uid() = id)
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (
    public.is_admin_of_own_church(auth.uid())
    OR public.is_discipulador_of(auth.uid(), id)
  ))
);

-- =============================================
-- TRACKS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Users can view tracks for their roles" ON public.tracks;
DROP POLICY IF EXISTS "Admins can insert tracks" ON public.tracks;
DROP POLICY IF EXISTS "Admins can update tracks" ON public.tracks;
DROP POLICY IF EXISTS "Admins can delete tracks" ON public.tracks;

CREATE POLICY "Users can view tracks in their church"
ON public.tracks
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) 
      AND public.user_can_access_content(auth.uid(), publico_alvo))
);

CREATE POLICY "Admins can insert tracks in their church"
ON public.tracks
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update tracks in their church"
ON public.tracks
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete tracks in their church"
ON public.tracks
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- COURSES - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Users can view courses for their roles" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;

CREATE POLICY "Users can view courses in their church"
ON public.courses
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) 
      AND public.user_can_access_content(auth.uid(), publico_alvo))
);

CREATE POLICY "Admins can insert courses in their church"
ON public.courses
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update courses in their church"
ON public.courses
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete courses in their church"
ON public.courses
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- LESSONS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Users can view lessons for their roles" ON public.lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON public.lessons;

CREATE POLICY "Users can view lessons in their church"
ON public.lessons
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = lessons.course_id 
    AND public.user_can_access_content(auth.uid(), c.publico_alvo)
  ))
);

CREATE POLICY "Admins can insert lessons in their church"
ON public.lessons
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update lessons in their church"
ON public.lessons
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete lessons in their church"
ON public.lessons
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- RESOURCES - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Resource access by category and role" ON public.resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;

CREATE POLICY "Users can view resources in their church"
ON public.resources
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (
    categoria = ANY (ARRAY['livro'::resource_category, 'musica'::resource_category, 'pregacao'::resource_category])
    OR (categoria = 'sos'::resource_category AND (
      public.has_role(auth.uid(), 'discipulador') 
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'church_admin')
    ))
  ))
);

CREATE POLICY "Admins can insert resources in their church"
ON public.resources
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update resources in their church"
ON public.resources
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete resources in their church"
ON public.resources
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- READING_PLANS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view reading plans" ON public.reading_plans;
DROP POLICY IF EXISTS "Admins can insert reading plans" ON public.reading_plans;
DROP POLICY IF EXISTS "Admins can update reading plans" ON public.reading_plans;
DROP POLICY IF EXISTS "Admins can delete reading plans" ON public.reading_plans;

CREATE POLICY "Users can view reading plans in their church"
ON public.reading_plans
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Admins can insert reading plans in their church"
ON public.reading_plans
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update reading plans in their church"
ON public.reading_plans
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete reading plans in their church"
ON public.reading_plans
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- READING_PLAN_DAYS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view reading plan days" ON public.reading_plan_days;
DROP POLICY IF EXISTS "Admins can insert reading plan days" ON public.reading_plan_days;
DROP POLICY IF EXISTS "Admins can update reading plan days" ON public.reading_plan_days;
DROP POLICY IF EXISTS "Admins can delete reading plan days" ON public.reading_plan_days;

CREATE POLICY "Users can view reading plan days in their church"
ON public.reading_plan_days
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Admins can insert reading plan days in their church"
ON public.reading_plan_days
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update reading plan days in their church"
ON public.reading_plan_days
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete reading plan days in their church"
ON public.reading_plan_days
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- HABIT_DEFINITIONS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active habits" ON public.habit_definitions;
DROP POLICY IF EXISTS "Admins can insert habits" ON public.habit_definitions;
DROP POLICY IF EXISTS "Admins can update habits" ON public.habit_definitions;
DROP POLICY IF EXISTS "Admins can delete habits" ON public.habit_definitions;

CREATE POLICY "Users can view habits in their church"
ON public.habit_definitions
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (is_active = true OR public.is_admin_of_own_church(auth.uid())))
);

CREATE POLICY "Admins can insert habits in their church"
ON public.habit_definitions
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update habits in their church"
ON public.habit_definitions
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete habits in their church"
ON public.habit_definitions
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- AI_SETTINGS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Admins can read ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can insert ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins can update ai_settings" ON public.ai_settings;

CREATE POLICY "Admins can read ai_settings in their church"
ON public.ai_settings
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can insert ai_settings in their church"
ON public.ai_settings
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update ai_settings in their church"
ON public.ai_settings
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- WEEKLY_CHECKLIST_ITEMS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view active checklist items" ON public.weekly_checklist_items;
DROP POLICY IF EXISTS "Admins can view all checklist items" ON public.weekly_checklist_items;
DROP POLICY IF EXISTS "Admins can insert checklist items" ON public.weekly_checklist_items;
DROP POLICY IF EXISTS "Admins can update checklist items" ON public.weekly_checklist_items;
DROP POLICY IF EXISTS "Admins can delete checklist items" ON public.weekly_checklist_items;

CREATE POLICY "Users can view checklist items in their church"
ON public.weekly_checklist_items
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (ativo = true OR public.is_admin_of_own_church(auth.uid())))
);

CREATE POLICY "Admins can insert checklist items in their church"
ON public.weekly_checklist_items
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can update checklist items in their church"
ON public.weekly_checklist_items
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

CREATE POLICY "Admins can delete checklist items in their church"
ON public.weekly_checklist_items
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- DISCIPLESHIP_RELATIONSHIPS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Discipuladores podem ver seus discípulos" ON public.discipleship_relationships;
DROP POLICY IF EXISTS "Discipuladores podem criar relacionamentos" ON public.discipleship_relationships;
DROP POLICY IF EXISTS "Discipuladores podem atualizar seus relacionamentos" ON public.discipleship_relationships;
DROP POLICY IF EXISTS "Admins podem gerenciar relacionamentos" ON public.discipleship_relationships;

CREATE POLICY "Users can view relationships in their church"
ON public.discipleship_relationships
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (
    auth.uid() = discipulador_id 
    OR auth.uid() = discipulo_id
    OR public.is_admin_of_own_church(auth.uid())
  ))
);

CREATE POLICY "Discipuladores can create relationships in their church"
ON public.discipleship_relationships
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) 
      AND auth.uid() = discipulador_id 
      AND public.has_role(auth.uid(), 'discipulador'))
);

CREATE POLICY "Discipuladores can update relationships in their church"
ON public.discipleship_relationships
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (
    auth.uid() = discipulador_id
    OR public.is_admin_of_own_church(auth.uid())
  ))
);

CREATE POLICY "Admins can delete relationships in their church"
ON public.discipleship_relationships
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_church_content(auth.uid(), church_id)
);

-- =============================================
-- MEETINGS - Atualizar políticas
-- =============================================
DROP POLICY IF EXISTS "Users can view their meetings" ON public.meetings;
DROP POLICY IF EXISTS "Discipuladores can insert their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Discipuladores can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Discipuladores can delete their own meetings" ON public.meetings;

CREATE POLICY "Users can view meetings in their church"
ON public.meetings
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND (
    auth.uid() = discipulador_id 
    OR auth.uid() = discipulo_id
    OR public.is_admin_of_own_church(auth.uid())
  ))
);

CREATE POLICY "Discipuladores can insert meetings in their church"
ON public.meetings
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) 
      AND auth.uid() = discipulador_id 
      AND public.has_role(auth.uid(), 'discipulador'))
);

CREATE POLICY "Discipuladores can update meetings in their church"
ON public.meetings
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND auth.uid() = discipulador_id)
);

CREATE POLICY "Discipuladores can delete meetings in their church"
ON public.meetings
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR (public.user_belongs_to_church(auth.uid(), church_id) AND auth.uid() = discipulador_id)
);
