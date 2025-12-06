/*
  # Create Multi-User System

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text) - Organization/company name
      - `owner_id` (uuid, references auth.users)
      - `subscription_plan` (text) - starter, professional, business, enterprise
      - `max_users` (integer) - Maximum team members allowed
      - `settings` (jsonb) - Organization settings
      - `created_at` (timestamptz)

    - `team_members`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `role` (text) - owner, admin, manager, employee, viewer
      - `permissions` (jsonb) - Custom permissions override
      - `is_active` (boolean) - Active status
      - `invited_by` (uuid, references auth.users)
      - `invited_at` (timestamptz)
      - `joined_at` (timestamptz)
      - `created_at` (timestamptz)

    - `team_invites`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `email` (text) - Invited email address
      - `role` (text) - Role to assign
      - `invited_by` (uuid, references auth.users)
      - `token` (text, unique) - Invite token
      - `expires_at` (timestamptz)
      - `accepted_at` (timestamptz)
      - `created_at` (timestamptz)

    - `activity_log`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `action` (text) - Action performed
      - `entity_type` (text) - Type of entity
      - `entity_id` (uuid) - ID of affected entity
      - `details` (jsonb) - Additional details
      - `ip_address` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Team members can only access their organization's data
    - Activity logs visible to organization members

  3. Indexes
    - Indexes for efficient querying
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'professional', 'business', 'enterprise')) DEFAULT 'starter',
  max_users INTEGER DEFAULT 1,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'viewer')) NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create team_invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'employee', 'viewer')) NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON team_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
      AND is_active = true
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Team members can view their organization's members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Owners and admins can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Owners and admins can update team members"
  ON team_members FOR UPDATE
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

CREATE POLICY "Owners and admins can delete team members"
  ON team_members FOR DELETE
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

-- RLS Policies for team_invites
CREATE POLICY "Team members can view their organization's invites"
  ON team_invites FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Owners and admins can create invites"
  ON team_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Owners and admins can delete invites"
  ON team_invites FOR DELETE
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

-- RLS Policies for activity_log
CREATE POLICY "Team members can view their organization's activity"
  ON activity_log FOR SELECT
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

CREATE POLICY "System can insert activity logs"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );