-- Create storage bucket for support materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais', 'materiais', true);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public can view materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'materiais');

-- Allow admins to upload files
CREATE POLICY "Admins can upload materials"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'materiais' AND is_admin(auth.uid()));

-- Allow admins to update files
CREATE POLICY "Admins can update materials"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'materiais' AND is_admin(auth.uid()));

-- Allow admins to delete files
CREATE POLICY "Admins can delete materials"
ON storage.objects
FOR DELETE
USING (bucket_id = 'materiais' AND is_admin(auth.uid()));