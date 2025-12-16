-- Add column to track presencial completion by discipulador
ALTER TABLE public.discipleship_relationships
ADD COLUMN alicerce_completed_presencial BOOLEAN DEFAULT false,
ADD COLUMN alicerce_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX idx_discipleship_alicerce_completed 
ON public.discipleship_relationships(discipulo_id, alicerce_completed_presencial) 
WHERE alicerce_completed_presencial = true;