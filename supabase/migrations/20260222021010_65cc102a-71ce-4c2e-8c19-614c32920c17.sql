
-- Table for configurable checklist items (managed by admin)
CREATE TABLE public.service_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id),
  titulo text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checklist items in their church"
  ON public.service_checklist_items FOR SELECT
  USING (is_super_admin(auth.uid()) OR user_belongs_to_church(auth.uid(), church_id));

CREATE POLICY "Admins can insert checklist items"
  ON public.service_checklist_items FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

CREATE POLICY "Admins can update checklist items"
  ON public.service_checklist_items FOR UPDATE
  USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

CREATE POLICY "Admins can delete checklist items"
  ON public.service_checklist_items FOR DELETE
  USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));

-- Table for checklist responses per service
CREATE TABLE public.service_checklist_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  item_id uuid NOT NULL REFERENCES public.service_checklist_items(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_by uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, item_id)
);

ALTER TABLE public.service_checklist_responses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is volunteer in "Oficiais" ministry
CREATE OR REPLACE FUNCTION public.is_oficiais_volunteer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ministry_volunteers mv
    JOIN ministries m ON m.id = mv.ministry_id
    WHERE mv.user_id = _user_id
      AND LOWER(m.nome) LIKE '%oficiais%'
      AND m.is_active = true
  )
$$;

CREATE POLICY "Users can view checklist responses in their church"
  ON public.service_checklist_responses FOR SELECT
  USING (is_super_admin(auth.uid()) OR user_belongs_to_church(auth.uid(), church_id));

CREATE POLICY "Oficiais volunteers can insert responses"
  ON public.service_checklist_responses FOR INSERT
  WITH CHECK (
    is_super_admin(auth.uid())
    OR can_manage_church_content(auth.uid(), church_id)
    OR (user_belongs_to_church(auth.uid(), church_id) AND is_oficiais_volunteer(auth.uid()))
  );

CREATE POLICY "Oficiais volunteers can update responses"
  ON public.service_checklist_responses FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR can_manage_church_content(auth.uid(), church_id)
    OR (user_belongs_to_church(auth.uid(), church_id) AND is_oficiais_volunteer(auth.uid()))
  );

CREATE POLICY "Admins can delete responses"
  ON public.service_checklist_responses FOR DELETE
  USING (is_super_admin(auth.uid()) OR can_manage_church_content(auth.uid(), church_id));
