/*
  # Fix RLS Infinite Recursion

  This migration fixes the infinite recursion issue in RLS policies
  by simplifying the policy checks and avoiding circular dependencies.

  1. Changes
    - Drop problematic policies that cause recursion
    - Recreate with simpler, non-recursive checks
    - Use direct auth.uid() checks where possible
*/

-- Drop and recreate security_settings policies
DROP POLICY IF EXISTS "Admins can view their organization's security settings" ON security_settings;
DROP POLICY IF EXISTS "Admins can manage security settings" ON security_settings;

CREATE POLICY "Users can view security settings"
  ON security_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = security_settings.organization_id
      AND team_members.is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Admins can manage security settings"
  ON security_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = security_settings.organization_id
      AND team_members.role IN ('owner', 'admin')
      AND team_members.is_active = true
      LIMIT 1
    )
  );

-- Drop and recreate audit_logs policies
DROP POLICY IF EXISTS "Users can view their organization's audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = audit_logs.organization_id
      AND team_members.role IN ('owner', 'admin')
      AND team_members.is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop and recreate branding_themes policies
DROP POLICY IF EXISTS "Users can view their organization's themes" ON branding_themes;
DROP POLICY IF EXISTS "Admins can manage themes" ON branding_themes;

CREATE POLICY "Users can view themes"
  ON branding_themes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = branding_themes.organization_id
      AND team_members.is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Admins can manage themes"
  ON branding_themes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = branding_themes.organization_id
      AND team_members.role IN ('owner', 'admin')
      AND team_members.is_active = true
      LIMIT 1
    )
  );

-- Drop and recreate custom_domains policies
DROP POLICY IF EXISTS "Users can view their organization's domains" ON custom_domains;
DROP POLICY IF EXISTS "Admins can manage domains" ON custom_domains;

CREATE POLICY "Users can view domains"
  ON custom_domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = custom_domains.organization_id
      AND team_members.is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Admins can manage domains"
  ON custom_domains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = custom_domains.organization_id
      AND team_members.role IN ('owner', 'admin')
      AND team_members.is_active = true
      LIMIT 1
    )
  );

-- Drop and recreate email_templates policies
DROP POLICY IF EXISTS "Users can view their organization's email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;

CREATE POLICY "Users can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = email_templates.organization_id
      AND team_members.is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = email_templates.organization_id
      AND team_members.role IN ('owner', 'admin')
      AND team_members.is_active = true
      LIMIT 1
    )
  );

-- Drop and recreate integrations policies
DROP POLICY IF EXISTS "Users can view their organization's integrations" ON integrations;
DROP POLICY IF EXISTS "Admins can manage integrations" ON integrations;

CREATE POLICY "Users can view integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = integrations.organization_id
      AND team_members.is_active = true
      LIMIT 1
    )
  );

CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.organization_id = integrations.organization_id
      AND team_members.role IN ('owner', 'admin')
      AND team_members.is_active = true
      LIMIT 1
    )
  );