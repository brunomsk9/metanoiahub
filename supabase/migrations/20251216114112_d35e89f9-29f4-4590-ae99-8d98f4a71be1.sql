-- Tabela de relacionamento discipulador-discípulo
CREATE TABLE public.discipleship_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipulo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (discipulador_id, discipulo_id)
);

-- Índices para performance
CREATE INDEX idx_discipleship_discipulador ON public.discipleship_relationships(discipulador_id);
CREATE INDEX idx_discipleship_discipulo ON public.discipleship_relationships(discipulo_id);

-- Enable RLS
ALTER TABLE public.discipleship_relationships ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é discipulador de outro
CREATE OR REPLACE FUNCTION public.is_discipulador_of(_discipulador_id UUID, _discipulo_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.discipleship_relationships
    WHERE discipulador_id = _discipulador_id
      AND discipulo_id = _discipulo_id
      AND status = 'active'
  )
$$;

-- Políticas RLS para discipleship_relationships
CREATE POLICY "Discipuladores podem ver seus discípulos"
ON public.discipleship_relationships
FOR SELECT
USING (auth.uid() = discipulador_id OR auth.uid() = discipulo_id);

CREATE POLICY "Admins podem gerenciar relacionamentos"
ON public.discipleship_relationships
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Discipuladores podem criar relacionamentos"
ON public.discipleship_relationships
FOR INSERT
WITH CHECK (
  auth.uid() = discipulador_id 
  AND public.has_role(auth.uid(), 'discipulador')
);

CREATE POLICY "Discipuladores podem atualizar seus relacionamentos"
ON public.discipleship_relationships
FOR UPDATE
USING (auth.uid() = discipulador_id);

-- Atualizar política de user_progress para discipuladores verem progresso dos discípulos
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress or disciples progress"
ON public.user_progress
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_discipulador_of(auth.uid(), user_id)
  OR public.is_admin(auth.uid())
);

-- Atualizar política de daily_habits para discipuladores verem hábitos dos discípulos
DROP POLICY IF EXISTS "Users can view their own habits" ON public.daily_habits;
CREATE POLICY "Users can view their own habits or disciples habits"
ON public.daily_habits
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_discipulador_of(auth.uid(), user_id)
  OR public.is_admin(auth.uid())
);

-- Atualizar política de user_reading_progress para discipuladores
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_reading_progress;
CREATE POLICY "Users can view their own reading progress or disciples progress"
ON public.user_reading_progress
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_discipulador_of(auth.uid(), user_id)
  OR public.is_admin(auth.uid())
);

-- Atualizar política de profiles para discipuladores verem perfis dos discípulos
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or disciples profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR public.is_discipulador_of(auth.uid(), id)
  OR public.is_admin(auth.uid())
);

-- Trigger para updated_at
CREATE TRIGGER update_discipleship_relationships_updated_at
BEFORE UPDATE ON public.discipleship_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();