-- Add check constraint to prevent self-discipleship
ALTER TABLE public.discipleship_relationships 
ADD CONSTRAINT prevent_self_discipleship 
CHECK (discipulador_id != discipulo_id);