-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON public.profiles(church_id);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Indexes for tracks table
CREATE INDEX IF NOT EXISTS idx_tracks_church_id ON public.tracks(church_id);
CREATE INDEX IF NOT EXISTS idx_tracks_is_base ON public.tracks(is_base) WHERE is_base = true;
CREATE INDEX IF NOT EXISTS idx_tracks_ordem ON public.tracks(ordem);

-- Indexes for courses table
CREATE INDEX IF NOT EXISTS idx_courses_track_id ON public.courses(track_id);
CREATE INDEX IF NOT EXISTS idx_courses_church_id ON public.courses(church_id);

-- Indexes for lessons table
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_church_id ON public.lessons(church_id);

-- Indexes for user_progress table
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_completed ON public.user_progress(user_id, completed) WHERE completed = true;

-- Indexes for user_reading_progress table
CREATE INDEX IF NOT EXISTS idx_user_reading_progress_user_id ON public.user_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_progress_plan_id ON public.user_reading_progress(plan_id);

-- Indexes for reading_plans table
CREATE INDEX IF NOT EXISTS idx_reading_plans_church_id ON public.reading_plans(church_id);

-- Indexes for reading_plan_days table
CREATE INDEX IF NOT EXISTS idx_reading_plan_days_plan_id ON public.reading_plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_reading_plan_days_plan_dia ON public.reading_plan_days(plan_id, dia);

-- Indexes for discipleship_relationships table
CREATE INDEX IF NOT EXISTS idx_discipleship_discipulador_id ON public.discipleship_relationships(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_discipulo_id ON public.discipleship_relationships(discipulo_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_church_id ON public.discipleship_relationships(church_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_status ON public.discipleship_relationships(status) WHERE status = 'active';

-- Indexes for daily_habits table
CREATE INDEX IF NOT EXISTS idx_daily_habits_user_id ON public.daily_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_habits_user_date ON public.daily_habits(user_id, completed_date);

-- Indexes for habit_streaks table
CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_id ON public.habit_streaks(user_id);

-- Indexes for meetings table
CREATE INDEX IF NOT EXISTS idx_meetings_discipulador_id ON public.meetings(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_meetings_church_id ON public.meetings(church_id);
CREATE INDEX IF NOT EXISTS idx_meetings_data_encontro ON public.meetings(data_encontro DESC);

-- Indexes for resources table
CREATE INDEX IF NOT EXISTS idx_resources_church_id ON public.resources(church_id);
CREATE INDEX IF NOT EXISTS idx_resources_categoria ON public.resources(categoria);

-- Indexes for weekly_checklist_responses table
CREATE INDEX IF NOT EXISTS idx_weekly_checklist_discipulador ON public.weekly_checklist_responses(discipulador_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checklist_week ON public.weekly_checklist_responses(week_start);

-- Indexes for habit_definitions table
CREATE INDEX IF NOT EXISTS idx_habit_definitions_church_id ON public.habit_definitions(church_id);

-- Indexes for weekly_checklist_items table
CREATE INDEX IF NOT EXISTS idx_weekly_checklist_items_church_id ON public.weekly_checklist_items(church_id);