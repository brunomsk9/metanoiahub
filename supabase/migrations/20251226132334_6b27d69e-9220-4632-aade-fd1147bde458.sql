-- Drop existing SELECT policy on resources
DROP POLICY IF EXISTS "Users can view resources in their church" ON public.resources;

-- Create new SELECT policy that includes lider_ministerial and volunteers
CREATE POLICY "Users can view resources in their church" ON public.resources
FOR SELECT USING (
  is_super_admin(auth.uid()) 
  OR (
    user_belongs_to_church(auth.uid(), church_id) 
    AND (
      -- Livros, músicas, pregações - available to all in church
      (categoria = ANY (ARRAY['livro'::resource_category, 'musica'::resource_category, 'pregacao'::resource_category]))
      -- SOS resources - for discipuladores and admins
      OR (categoria = 'sos'::resource_category AND (
        has_role(auth.uid(), 'discipulador'::app_role) 
        OR has_role(auth.uid(), 'admin'::app_role) 
        OR has_role(auth.uid(), 'church_admin'::app_role)
      ))
      -- Playbooks - for lider_ministerial (all), ministry leaders (all), or volunteers (only their ministries)
      OR (categoria = 'playbook'::resource_category AND (
        -- Líderes ministeriais veem todos playbooks
        has_role(auth.uid(), 'lider_ministerial'::app_role)
        -- Admins veem todos
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'church_admin'::app_role)
        -- Líder do ministério específico
        OR is_ministry_leader(auth.uid(), ministry_id)
        -- Voluntário do ministério específico (apenas playbooks do seu ministério)
        OR EXISTS (
          SELECT 1 FROM public.ministry_volunteers mv
          WHERE mv.user_id = auth.uid()
            AND mv.ministry_id = resources.ministry_id
        )
      ))
    )
  )
);

-- Update INSERT policy to allow lider_ministerial
DROP POLICY IF EXISTS "Admins can insert resources in their church" ON public.resources;
CREATE POLICY "Admins can insert resources in their church" ON public.resources
FOR INSERT WITH CHECK (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND has_role(auth.uid(), 'lider_ministerial'::app_role))
);

-- Update UPDATE policy to allow lider_ministerial
DROP POLICY IF EXISTS "Admins can update resources in their church" ON public.resources;
CREATE POLICY "Admins can update resources in their church" ON public.resources
FOR UPDATE USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND has_role(auth.uid(), 'lider_ministerial'::app_role))
);

-- Update DELETE policy to allow lider_ministerial
DROP POLICY IF EXISTS "Admins can delete resources in their church" ON public.resources;
CREATE POLICY "Admins can delete resources in their church" ON public.resources
FOR DELETE USING (
  is_super_admin(auth.uid()) 
  OR can_manage_church_content(auth.uid(), church_id)
  OR (user_belongs_to_church(auth.uid(), church_id) AND has_role(auth.uid(), 'lider_ministerial'::app_role))
);