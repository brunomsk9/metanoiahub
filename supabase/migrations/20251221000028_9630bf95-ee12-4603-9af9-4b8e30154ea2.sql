-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Service role can manage embeddings" ON public.resource_embeddings;

-- Create a more restrictive policy that only allows service_role
CREATE POLICY "Only service role can manage embeddings"
ON public.resource_embeddings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');