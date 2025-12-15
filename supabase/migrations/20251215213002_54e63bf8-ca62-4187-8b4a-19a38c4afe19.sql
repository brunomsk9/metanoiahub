-- Change material_url from single text to JSONB array for multiple attachments
ALTER TABLE public.lessons 
ALTER COLUMN material_url TYPE jsonb 
USING CASE 
  WHEN material_url IS NOT NULL AND material_url != '' 
  THEN jsonb_build_array(material_url) 
  ELSE '[]'::jsonb 
END;

-- Rename column to reflect plural
ALTER TABLE public.lessons RENAME COLUMN material_url TO materiais;

-- Set default to empty array
ALTER TABLE public.lessons ALTER COLUMN materiais SET DEFAULT '[]'::jsonb;