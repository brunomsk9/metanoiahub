-- Add gender enum type
CREATE TYPE public.gender_type AS ENUM ('masculino', 'feminino', 'unissex');

-- Add gender column to profiles
ALTER TABLE public.profiles 
ADD COLUMN genero public.gender_type DEFAULT NULL;

-- Add gender restriction column to ministry_positions
ALTER TABLE public.ministry_positions 
ADD COLUMN genero_restrito public.gender_type DEFAULT 'unissex';

-- Update existing positions to unissex
UPDATE public.ministry_positions SET genero_restrito = 'unissex' WHERE genero_restrito IS NULL;