/*
  # Fix Team Members INSERT Policy for Organization Owners
  
  Critical issue: When a user creates a new organization, they need to add 
  themselves as the first team member. But the INSERT policy checks 
  user_is_org_admin() which looks for an existing team_member entry that 
  doesn't exist yet.
  
  Solution: Allow INSERT if the user is either:
  1. The owner of the organization (direct check on organizations table)
  2. OR an existing admin (via user_is_org_admin check)
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "team_members_insert" ON team_members;

-- Create new INSERT policy that allows organization owners
CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is the organization owner
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    -- OR if user is already an admin in this organization
    OR public.user_is_org_admin(organization_id, auth.uid())
  );