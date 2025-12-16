-- Add UNIQUE constraint to ensure 1 discípulo can only have 1 discipulador
ALTER TABLE public.discipleship_relationships 
ADD CONSTRAINT unique_discipulo_active UNIQUE (discipulo_id);

-- Allow discipuladores to view profiles of users with 'discipulo' role for selection
CREATE POLICY "Discipuladores can view discipulos profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'discipulador') 
  AND has_role(id, 'discipulo')
);