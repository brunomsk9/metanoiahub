-- Tabela para itens configuráveis do checklist semanal
CREATE TABLE public.weekly_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para respostas semanais dos discipuladores
CREATE TABLE public.weekly_checklist_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulador_id UUID NOT NULL,
  week_start DATE NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discipulador_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checklist_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para weekly_checklist_items
CREATE POLICY "Authenticated users can view active checklist items"
ON public.weekly_checklist_items
FOR SELECT
USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admins can view all checklist items"
ON public.weekly_checklist_items
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert checklist items"
ON public.weekly_checklist_items
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update checklist items"
ON public.weekly_checklist_items
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete checklist items"
ON public.weekly_checklist_items
FOR DELETE
USING (is_admin(auth.uid()));

-- Políticas para weekly_checklist_responses
CREATE POLICY "Discipuladores can view their own responses"
ON public.weekly_checklist_responses
FOR SELECT
USING (auth.uid() = discipulador_id OR is_admin(auth.uid()));

CREATE POLICY "Discipuladores can insert their own responses"
ON public.weekly_checklist_responses
FOR INSERT
WITH CHECK (auth.uid() = discipulador_id AND has_role(auth.uid(), 'discipulador'));

CREATE POLICY "Discipuladores can update their own responses"
ON public.weekly_checklist_responses
FOR UPDATE
USING (auth.uid() = discipulador_id);

CREATE POLICY "Admins can manage all responses"
ON public.weekly_checklist_responses
FOR ALL
USING (is_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_weekly_checklist_responses_updated_at
BEFORE UPDATE ON public.weekly_checklist_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir itens iniciais do checklist
INSERT INTO public.weekly_checklist_items (titulo, descricao, ordem) VALUES
('Orou pelos discípulos', 'Dedicou tempo em oração pelos seus discípulos esta semana', 1),
('Enviou mensagens', 'Entrou em contato com seus discípulos via mensagem', 2),
('Encontrou nos cultos', 'Se encontrou com seus discípulos nos cultos da igreja', 3);