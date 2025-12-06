/*
  # Create Branding Assets Storage Bucket

  1. Storage
    - Create branding-assets bucket for logos and favicons
    - Set public access for logos
    - Configure size limits

  2. Security
    - Only organization members can upload
    - Public read access for assets
*/

-- Create branding-assets bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding-assets',
  'branding-assets',
  true,
  524288,
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding-assets
CREATE POLICY "Organization members can upload branding assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'branding-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM team_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Organization members can update their branding assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'branding-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM team_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Organization members can delete their branding assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'branding-assets' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM team_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Anyone can view branding assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'branding-assets');