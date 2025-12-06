/*
  # Initial Schema for Painters & Insulation Quote App

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `postal_code` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `customer_id` (uuid, references customers)
      - `title` (text)
      - `description` (text)
      - `address` (text)
      - `status` (text: draft, sent, accepted, rejected)
      - `total_m2` (decimal)
      - `total_price` (decimal)
      - `quote_number` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `measurements`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `photo_url` (text)
      - `wall_area_m2` (decimal)
      - `doors_area_m2` (decimal)
      - `windows_area_m2` (decimal)
      - `net_area_m2` (decimal)
      - `reference_height` (decimal)
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `project_photos`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `photo_url` (text)
      - `caption` (text)
      - `photo_type` (text: before, after, detail)
      - `created_at` (timestamptz)
    
    - `price_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `material_price_per_m2` (decimal)
      - `labor_price_per_m2` (decimal)
      - `waste_percentage` (decimal)
      - `vat_percentage` (decimal)
      - `is_default` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `postal_code` (text)
      - `kvk_number` (text)
      - `btw_number` (text)
      - `logo_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own customers, projects, measurements, and templates
    - Projects and measurements are accessible through customer relationship
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  address text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  total_m2 decimal(10,2) DEFAULT 0,
  total_price decimal(10,2) DEFAULT 0,
  quote_number text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  photo_url text,
  wall_area_m2 decimal(10,2) DEFAULT 0,
  doors_area_m2 decimal(10,2) DEFAULT 0,
  windows_area_m2 decimal(10,2) DEFAULT 0,
  net_area_m2 decimal(10,2) DEFAULT 0,
  reference_height decimal(10,2),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create project_photos table
CREATE TABLE IF NOT EXISTS project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text DEFAULT '',
  photo_type text DEFAULT 'detail' CHECK (photo_type IN ('before', 'after', 'detail')),
  created_at timestamptz DEFAULT now()
);

-- Create price_templates table
CREATE TABLE IF NOT EXISTS price_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  material_price_per_m2 decimal(10,2) DEFAULT 0,
  labor_price_per_m2 decimal(10,2) DEFAULT 0,
  waste_percentage decimal(5,2) DEFAULT 10,
  vat_percentage decimal(5,2) DEFAULT 21,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  kvk_number text,
  btw_number text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Measurements policies
CREATE POLICY "Users can view measurements for own projects"
  ON measurements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = measurements.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create measurements for own projects"
  ON measurements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = measurements.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update measurements for own projects"
  ON measurements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = measurements.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = measurements.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete measurements for own projects"
  ON measurements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = measurements.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project photos policies
CREATE POLICY "Users can view photos for own projects"
  ON project_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_photos.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create photos for own projects"
  ON project_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_photos.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos for own projects"
  ON project_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_photos.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_photos.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for own projects"
  ON project_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_photos.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Price templates policies
CREATE POLICY "Users can view own price templates"
  ON price_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own price templates"
  ON price_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price templates"
  ON price_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own price templates"
  ON price_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_customer_id_idx ON projects(customer_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS measurements_project_id_idx ON measurements(project_id);
CREATE INDEX IF NOT EXISTS project_photos_project_id_idx ON project_photos(project_id);
CREATE INDEX IF NOT EXISTS price_templates_user_id_idx ON price_templates(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_templates_updated_at BEFORE UPDATE ON price_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();