-- Índices compostos para as queries mais frequentes da aplicação

-- ============================================
-- 1. PROFILES - Leaderboard e busca por igreja
-- ============================================
-- Leaderboard: ORDER BY xp_points DESC com filtro church_id (implícito via RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_church_xp_desc 
ON public.profiles (church_id, xp_points DESC);

-- Busca de perfil por id com dados específicos
CREATE INDEX IF NOT EXISTS idx_profiles_streak_xp 
ON public.profiles (id) INCLUDE (nome, current_streak, xp_points, onboarding_completed, avatar_url);

-- ============================================
-- 2. DISCIPLESHIP_RELATIONSHIPS - Consultas frequentes
-- ============================================
-- Busca de discípulos por discipulador ativo
CREATE INDEX IF NOT EXISTS idx_disc_rel_discipulador_status_active 
ON public.discipleship_relationships (discipulador_id, status) 
WHERE status = 'active';

-- Busca de relacionamento por discípulo ativo
CREATE INDEX IF NOT EXISTS idx_disc_rel_discipulo_status_active 
ON public.discipleship_relationships (discipulo_id, status) 
WHERE status = 'active';

-- Verificação de alicerce completado por discípulo
CREATE INDEX IF NOT EXISTS idx_disc_rel_discipulo_alicerce 
ON public.discipleship_relationships (discipulo_id, alicerce_completed_presencial) 
WHERE alicerce_completed_presencial = true;

-- ============================================
-- 3. DAILY_HABITS - Hábitos diários
-- ============================================
-- Consulta de hábitos do dia por usuário
CREATE INDEX IF NOT EXISTS idx_daily_habits_user_date_type 
ON public.daily_habits (user_id, completed_date, habit_type);

-- ============================================
-- 4. USER_PROGRESS - Progresso de lições
-- ============================================
-- Lições completadas por usuário
CREATE INDEX IF NOT EXISTS idx_user_progress_user_lesson_completed 
ON public.user_progress (user_id, lesson_id) 
WHERE completed = true;

-- Contagem de lições completadas por usuário em curso específico
CREATE INDEX IF NOT EXISTS idx_user_progress_user_completed_lesson 
ON public.user_progress (user_id, completed, lesson_id);

-- ============================================
-- 5. USER_READING_PROGRESS - Planos de leitura
-- ============================================
-- Progresso por usuário e plano
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_plan 
ON public.user_reading_progress (user_id, plan_id) 
INCLUDE (current_day, completed_days, started_at);

-- ============================================
-- 6. MEETINGS - Encontros
-- ============================================
-- Encontros por discipulador ordenados por data
CREATE INDEX IF NOT EXISTS idx_meetings_discipulador_date_desc 
ON public.meetings (discipulador_id, data_encontro DESC);

-- Encontros por discípulo ordenados por data
CREATE INDEX IF NOT EXISTS idx_meetings_discipulo_date_desc 
ON public.meetings (discipulo_id, data_encontro DESC) 
WHERE discipulo_id IS NOT NULL;

-- ============================================
-- 7. MEETING_ATTENDANCE - Presença
-- ============================================
-- Presença por encontro
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting_discipulo 
ON public.meeting_attendance (meeting_id, discipulo_id, presente);

-- ============================================
-- 8. WEEKLY_CHECKLIST_RESPONSES - Respostas semanais
-- ============================================
-- Resposta por discipulador e semana
CREATE INDEX IF NOT EXISTS idx_weekly_responses_discipulador_week 
ON public.weekly_checklist_responses (discipulador_id, week_start DESC);

-- ============================================
-- 9. LESSONS - Lições por curso ordenadas
-- ============================================
-- Lições por curso com ordem
CREATE INDEX IF NOT EXISTS idx_lessons_course_ordem_include 
ON public.lessons (course_id, ordem) 
INCLUDE (id, titulo, tipo, duracao_minutos);

-- ============================================
-- 10. COURSES - Cursos por trilha ordenados
-- ============================================
-- Cursos por trilha com ordem
CREATE INDEX IF NOT EXISTS idx_courses_track_ordem_include 
ON public.courses (track_id, ordem) 
INCLUDE (id, titulo, descricao, publico_alvo);

-- ============================================
-- 11. HABIT_STREAKS - Sequências de hábitos
-- ============================================
-- Streak por usuário com dados
CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_include 
ON public.habit_streaks (user_id) 
INCLUDE (current_streak, best_streak, last_completed_date);

-- ============================================
-- 12. HABIT_ACHIEVEMENTS - Conquistas
-- ============================================
-- Conquistas por usuário
CREATE INDEX IF NOT EXISTS idx_habit_achievements_user_type 
ON public.habit_achievements (user_id, achievement_type);

-- ============================================
-- 13. TRACKS - Trilhas ordenadas
-- ============================================
-- Trilhas por igreja ordenadas
CREATE INDEX IF NOT EXISTS idx_tracks_church_ordem_base 
ON public.tracks (church_id, ordem, is_base);

-- ============================================
-- 14. READING_PLANS - Planos de leitura
-- ============================================
-- Planos por igreja ordenados por duração
CREATE INDEX IF NOT EXISTS idx_reading_plans_church_duracao 
ON public.reading_plans (church_id, duracao_dias DESC);