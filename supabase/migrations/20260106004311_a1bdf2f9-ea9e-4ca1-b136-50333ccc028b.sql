-- =====================================================
-- 1. CONTAGEM DE PRESENÇA NOS CULTOS
-- =====================================================

CREATE TABLE public.service_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  adultos INTEGER NOT NULL DEFAULT 0,
  criancas INTEGER NOT NULL DEFAULT 0,
  voluntarios INTEGER NOT NULL DEFAULT 0,
  total_geral INTEGER GENERATED ALWAYS AS (adultos + criancas + voluntarios) STORED,
  notas TEXT,
  registered_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id)
);

-- Enable RLS
ALTER TABLE public.service_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for service_attendance
CREATE POLICY "Admins and leaders can view attendance from their church"
ON public.service_attendance FOR SELECT
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND (
    public.is_admin_of_own_church(auth.uid()) 
    OR public.is_lider_ministerial(auth.uid())
  )
);

CREATE POLICY "Admins and leaders can insert attendance for their church"
ON public.service_attendance FOR INSERT
WITH CHECK (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND (
    public.is_admin_of_own_church(auth.uid()) 
    OR public.is_lider_ministerial(auth.uid())
  )
);

CREATE POLICY "Admins and leaders can update attendance for their church"
ON public.service_attendance FOR UPDATE
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND (
    public.is_admin_of_own_church(auth.uid()) 
    OR public.is_lider_ministerial(auth.uid())
  )
);

CREATE POLICY "Admins can delete attendance from their church"
ON public.service_attendance FOR DELETE
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_service_attendance_updated_at
BEFORE UPDATE ON public.service_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. NEWSLETTERS
-- =====================================================

CREATE TABLE public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'manual' CHECK (tipo IN ('manual', 'automatica')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviada')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipients_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Policies for newsletters
CREATE POLICY "Admins can view newsletters from their church"
ON public.newsletters FOR SELECT
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

CREATE POLICY "Admins can create newsletters for their church"
ON public.newsletters FOR INSERT
WITH CHECK (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

CREATE POLICY "Admins can update newsletters from their church"
ON public.newsletters FOR UPDATE
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

CREATE POLICY "Admins can delete newsletters from their church"
ON public.newsletters FOR DELETE
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_newsletters_updated_at
BEFORE UPDATE ON public.newsletters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. NEWSLETTER SUBSCRIBERS (para controle de quem recebe)
-- =====================================================

CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(church_id, email)
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view subscribers from their church"
ON public.newsletter_subscribers FOR SELECT
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

CREATE POLICY "Admins can manage subscribers from their church"
ON public.newsletter_subscribers FOR ALL
USING (
  public.user_belongs_to_church(auth.uid(), church_id) 
  AND public.is_admin_of_own_church(auth.uid())
);

-- Users can manage their own subscription
CREATE POLICY "Users can manage their own subscription"
ON public.newsletter_subscribers FOR UPDATE
USING (user_id = auth.uid());

-- =====================================================
-- 4. INDEX PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_service_attendance_church ON public.service_attendance(church_id);
CREATE INDEX idx_service_attendance_service ON public.service_attendance(service_id);
CREATE INDEX idx_newsletters_church ON public.newsletters(church_id);
CREATE INDEX idx_newsletters_status ON public.newsletters(status);
CREATE INDEX idx_newsletter_subscribers_church ON public.newsletter_subscribers(church_id);
CREATE INDEX idx_newsletter_subscribers_subscribed ON public.newsletter_subscribers(is_subscribed) WHERE is_subscribed = true;