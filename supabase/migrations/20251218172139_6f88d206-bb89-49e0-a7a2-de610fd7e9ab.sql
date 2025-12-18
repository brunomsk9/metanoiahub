-- Create table for AI prompt history
CREATE TABLE public.ai_prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompt_history ENABLE ROW LEVEL SECURITY;

-- Admins can view history
CREATE POLICY "Admins can view prompt history"
ON public.ai_prompt_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert history
CREATE POLICY "Admins can insert prompt history"
ON public.ai_prompt_history
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_ai_prompt_history_setting_key ON public.ai_prompt_history(setting_key);
CREATE INDEX idx_ai_prompt_history_changed_at ON public.ai_prompt_history(changed_at DESC);