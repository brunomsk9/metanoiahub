-- Add Academia das Nações levels to discipleship_relationships
ALTER TABLE public.discipleship_relationships 
ADD COLUMN academia_nivel_1 boolean DEFAULT false,
ADD COLUMN academia_nivel_2 boolean DEFAULT false,
ADD COLUMN academia_nivel_3 boolean DEFAULT false,
ADD COLUMN academia_nivel_4 boolean DEFAULT false;