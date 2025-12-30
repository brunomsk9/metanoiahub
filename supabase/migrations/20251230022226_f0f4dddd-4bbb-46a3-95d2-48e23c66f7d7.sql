-- Create table for quiz responses
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  respostas JSONB NOT NULL DEFAULT '[]'::jsonb,
  acertos INTEGER NOT NULL DEFAULT 0,
  total_perguntas INTEGER NOT NULL DEFAULT 0,
  porcentagem_acerto NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own responses
CREATE POLICY "Users can insert their own quiz responses"
ON public.quiz_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own responses, discipuladores can view disciples, admins can view all in church
CREATE POLICY "Users can view quiz responses"
ON public.quiz_responses
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_discipulador_of(auth.uid(), user_id)
  OR is_admin_of_own_church(auth.uid())
  OR is_super_admin(auth.uid())
);

-- Create index for performance
CREATE INDEX idx_quiz_responses_user_id ON public.quiz_responses(user_id);
CREATE INDEX idx_quiz_responses_lesson_id ON public.quiz_responses(lesson_id);
CREATE INDEX idx_quiz_responses_completed_at ON public.quiz_responses(completed_at DESC);