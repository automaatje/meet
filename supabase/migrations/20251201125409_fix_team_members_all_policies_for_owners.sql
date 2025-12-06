/*
  # Fix ALL Team Members Policies for Organization Owners
  
  Critical cascading issue: When a user creates their first organization,
  they need to be able to INSERT themselves as a team member. But ALL the
  policies (SELECT, INSERT, UPDATE, DELETE) currently check functions that
  require an existing team_members entry, creating impossible chicken-and-egg
  scenarios.
  
  Solution: Add organization owner checks to ALL policies:
  1. SELECT - Allow owners to see team members even before their entry exists
  2. INSERT - Allow owners to create their first team member entry
  3. UPDATE - Allow owners to update team members
  4. DELETE - Allow owners to delete team members
*/

-- Drop all existing team_members policies
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- SELECT: Allow if user is org owner OR has team access
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_has_org_access(organization_id, auth.uid())
  );

-- INSERT: Allow if user is org owner OR is an admin
CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_is_org_admin(organization_id, auth.uid())
  );

-- UPDATE: Allow if user is org owner OR is an admin
CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_is_org_admin(organization_id, auth.uid())
  );

-- DELETE: Allow if user is org owner OR is an admin
CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_is_org_admin(organization_id, auth.uid())
  );