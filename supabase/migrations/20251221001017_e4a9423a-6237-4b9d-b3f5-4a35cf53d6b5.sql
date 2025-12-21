-- Configure autovacuum settings for high-activity tables
-- These settings optimize vacuum and analyze operations for better performance

-- daily_habits - high insert frequency
ALTER TABLE public.daily_habits SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10
);

-- user_progress - frequent updates
ALTER TABLE public.user_progress SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10
);

-- habit_streaks - daily updates
ALTER TABLE public.habit_streaks SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10
);

-- user_reading_progress - frequent updates
ALTER TABLE public.user_reading_progress SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10
);

-- weekly_checklist_responses - weekly inserts/updates
ALTER TABLE public.weekly_checklist_responses SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- meetings - regular inserts
ALTER TABLE public.meetings SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- meeting_attendance - regular inserts
ALTER TABLE public.meeting_attendance SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- discipleship_relationships - moderate activity
ALTER TABLE public.discipleship_relationships SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- discipleship_notes - moderate activity  
ALTER TABLE public.discipleship_notes SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Run initial ANALYZE on all tables to update statistics
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.tracks;
ANALYZE public.courses;
ANALYZE public.lessons;
ANALYZE public.user_progress;
ANALYZE public.daily_habits;
ANALYZE public.habit_streaks;
ANALYZE public.user_reading_progress;
ANALYZE public.reading_plans;
ANALYZE public.reading_plan_days;
ANALYZE public.discipleship_relationships;
ANALYZE public.discipleship_notes;
ANALYZE public.meetings;
ANALYZE public.meeting_attendance;
ANALYZE public.resources;
ANALYZE public.weekly_checklist_items;
ANALYZE public.weekly_checklist_responses;
ANALYZE public.habit_definitions;
ANALYZE public.habit_achievements;
ANALYZE public.churches;
ANALYZE public.ai_settings;