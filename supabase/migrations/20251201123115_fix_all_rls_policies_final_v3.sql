/*
  # Complete RLS Fix - Final Solution V3

  This migration completely fixes all RLS infinite recursion issues by:
  1. Using SECURITY DEFINER functions that bypass RLS
  2. Simplifying all policies to avoid circular dependencies
*/

-- Drop all team_members policies first
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- Drop all existing helper functions
DROP FUNCTION IF EXISTS get_user_organizations(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_org_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_has_org_access(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_is_org_admin(UUID, UUID) CASCADE;

-- Create SECURITY DEFINER functions in public schema
CREATE OR REPLACE FUNCTION public.user_has_org_access(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.team_members
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND is_active = true
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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
    AND role IN ('owner', 'admin')
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate team_members policies using the SECURITY DEFINER functions
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  TO authenticated
  USING (public.user_has_org_access(organization_id, auth.uid()));

CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (public.user_is_org_admin(organization_id, auth.uid()));

CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE
  TO authenticated
  USING (public.user_is_org_admin(organization_id, auth.uid()));

CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  TO authenticated
  USING (public.user_is_org_admin(organization_id, auth.uid()));

-- Fix organizations policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;

CREATE POLICY "organizations_select"
  ON organizations FOR SELECT
  TO authenticated
  USING (public.user_has_org_access(id, auth.uid()));

CREATE POLICY "organizations_update"
  ON organizations FOR UPDATE
  TO authenticated
  USING (public.user_is_org_admin(id, auth.uid()));