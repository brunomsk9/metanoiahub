-- Create table for reading plans
CREATE TABLE public.reading_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  duracao_dias INTEGER NOT NULL DEFAULT 7,
  cover_image TEXT,
  categoria TEXT NOT NULL DEFAULT 'devocional',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for reading plan days (content for each day)
CREATE TABLE public.reading_plan_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  dia INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  versiculo_referencia TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, dia)
);

-- Create table for user progress on reading plans
CREATE TABLE public.user_reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  current_day INTEGER NOT NULL DEFAULT 1,
  completed_days INTEGER[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, plan_id)
);

-- Enable RLS
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;

-- Policies for reading_plans (public read, admin write)
CREATE POLICY "Anyone can view reading plans" ON public.reading_plans FOR SELECT USING (true);
CREATE POLICY "Admins can insert reading plans" ON public.reading_plans FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update reading plans" ON public.reading_plans FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete reading plans" ON public.reading_plans FOR DELETE USING (is_admin(auth.uid()));

-- Policies for reading_plan_days (public read, admin write)
CREATE POLICY "Anyone can view reading plan days" ON public.reading_plan_days FOR SELECT USING (true);
CREATE POLICY "Admins can insert reading plan days" ON public.reading_plan_days FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update reading plan days" ON public.reading_plan_days FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete reading plan days" ON public.reading_plan_days FOR DELETE USING (is_admin(auth.uid()));

-- Policies for user_reading_progress (users manage their own)
CREATE POLICY "Users can view their own progress" ON public.user_reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_reading_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.user_reading_progress FOR DELETE USING (auth.uid() = user_id);