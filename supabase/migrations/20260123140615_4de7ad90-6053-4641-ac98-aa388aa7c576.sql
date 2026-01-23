-- Atualizar políticas RLS da tabela discipleship_notes para maior privacidade
-- Remover acesso de admins da igreja e permitir apenas o discipulador e super_admin

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Discipuladores can view their own notes" ON public.discipleship_notes;
DROP POLICY IF EXISTS "Discipuladores can delete their own notes" ON public.discipleship_notes;

-- Criar novas políticas mais restritivas

-- SELECT: Apenas o discipulador que criou a nota OU super_admin podem ver
CREATE POLICY "Discipuladores can view their own notes"
ON public.discipleship_notes
FOR SELECT
TO authenticated
USING (
  (auth.uid() = discipulador_id AND EXISTS (
    SELECT 1 FROM discipleship_relationships dr
    WHERE dr.id = discipleship_notes.relationship_id 
    AND dr.discipulador_id = auth.uid()
  ))
  OR is_super_admin(auth.uid())
);

-- DELETE: Apenas o discipulador que criou a nota OU super_admin podem deletar
CREATE POLICY "Discipuladores can delete their own notes"
ON public.discipleship_notes
FOR DELETE
TO authenticated
USING (
  (auth.uid() = discipulador_id AND EXISTS (
    SELECT 1 FROM discipleship_relationships dr
    WHERE dr.id = discipleship_notes.relationship_id 
    AND dr.discipulador_id = auth.uid()
  ))
  OR is_super_admin(auth.uid())
);