-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table to store resource embeddings
CREATE TABLE public.resource_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id)
);

-- Enable RLS
ALTER TABLE public.resource_embeddings ENABLE ROW LEVEL SECURITY;

-- Service role can manage embeddings (for edge functions)
CREATE POLICY "Service role can manage embeddings"
ON public.resource_embeddings
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for similarity search
CREATE INDEX ON public.resource_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to search similar resources
CREATE OR REPLACE FUNCTION public.match_resources(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  resource_id UUID,
  similarity float,
  content TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    resource_embeddings.resource_id,
    1 - (resource_embeddings.embedding <=> query_embedding) as similarity,
    resource_embeddings.content
  FROM resource_embeddings
  WHERE 1 - (resource_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY resource_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;