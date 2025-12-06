/*
  # Create Visualizations and Products Tables

  1. New Tables
    - `visualizations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `original_photo_url` (text) - URL to original photo
      - `visualization_photo_url` (text, nullable) - URL to edited photo with products
      - `detected_objects` (jsonb) - Array of detected windows/doors with coordinates
      - `selected_product_id` (uuid, nullable) - Product selected for visualization
      - `created_at` (timestamptz)
      
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `category` (text) - Type of product: window, door, exterior_door
      - `name` (text) - Product name
      - `brand` (text, nullable) - Brand name
      - `product_image_url` (text) - URL to product image
      - `price` (numeric, nullable) - Product price
      - `color` (text, nullable) - Product color
      - `style` (text, nullable) - Product style
      - `description` (text, nullable) - Product description
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create visualizations table
CREATE TABLE IF NOT EXISTS visualizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  original_photo_url text NOT NULL,
  visualization_photo_url text,
  detected_objects jsonb DEFAULT '[]'::jsonb,
  selected_product_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visualizations_project ON visualizations(project_id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('window', 'door', 'exterior_door')),
  name text NOT NULL,
  brand text,
  product_image_url text NOT NULL,
  price numeric(10,2),
  color text,
  style text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Enable RLS
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies for visualizations
CREATE POLICY "Users can view visualizations for their projects"
  ON visualizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = visualizations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create visualizations for their projects"
  ON visualizations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = visualizations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update visualizations for their projects"
  ON visualizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = visualizations.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = visualizations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete visualizations for their projects"
  ON visualizations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = visualizations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policies for products
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);