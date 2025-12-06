/*
  # Create Enterprise Security System

  1. New Tables
    - `security_settings`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `require_2fa` (boolean) - Force 2FA for all members
      - `allowed_ip_addresses` (text[]) - IP whitelist
      - `session_timeout_minutes` (integer) - Session timeout
      - `password_policy` (jsonb) - Password requirements
      - `settings` (jsonb) - Additional settings

    - `audit_logs`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `action` (text) - Action performed
      - `resource_type` (text) - Type of resource
      - `resource_id` (uuid) - Resource identifier
      - `old_values` (jsonb) - Previous state
      - `new_values` (jsonb) - New state
      - `ip_address` (text) - Client IP
      - `user_agent` (text) - Browser info
      - `created_at` (timestamptz)

    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_token` (text, unique) - Session identifier
      - `ip_address` (text) - Client IP
      - `user_agent` (text) - Browser info
      - `last_activity_at` (timestamptz) - Last request time
      - `expires_at` (timestamptz) - Session expiry
      - `created_at` (timestamptz)

    - `two_factor_secrets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `secret` (text) - TOTP secret
      - `backup_codes` (text[]) - Recovery codes
      - `is_enabled` (boolean) - 2FA status
      - `enabled_at` (timestamptz)

    - `login_attempts`
      - `id` (uuid, primary key)
      - `email` (text) - Login email
      - `success` (boolean) - Login result
      - `ip_address` (text) - Client IP
      - `user_agent` (text) - Browser info
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Only organization members can access their data
    - Audit logs are append-only

  3. Indexes
    - Performance indexes for queries
*/

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  require_2fa BOOLEAN DEFAULT false,
  allowed_ip_addresses TEXT[],
  session_timeout_minutes INTEGER DEFAULT 480,
  password_policy JSONB DEFAULT '{"min_length": 8, "require_uppercase": true, "require_number": true, "require_special": false}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create two_factor_secrets table
CREATE TABLE IF NOT EXISTS two_factor_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_two_factor_user ON two_factor_secrets(user_id);

-- Enable RLS
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_settings
CREATE POLICY "Admins can view their organization's security settings"
  ON security_settings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage security settings"
  ON security_settings FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their organization's audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for two_factor_secrets
CREATE POLICY "Users can view their own 2FA settings"
  ON two_factor_secrets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own 2FA settings"
  ON two_factor_secrets FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for login_attempts (admin only)
CREATE POLICY "Admins can view login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "System can insert login attempts"
  ON login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;