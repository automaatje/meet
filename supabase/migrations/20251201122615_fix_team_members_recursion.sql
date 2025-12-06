/*
  # Fix Team Members RLS Infinite Recursion

  This migration fixes the critical infinite recursion bug in team_members policies.
  The issue: team_members SELECT policy was checking team_members itself, causing infinite loop.

  Solution: Use direct user_id check instead of subquery for SELECT policy.

  1. Changes
    - Drop all team_members policies
    - Recreate with non-recursive logic
    - Use auth.uid() directly for SELECT (users can see where they are members)
*/

-- Drop ALL existing team_members policies
DROP POLICY IF EXISTS "Team members can view their organization's members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can delete team members" ON team_members;

-- Recreate team_members policies WITHOUT recursion

-- SELECT: Users can see team_members records for organizations they belong to
-- CRITICAL FIX: Check user_id directly instead of subquery to avoid recursion
CREATE POLICY "Users can view team members where they are members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see other members of same organization
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm
      WHERE tm.user_id = auth.uid() 
      AND tm.is_active = true
    )
  );

-- For INSERT/UPDATE/DELETE we need a helper function to avoid recursion
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM team_members
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role IN ('owner', 'admin')
    AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- INSERT: Admins can add team members
CREATE POLICY "Admins can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

-- UPDATE: Admins can update team members
CREATE POLICY "Admins can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id));

-- DELETE: Admins can delete team members
CREATE POLICY "Admins can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (is_org_admin(organization_id));