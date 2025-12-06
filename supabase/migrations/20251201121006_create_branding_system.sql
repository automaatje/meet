/*
  # Create White-Label Branding System

  1. New Tables
    - `branding_themes`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `name` (text) - Theme name
      - `is_active` (boolean) - Active theme flag
      - `colors` (jsonb) - Color scheme (primary, secondary, accent, etc.)
      - `logo_url` (text) - Organization logo URL
      - `favicon_url` (text) - Favicon URL
      - `fonts` (jsonb) - Font configuration
      - `custom_css` (text) - Custom CSS for advanced styling
      - `created_at` (timestamptz)

    - `custom_domains`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `domain` (text, unique) - Custom domain name
      - `is_verified` (boolean) - DNS verification status
      - `verification_token` (text) - DNS verification token
      - `ssl_enabled` (boolean) - SSL/TLS status
      - `is_active` (boolean) - Domain active status
      - `created_at` (timestamptz)

    - `email_templates`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `template_type` (text) - invite, quote, invoice, reminder
      - `subject` (text) - Email subject line
      - `html_content` (text) - HTML email content
      - `variables` (jsonb) - Available template variables
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `theme_history`
      - `id` (uuid, primary key)
      - `theme_id` (uuid, references branding_themes)
      - `version` (integer) - Version number
      - `changes` (jsonb) - What changed
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Only organization members can access their branding

  3. Storage
    - Create branding-assets bucket for logos and favicons
*/

-- Create branding_themes table
CREATE TABLE IF NOT EXISTS branding_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Theme',
  is_active BOOLEAN DEFAULT false,
  colors JSONB NOT NULL DEFAULT '{"primary": "#2563EB", "secondary": "#10B981", "accent": "#F59E0B", "background": "#FFFFFF", "text": "#1F2937"}',
  logo_url TEXT,
  favicon_url TEXT,
  fonts JSONB DEFAULT '{"family": "Inter", "baseSize": 16}',
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  ssl_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_type TEXT CHECK (template_type IN ('invite', 'quote', 'invoice', 'reminder', 'work_order')) NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, template_type)
);

-- Create theme_history table
CREATE TABLE IF NOT EXISTS theme_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES branding_themes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changes JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_branding_themes_org ON branding_themes(organization_id);
CREATE INDEX IF NOT EXISTS idx_branding_themes_active ON branding_themes(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_domains_org ON custom_domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id, template_type);
CREATE INDEX IF NOT EXISTS idx_theme_history_theme ON theme_history(theme_id, version DESC);

-- Enable RLS
ALTER TABLE branding_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branding_themes
CREATE POLICY "Users can view their organization's themes"
  ON branding_themes FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage themes"
  ON branding_themes FOR ALL
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

-- RLS Policies for custom_domains
CREATE POLICY "Users can view their organization's domains"
  ON custom_domains FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage domains"
  ON custom_domains FOR ALL
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

-- RLS Policies for email_templates
CREATE POLICY "Users can view their organization's email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
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

-- RLS Policies for theme_history
CREATE POLICY "Users can view theme history"
  ON theme_history FOR SELECT
  TO authenticated
  USING (
    theme_id IN (
      SELECT id FROM branding_themes
      WHERE organization_id IN (
        SELECT organization_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

CREATE POLICY "System can insert theme history"
  ON theme_history FOR INSERT
  TO authenticated
  WITH CHECK (
    theme_id IN (
      SELECT id FROM branding_themes
      WHERE organization_id IN (
        SELECT organization_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );