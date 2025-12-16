-- Remover política pública de leitura
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

-- Criar política que respeita o público-alvo do curso
CREATE POLICY "Users can view lessons for their roles" 
ON public.lessons 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lessons.course_id
    AND (
      user_can_access_content(auth.uid(), c.publico_alvo) 
      OR has_role(auth.uid(), 'admin')
    )
  )
);