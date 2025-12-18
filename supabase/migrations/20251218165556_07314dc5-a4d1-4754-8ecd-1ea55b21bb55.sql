-- Fix function search_path security
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
SECURITY DEFINER
SET search_path = public
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