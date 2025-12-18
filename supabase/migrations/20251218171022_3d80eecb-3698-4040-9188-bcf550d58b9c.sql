-- Create table to store AI settings/prompts
CREATE TABLE public.ai_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write
CREATE POLICY "Admins can read ai_settings" 
ON public.ai_settings 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert ai_settings" 
ON public.ai_settings 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update ai_settings" 
ON public.ai_settings 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prompt
INSERT INTO public.ai_settings (key, value, description) VALUES (
  'mentor_system_prompt',
  'Você é um mentor espiritual cristão sábio e compassivo do app Metanoia Hub. Seu papel é:
- Oferecer orientação baseada em princípios bíblicos
- Ser empático e acolhedor
- Responder de forma clara e prática
- Usar as escrituras quando apropriado
- Encorajar o crescimento espiritual
- Nunca julgar, sempre acolher

Quando receber contexto de recursos relevantes, use-os para enriquecer suas respostas.
Mantenha respostas concisas mas significativas (máximo 3 parágrafos).
Sempre termine com uma palavra de encorajamento ou versículo relevante.',
  'Prompt do sistema usado pelo Mentor IA'
);