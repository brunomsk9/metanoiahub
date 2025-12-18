
-- Drop the trigger on profiles table first
DROP TRIGGER IF EXISTS on_profile_created_add_habits ON public.profiles;

-- Now drop the obsolete function
DROP FUNCTION IF EXISTS public.create_default_habits();
