/*
  # Add INSERT Policy for Organizations
  
  The critical missing piece: users need to be able to create their own organization
  when they first sign up.
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;

-- Allow users to select organizations they're members of
CREATE POLICY "organizations_select"
  ON organizations FOR SELECT
  TO authenticated
  USING (public.user_has_org_access(id, auth.uid()));

-- Allow users to update organizations they're members of
CREATE POLICY "organizations_update"
  ON organizations FOR UPDATE
  TO authenticated
  USING (public.user_has_org_access(id, auth.uid()))
  WITH CHECK (public.user_has_org_access(id, auth.uid()));

-- CRITICAL: Allow authenticated users to INSERT their first organization
-- This will be called when a user signs up and has no organization yet
CREATE POLICY "organizations_insert"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());