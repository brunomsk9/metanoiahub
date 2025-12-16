-- Criar tabela separada para notas privadas dos discipuladores
CREATE TABLE public.discipleship_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relationship_id uuid NOT NULL REFERENCES public.discipleship_relationships(id) ON DELETE CASCADE,
  discipulador_id uuid NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(relationship_id)
);

-- Migrar notas existentes para a nova tabela
INSERT INTO public.discipleship_notes (relationship_id, discipulador_id, notes)
SELECT id, discipulador_id, notes 
FROM public.discipleship_relationships 
WHERE notes IS NOT NULL AND notes != '';

-- Habilitar RLS
ALTER TABLE public.discipleship_notes ENABLE ROW LEVEL SECURITY;

-- Apenas discipuladores e admins podem ver as notas
CREATE POLICY "Discipuladores can view their own notes" 
ON public.discipleship_notes 
FOR SELECT 
USING (auth.uid() = discipulador_id OR is_admin(auth.uid()));

CREATE POLICY "Discipuladores can insert their own notes" 
ON public.discipleship_notes 
FOR INSERT 
WITH CHECK (auth.uid() = discipulador_id);

CREATE POLICY "Discipuladores can update their own notes" 
ON public.discipleship_notes 
FOR UPDATE 
USING (auth.uid() = discipulador_id);

CREATE POLICY "Discipuladores can delete their own notes" 
ON public.discipleship_notes 
FOR DELETE 
USING (auth.uid() = discipulador_id OR is_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_discipleship_notes_updated_at
BEFORE UPDATE ON public.discipleship_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remover coluna notes da tabela original (após migração confirmada)
ALTER TABLE public.discipleship_relationships DROP COLUMN IF EXISTS notes;