/*
  # Create Storage Bucket for Visualization Photos

  1. New Bucket
    - `visualization-photos` - Stores original and edited photos for AI visualization feature
    
  2. Security
    - Authenticated users can upload to their own folders
    - Authenticated users can read from their own folders
    - Public read access disabled for privacy
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('visualization-photos', 'visualization-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload photos
CREATE POLICY "Users can upload visualization photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'visualization-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own photos
CREATE POLICY "Users can read own visualization photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'visualization-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own visualization photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'visualization-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'visualization-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own visualization photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'visualization-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);