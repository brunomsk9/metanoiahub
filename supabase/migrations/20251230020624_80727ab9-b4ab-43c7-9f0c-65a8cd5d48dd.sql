-- Add perguntas (questions) field to lessons table
-- Structure: [{pergunta: string, alternativas: string[], resposta_correta: number}]
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS perguntas jsonb DEFAULT '[]'::jsonb;