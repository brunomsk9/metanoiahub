-- Make habit_definitions global (not per user) - managed by admins only
-- First, drop the old table and recreate with new structure
DROP TABLE IF EXISTS public.habit_definitions CASCADE;

CREATE TABLE public.habit_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  color TEXT NOT NULL DEFAULT 'primary',
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default habits
INSERT INTO public.habit_definitions (name, icon, color, ordem)
VALUES 
  ('Leitura Bíblica', 'book', 'primary', 0),
  ('Oração', 'heart', 'rose', 1);

-- Enable RLS
ALTER TABLE public.habit_definitions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage habits
CREATE POLICY "Anyone can view active habits" 
ON public.habit_definitions 
FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert habits" 
ON public.habit_definitions 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update habits" 
ON public.habit_definitions 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete habits" 
ON public.habit_definitions 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create habit streaks table for tracking consecutive days
CREATE TABLE public.habit_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own streaks
CREATE POLICY "Users can view their own streaks" 
ON public.habit_streaks 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own streaks" 
ON public.habit_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
ON public.habit_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE public.habit_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  streak_days INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" 
ON public.habit_achievements 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own achievements" 
ON public.habit_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_habit_streaks_user_id ON public.habit_streaks(user_id);
CREATE INDEX idx_habit_achievements_user_id ON public.habit_achievements(user_id);
CREATE UNIQUE INDEX idx_habit_streaks_unique_user ON public.habit_streaks(user_id);
CREATE UNIQUE INDEX idx_habit_achievements_unique ON public.habit_achievements(user_id, achievement_type);