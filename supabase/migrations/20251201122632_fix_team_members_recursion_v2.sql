/*
  # Fix Team Members RLS Recursion - Complete Fix

  Complete fix for infinite recursion by using a materialized helper function
  that breaks the circular dependency.

  1. Changes
    - Drop all team_members policies
    - Create helper function with SECURITY DEFINER
    - Recreate policies using helper function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view team members where they are members" ON team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON team_members;

-- Drop helper function if exists
DROP FUNCTION IF EXISTS is_org_admin(UUID);

-- Create helper function to get user's organizations (breaks recursion)
CREATE OR REPLACE FUNCTION get_user_organizations(check_user_id UUID)
RETURNS TABLE(organization_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT tm.organization_id
  FROM team_members tm
  WHERE tm.user_id = check_user_id
  AND tm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper to check if user is admin
CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.user_id = check_user_id
    AND tm.organization_id = check_org_id
    AND tm.role IN ('owner', 'admin')
    AND tm.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- New policies using helper functions

-- SELECT: Most permissive - users can see team members of orgs they belong to
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (SELECT get_user_organizations(auth.uid()))
  );

-- INSERT: Only admins
CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(organization_id, auth.uid())
  );

-- UPDATE: Only admins
CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
  );

-- DELETE: Only admins
CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid())
  );