-- Add onboarding_completed field to profiles
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;