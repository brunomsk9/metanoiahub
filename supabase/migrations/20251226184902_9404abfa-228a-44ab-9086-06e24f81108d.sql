-- Add baptism date column to profiles
ALTER TABLE public.profiles 
ADD COLUMN data_batismo date DEFAULT NULL;