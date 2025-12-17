-- Add tipo_material column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN tipo_material text DEFAULT 'pdf';