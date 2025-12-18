-- Allow public read access to active churches for login/signup
CREATE POLICY "Anyone can view active churches"
ON public.churches
FOR SELECT
USING (is_active = true);