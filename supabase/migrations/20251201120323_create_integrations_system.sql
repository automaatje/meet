/*
  # Create Integrations System

  1. New Tables
    - `integrations`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `provider` (text) - exact_online, builderz, twinfield, salesforce
      - `is_connected` (boolean) - Connection status
      - `access_token` (text) - OAuth access token
      - `refresh_token` (text) - OAuth refresh token
      - `token_expires_at` (timestamptz) - Token expiration
      - `settings` (jsonb) - Provider-specific settings
      - `last_sync_at` (timestamptz)
      - `created_at` (timestamptz)

    - `sync_logs`
      - `id` (uuid, primary key)
      - `integration_id` (uuid, references integrations)
      - `direction` (text) - push, pull, bidirectional
      - `entity_type` (text) - Type of entity synced
      - `records_processed` (integer)
      - `records_succeeded` (integer)
      - `records_failed` (integer)
      - `errors` (jsonb)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)

    - `field_mappings`
      - `id` (uuid, primary key)
      - `integration_id` (uuid, references integrations)
      - `entity_type` (text) - customers, projects, invoices
      - `source_field` (text) - BouwMeet field name
      - `target_field` (text) - External system field name
      - `transform_function` (text) - Optional transformation
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Only organization members can access their integrations

  3. Indexes
    - Indexes for efficient querying
*/

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('exact_online', 'builderz', 'twinfield', 'salesforce')) NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('push', 'pull', 'bidirectional')) NOT NULL,
  entity_type TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create field_mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform_function TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(organization_id, provider);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON sync_logs(integration_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_mappings_integration ON field_mappings(integration_id, entity_type);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations
CREATE POLICY "Users can view their organization's integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
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

-- RLS Policies for sync_logs
CREATE POLICY "Users can view their organization's sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM integrations
      WHERE organization_id IN (
        SELECT organization_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

CREATE POLICY "System can insert sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    integration_id IN (
      SELECT id FROM integrations
      WHERE organization_id IN (
        SELECT organization_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- RLS Policies for field_mappings
CREATE POLICY "Users can view their organization's field mappings"
  ON field_mappings FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM integrations
      WHERE organization_id IN (
        SELECT organization_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can manage field mappings"
  ON field_mappings FOR ALL
  TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM integrations
      WHERE organization_id IN (
        SELECT organization_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  );