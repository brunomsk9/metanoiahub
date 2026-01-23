-- Adicionar política RLS para admins de igreja visualizarem apenas assinantes da própria igreja
-- A política existente só permite super_admin ver todos, então precisamos adicionar para church admins

-- Criar política para admins de igreja verem apenas assinantes da sua própria igreja
CREATE POLICY "Church admins can view their church subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (
  user_belongs_to_church(auth.uid(), church_id) 
  AND is_admin_of_own_church(auth.uid())
);