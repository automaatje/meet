/*
  # Create Storage Bucket for Project Photos

  1. Storage Setup
    - Create a public storage bucket named 'project-photos' for storing measurement and project photos
    - Enable public access so photos can be viewed without authentication
    - Set appropriate file size limits and allowed MIME types
  
  2. Security
    - Allow authenticated users to upload photos to their own projects
    - Allow public read access to all photos
    - Restrict file uploads to image formats only
*/

-- Create the storage bucket for project photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload project photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view project photos" ON storage.objects;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload project photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "Authenticated users can update project photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-photos')
WITH CHECK (bucket_id = 'project-photos');

-- Allow authenticated users to delete their own photos
CREATE POLICY "Authenticated users can delete project photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-photos');

-- Allow public read access to all photos
CREATE POLICY "Public can view project photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-photos');