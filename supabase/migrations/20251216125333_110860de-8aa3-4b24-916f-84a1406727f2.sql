-- Add is_base column to tracks table to mark the foundational track
ALTER TABLE public.tracks ADD COLUMN is_base boolean NOT NULL DEFAULT false;

-- Create index for quick lookup of base track
CREATE INDEX idx_tracks_is_base ON public.tracks(is_base) WHERE is_base = true;

-- Create function to check if user completed the base track
CREATE OR REPLACE FUNCTION public.user_completed_base_track(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    -- Check if there are any lessons in the base track that the user hasn't completed
    SELECT 1
    FROM public.tracks t
    JOIN public.courses c ON c.track_id = t.id
    JOIN public.lessons l ON l.course_id = c.id
    LEFT JOIN public.user_progress up ON up.lesson_id = l.id AND up.user_id = _user_id AND up.completed = true
    WHERE t.is_base = true
      AND up.id IS NULL
  )
  AND EXISTS (
    -- Ensure there is at least one base track with lessons
    SELECT 1
    FROM public.tracks t
    JOIN public.courses c ON c.track_id = t.id
    JOIN public.lessons l ON l.course_id = c.id
    WHERE t.is_base = true
  )
$$;