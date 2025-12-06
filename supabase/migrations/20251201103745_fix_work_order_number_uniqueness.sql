/*
  # Fix Work Order Number Uniqueness
  
  1. Changes
    - Remove unique constraint from work_order_number
    - Add user_id column to work_orders table
    - Create composite unique constraint on (user_id, work_order_number)
  
  2. Security
    - Update RLS policies to filter by user_id
  
  3. Notes
    - This allows different users to have the same work order numbers
    - Each user has their own sequence of work order numbers
*/

-- Add user_id column to work_orders if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_orders' AND column_name = 'user_id'
  ) THEN
    -- First, add the column as nullable
    ALTER TABLE work_orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Populate user_id from projects table for existing records
    UPDATE work_orders wo
    SET user_id = p.user_id
    FROM projects p
    WHERE wo.project_id = p.id;
    
    -- Now make it NOT NULL
    ALTER TABLE work_orders ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Drop the old unique constraint on work_order_number
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_work_order_number_key;

-- Create new unique constraint on user_id + work_order_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_user_id_work_order_number_key'
  ) THEN
    ALTER TABLE work_orders ADD CONSTRAINT work_orders_user_id_work_order_number_key 
      UNIQUE (user_id, work_order_number);
  END IF;
END $$;

-- Update RLS policies for work_orders
DROP POLICY IF EXISTS "Users can view own work orders" ON work_orders;
DROP POLICY IF EXISTS "Users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "Users can update own work orders" ON work_orders;
DROP POLICY IF EXISTS "Users can delete own work orders" ON work_orders;

CREATE POLICY "Users can view own work orders"
  ON work_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create work orders"
  ON work_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own work orders"
  ON work_orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own work orders"
  ON work_orders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
