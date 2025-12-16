-- Add new categories to the resource_category enum
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'livro';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'musica';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'pregacao';

-- Add additional fields to resources table for richer content
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS autor text,
ADD COLUMN IF NOT EXISTS link_externo text,
ADD COLUMN IF NOT EXISTS imagem_capa text;