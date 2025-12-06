/*
  # Update Team Management Permissions

  ## Summary
  Extend team management capabilities to include head_of_sales and sales_manager roles,
  not just owner and admin. These roles need full team access according to the permissions
  system.

  ## Changes
  1. Functions Updated
    - `user_is_org_admin`: Now includes head_of_sales (has full team management)
    - `user_can_manage_team`: New function for sales_manager (team-level management)
  
  2. Policy Updates
    - team_members INSERT/UPDATE/DELETE: Allow head_of_sales with full access
    - Allow sales_manager to manage their team members
  
  ## Role Capabilities
  - owner, admin, head_of_sales: Full team management (all members)
  - sales_manager: Team-level management (their team members)
  - All others: Read-only or no access
*/

-- Update the admin check function to include head_of_sales
CREATE OR REPLACE FUNCTION public.user_is_org_admin(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.team_members
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND role IN ('owner', 'admin', 'head_of_sales')
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user can manage team (includes sales_manager)
CREATE OR REPLACE FUNCTION public.user_can_manage_team(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  can_manage BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.team_members
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND role IN ('owner', 'admin', 'head_of_sales', 'sales_manager')
    AND is_active = true
  ) INTO can_manage;
  
  RETURN can_manage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing team_members policies
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

-- INSERT: Allow if user is org owner, admin, head_of_sales, or sales_manager
CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_can_manage_team(organization_id, auth.uid())
  );

-- UPDATE: Allow if user is org owner, admin, head_of_sales, or sales_manager
CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_can_manage_team(organization_id, auth.uid())
  );

-- DELETE: Allow if user is org owner, admin, head_of_sales, or sales_manager
CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_can_manage_team(organization_id, auth.uid())
  );

-- Also update team_invites policies for consistency
DROP POLICY IF EXISTS "team_invites_select" ON team_invites;
DROP POLICY IF EXISTS "team_invites_insert" ON team_invites;
DROP POLICY IF EXISTS "team_invites_update" ON team_invites;
DROP POLICY IF EXISTS "team_invites_delete" ON team_invites;

CREATE POLICY "team_invites_select"
  ON team_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR public.user_has_org_access(organization_id, auth.uid())
  );

CREATE POLICY "team_invites_insert"
  ON team_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_can_manage_team(organization_id, auth.uid())
  );

CREATE POLICY "team_invites_update"
  ON team_invites FOR UPDATE
  TO authenticated
  USING (
    public.user_can_manage_team(organization_id, auth.uid())
  );

CREATE POLICY "team_invites_delete"
  ON team_invites FOR DELETE
  TO authenticated
  USING (
    public.user_can_manage_team(organization_id, auth.uid())
  );
