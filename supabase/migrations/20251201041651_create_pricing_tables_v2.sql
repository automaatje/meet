/*
  # Create Pricing Tables

  1. New Tables
    - `price_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Template name like "Interieur Schilderwerk"
      - `material_price_m2` (numeric) - Material cost per m²
      - `labor_price_m2` (numeric) - Labor cost per m²
      - `waste_percentage` (numeric) - Material waste percentage
      - `vat_percentage` (numeric) - VAT percentage
      - `is_default` (boolean) - Is this the default template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `quote_line_items`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `description` (text) - Line item description
      - `area_m2` (numeric) - Square meters
      - `template_id` (uuid, foreign key to price_templates, nullable)
      - `material_price_m2` (numeric) - Override material price
      - `labor_price_m2` (numeric) - Override labor price
      - `waste_percentage` (numeric) - Override waste percentage
      - `vat_percentage` (numeric) - Override VAT percentage
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own templates
    - Users can only access line items for their own projects
*/

-- Create price_templates table
CREATE TABLE IF NOT EXISTS price_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  material_price_m2 numeric(10,2) NOT NULL DEFAULT 0,
  labor_price_m2 numeric(10,2) NOT NULL DEFAULT 0,
  waste_percentage numeric(5,2) NOT NULL DEFAULT 10,
  vat_percentage numeric(5,2) NOT NULL DEFAULT 21,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quote_line_items table
CREATE TABLE IF NOT EXISTS quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  area_m2 numeric(10,2) NOT NULL DEFAULT 0,
  template_id uuid REFERENCES price_templates(id) ON DELETE SET NULL,
  material_price_m2 numeric(10,2) NOT NULL,
  labor_price_m2 numeric(10,2) NOT NULL,
  waste_percentage numeric(5,2) NOT NULL DEFAULT 10,
  vat_percentage numeric(5,2) NOT NULL DEFAULT 21,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_templates
DROP POLICY IF EXISTS "Users can view own templates" ON price_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON price_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON price_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON price_templates;

CREATE POLICY "Users can view own templates"
  ON price_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON price_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON price_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON price_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for quote_line_items
DROP POLICY IF EXISTS "Users can view line items for own projects" ON quote_line_items;
DROP POLICY IF EXISTS "Users can create line items for own projects" ON quote_line_items;
DROP POLICY IF EXISTS "Users can update line items for own projects" ON quote_line_items;
DROP POLICY IF EXISTS "Users can delete line items for own projects" ON quote_line_items;

CREATE POLICY "Users can view line items for own projects"
  ON quote_line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quote_line_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create line items for own projects"
  ON quote_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quote_line_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update line items for own projects"
  ON quote_line_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quote_line_items.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quote_line_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete line items for own projects"
  ON quote_line_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = quote_line_items.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_templates_user_id ON price_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_price_templates_is_default ON price_templates(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_project_id ON quote_line_items(project_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_sort_order ON quote_line_items(project_id, sort_order);