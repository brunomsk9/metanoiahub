-- Add spiritual status fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_transferido boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_novo_convertido boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_batizado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS batizou_na_igreja boolean DEFAULT false;