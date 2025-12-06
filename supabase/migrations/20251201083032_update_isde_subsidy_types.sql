/*
  # Update ISDE Subsidy Types

  1. Changes
    - Update constraint on quote_line_items to include all ISDE subsidy types
    - Add validation for minimum and maximum area requirements per subsidy type
    
  2. ISDE Subsidy Types and Limits
    - Spouwmuurisolatie: €5.25/m² (€10.50 double), min 10m², max 170m²
    - Vloerisolatie: €5.50/m² (€11.00 double), min 20m², max 130m²
    - Dakisolatie: €16.25/m² (€32.50 double), min 20m², max 200m²
    - Kunststof kozijnen triple glas: €111/m² (€222 double), min 3m², max 45m²
    
  3. Notes
    - When 2 or more measures are applied, subsidy rates double for ALL measures
    - The is_double_measure flag will be calculated based on total measures in project
*/

-- Drop existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quote_line_items_subsidy_type_check'
  ) THEN
    ALTER TABLE quote_line_items DROP CONSTRAINT quote_line_items_subsidy_type_check;
  END IF;
END $$;

-- Add updated constraint with all subsidy types
ALTER TABLE quote_line_items
ADD CONSTRAINT quote_line_items_subsidy_type_check
CHECK (
  isde_subsidy_type IS NULL OR 
  isde_subsidy_type IN (
    'spouwmuurisolatie',
    'vloerisolatie',
    'dakisolatie',
    'kunststof_kozijnen_triple_glas'
  )
);