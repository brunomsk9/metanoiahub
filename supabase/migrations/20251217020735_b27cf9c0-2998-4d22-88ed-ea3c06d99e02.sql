-- Harden is_discipulador_of() to ensure only real discipuladores can be treated as mentors
-- and that the relationship is explicitly active.
CREATE OR REPLACE FUNCTION public.is_discipulador_of(_discipulador_id uuid, _discipulo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_discipulador_id, 'discipulador')
    AND EXISTS (
      SELECT 1
      FROM public.discipleship_relationships dr
      WHERE dr.discipulador_id = _discipulador_id
        AND dr.discipulo_id = _discipulo_id
        AND dr.status = 'active'
    )
$function$;