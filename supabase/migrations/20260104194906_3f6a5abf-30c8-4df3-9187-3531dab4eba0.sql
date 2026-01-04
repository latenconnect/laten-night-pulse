-- Create storage bucket for professional profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-photos', 'professional-photos', true);

-- Allow authenticated users to upload their own professional photos
CREATE POLICY "Users can upload their own professional photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'professional-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own professional photos
CREATE POLICY "Users can update their own professional photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'professional-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own professional photos
CREATE POLICY "Users can delete their own professional photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'professional-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to professional photos
CREATE POLICY "Professional photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'professional-photos');