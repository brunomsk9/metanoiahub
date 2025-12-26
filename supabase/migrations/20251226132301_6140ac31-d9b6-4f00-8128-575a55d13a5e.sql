-- Step 1: Add 'playbook' to resource_category enum
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'playbook';

-- Step 2: Add ministry_id column to resources
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_resources_ministry_id ON public.resources(ministry_id);