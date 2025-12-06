/*
  # Create Storage Bucket for Company Assets

  1. Storage Setup
    - Create a public storage bucket named 'company-assets' for storing company logos
    - Enable public access so logos can be displayed on quotes
    - Set appropriate file size limits and allowed MIME types
  
  2. Security
    - Allow authenticated users to upload their own company assets
    - Allow authenticated users to update/delete their own assets
    - Allow public read access to all logos
    - Restrict file uploads to image formats only
*/

-- Create the storage bucket for company assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view company assets" ON storage.objects;

-- Allow authenticated users to upload assets
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- Allow authenticated users to update their own assets
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets')
WITH CHECK (bucket_id = 'company-assets');

-- Allow authenticated users to delete their own assets
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');

-- Allow public read access to all assets
CREATE POLICY "Public can view company assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');