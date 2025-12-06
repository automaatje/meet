/*
  # Add Organizations INSERT Policy

  Allows authenticated users to create their own organization.
  This is needed for the auto-organization-creation flow when users first sign up.

  1. Changes
    - Add INSERT policy for organizations table
    - Any authenticated user can create an organization where they are the owner
*/

-- Add INSERT policy for organizations
CREATE POLICY "Users can create their own organization"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());