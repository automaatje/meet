/*
  # Simple RLS for Security Tables
  
  Re-enable RLS with super simple policies that don't cause recursion.
  The key: no JOINs, no subqueries, just direct user_id or organization_id checks.
*/

-- Re-enable RLS
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage security settings" ON security_settings;
DROP POLICY IF EXISTS "Users can view security settings" ON security_settings;
DROP POLICY IF EXISTS "Users can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can manage their sessions" ON user_sessions;

-- Security settings: simple organization-based access
CREATE POLICY "security_settings_all"
  ON security_settings FOR ALL
  TO authenticated
  USING (public.user_has_org_access(organization_id, auth.uid()))
  WITH CHECK (public.user_has_org_access(organization_id, auth.uid()));

-- Audit logs: simple organization-based access  
CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (public.user_has_org_access(organization_id, auth.uid()));

CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_org_access(organization_id, auth.uid()));

-- User sessions: simple user_id check (no organization needed)
CREATE POLICY "user_sessions_all"
  ON user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());