-- Create table for custom habit definitions
CREATE TABLE public.habit_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  color TEXT NOT NULL DEFAULT 'primary',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habit_definitions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own habits" 
ON public.habit_definitions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" 
ON public.habit_definitions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
ON public.habit_definitions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
ON public.habit_definitions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_habit_definitions_user_id ON public.habit_definitions(user_id);

-- Function to create default habits for new users
CREATE OR REPLACE FUNCTION public.create_default_habits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.habit_definitions (user_id, name, icon, color, is_default, ordem)
  VALUES 
    (NEW.id, 'Leitura Bíblica', 'book', 'primary', true, 0),
    (NEW.id, 'Oração', 'heart', 'rose', true, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create default habits when a profile is created
CREATE TRIGGER on_profile_created_add_habits
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_habits();