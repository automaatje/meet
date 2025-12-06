/*
  Update Sales Roles and Add Territory Management
  
  This migration implements a complete sales organization structure with:
  1. Five specialized sales roles with distinct responsibilities
  2. Territory management system for regional assignment
  
  New Roles:
  - head_of_sales: Commercial director with full sales oversight
  - sales_manager: Team lead managing multiple salespeople
  - account_manager_field: Field reps visiting customers and closing deals
  - commercial_inside: Inside sales handling quotes and follow-up
  - field_marketeer: Marketing on location, events and lead qualification
  
  Existing Roles:
  - owner, admin, employee, viewer (unchanged)
  
  New Tables:
  - territories: Regional territory assignment for account managers
*/

-- Update team_members role enum to include new sales roles
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
CHECK (role IN (
  'owner',
  'admin',
  'head_of_sales',
  'sales_manager',
  'account_manager_field',
  'commercial_inside',
  'field_marketeer',
  'employee',
  'viewer'
));

-- Create territories table for territory management
CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT,
  postal_codes TEXT[] DEFAULT '{}',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast territory lookups
CREATE INDEX IF NOT EXISTS idx_territories_org ON territories(organization_id);
CREATE INDEX IF NOT EXISTS idx_territories_assigned ON territories(assigned_to);

-- Enable RLS on territories
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for territories
CREATE POLICY "Users can view their organization territories"
  ON territories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = territories.organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = territories.organization_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Sales managers can create territories"
  ON territories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = territories.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'head_of_sales', 'sales_manager')
      AND is_active = true
    )
  );

CREATE POLICY "Sales managers can update territories"
  ON territories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = territories.organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = territories.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'head_of_sales', 'sales_manager')
      AND is_active = true
    )
  );

CREATE POLICY "Sales managers can delete territories"
  ON territories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = territories.organization_id
      AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE organization_id = territories.organization_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'head_of_sales', 'sales_manager')
      AND is_active = true
    )
  );