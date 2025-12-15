-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Add admin policies for tracks
CREATE POLICY "Admins can insert tracks"
ON public.tracks
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tracks"
ON public.tracks
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tracks"
ON public.tracks
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add admin policies for courses
CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete courses"
ON public.courses
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add admin policies for lessons
CREATE POLICY "Admins can insert lessons"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update lessons"
ON public.lessons
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete lessons"
ON public.lessons
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add admin policies for resources
CREATE POLICY "Admins can insert resources"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update resources"
ON public.resources
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete resources"
ON public.resources
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));