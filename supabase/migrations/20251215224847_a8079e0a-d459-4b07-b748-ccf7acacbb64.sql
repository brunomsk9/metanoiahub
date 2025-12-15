
-- Create user_roles table for multiple roles per user
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get all user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role)
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Add publico_alvo column to tracks (who can access: discipulo, discipulador, or both)
ALTER TABLE public.tracks 
ADD COLUMN publico_alvo app_role[] NOT NULL DEFAULT ARRAY['discipulo'::app_role];

-- Add publico_alvo column to courses
ALTER TABLE public.courses 
ADD COLUMN publico_alvo app_role[] NOT NULL DEFAULT ARRAY['discipulo'::app_role];

-- Update is_admin function to use new user_roles table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Function to check if user can access content based on their roles
CREATE OR REPLACE FUNCTION public.user_can_access_content(_user_id uuid, _publico_alvo app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = ANY(_publico_alvo)
  )
$$;

-- Update tracks RLS to filter by user roles
DROP POLICY IF EXISTS "Anyone can view tracks" ON public.tracks;
CREATE POLICY "Users can view tracks for their roles"
ON public.tracks FOR SELECT
USING (public.user_can_access_content(auth.uid(), publico_alvo) OR public.has_role(auth.uid(), 'admin'));

-- Update courses RLS to filter by user roles  
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Users can view courses for their roles"
ON public.courses FOR SELECT
USING (public.user_can_access_content(auth.uid(), publico_alvo) OR public.has_role(auth.uid(), 'admin'));
