-- Add attachment column for complementary materials in lessons
ALTER TABLE public.lessons ADD COLUMN material_url text DEFAULT NULL;