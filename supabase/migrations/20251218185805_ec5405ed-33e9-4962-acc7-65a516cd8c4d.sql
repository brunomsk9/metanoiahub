
-- =============================================
-- FASE 1B: ESTRUTURA BASE MULTI-IGREJA
-- =============================================

-- 1. Criar tabela de igrejas
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#8B5CF6',
  cor_secundaria TEXT DEFAULT '#D946EF',
  configuracoes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Adicionar church_id às tabelas principais
ALTER TABLE public.profiles ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.tracks ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.courses ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.lessons ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.resources ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.reading_plans ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.reading_plan_days ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.habit_definitions ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.ai_settings ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.weekly_checklist_items ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.discipleship_relationships ADD COLUMN church_id UUID REFERENCES public.churches(id);
ALTER TABLE public.meetings ADD COLUMN church_id UUID REFERENCES public.churches(id);

-- 3. Criar índices para performance
CREATE INDEX idx_profiles_church_id ON public.profiles(church_id);
CREATE INDEX idx_tracks_church_id ON public.tracks(church_id);
CREATE INDEX idx_courses_church_id ON public.courses(church_id);
CREATE INDEX idx_lessons_church_id ON public.lessons(church_id);
CREATE INDEX idx_resources_church_id ON public.resources(church_id);
CREATE INDEX idx_reading_plans_church_id ON public.reading_plans(church_id);
CREATE INDEX idx_habit_definitions_church_id ON public.habit_definitions(church_id);
CREATE INDEX idx_discipleship_relationships_church_id ON public.discipleship_relationships(church_id);

-- 4. Função helper para obter church_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_church_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM public.profiles WHERE id = _user_id
$$;

-- 5. Função helper para verificar se usuário pertence à igreja
CREATE OR REPLACE FUNCTION public.user_belongs_to_church(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND church_id = _church_id
  )
$$;

-- 6. Função helper para verificar se é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- 7. Função helper para verificar se é admin da igreja
CREATE OR REPLACE FUNCTION public.is_church_admin(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'church_admin') 
    AND public.user_belongs_to_church(_user_id, _church_id)
$$;

-- 8. Habilitar RLS na tabela churches
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para churches
CREATE POLICY "Super admins can manage all churches"
ON public.churches
FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their church"
ON public.churches
FOR SELECT
USING (public.user_belongs_to_church(auth.uid(), id));

-- 10. Trigger para updated_at em churches
CREATE TRIGGER update_churches_updated_at
BEFORE UPDATE ON public.churches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Criar igreja padrão para dados existentes
INSERT INTO public.churches (id, nome, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Igreja Principal', 'principal');

-- 12. Atualizar dados existentes para a igreja padrão
UPDATE public.profiles SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.tracks SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.courses SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.lessons SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.resources SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.reading_plans SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.reading_plan_days SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.habit_definitions SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.ai_settings SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.weekly_checklist_items SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.discipleship_relationships SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
UPDATE public.meetings SET church_id = '00000000-0000-0000-0000-000000000001' WHERE church_id IS NULL;
