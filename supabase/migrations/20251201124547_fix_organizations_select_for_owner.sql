/*
  # Fix Organizations SELECT Policy for Owners
  
  The critical issue: when a new user creates an organization, they can't 
  immediately read it because they don't have a team_members entry yet.
  
  Solution: Allow users to SELECT organizations where they are the owner,
  OR where they have team_members access.
*/

-- Drop and recreate the SELECT policy to include owner check
DROP POLICY IF EXISTS "organizations_select" ON organizations;

CREATE POLICY "organizations_select"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.user_has_org_access(id, auth.uid())
  );