-- Drop existing public SELECT policies
DROP POLICY IF EXISTS "Anyone can view reading plans" ON public.reading_plans;
DROP POLICY IF EXISTS "Anyone can view reading plan days" ON public.reading_plan_days;
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;

-- Create new policies requiring authentication
CREATE POLICY "Authenticated users can view reading plans" 
ON public.reading_plans 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view reading plan days" 
ON public.reading_plan_days 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view resources" 
ON public.resources 
FOR SELECT 
USING (auth.uid() IS NOT NULL);