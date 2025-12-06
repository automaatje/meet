/*
  # Rename price_templates columns

  1. Changes
    - Rename `material_price_per_m2` to `material_price_m2`
    - Rename `labor_price_per_m2` to `labor_price_m2`

  2. Reason
    - Fix inconsistency between database schema and application code
    - Align column names with rest of application naming conventions
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_templates' AND column_name = 'material_price_per_m2'
  ) THEN
    ALTER TABLE price_templates RENAME COLUMN material_price_per_m2 TO material_price_m2;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_templates' AND column_name = 'labor_price_per_m2'
  ) THEN
    ALTER TABLE price_templates RENAME COLUMN labor_price_per_m2 TO labor_price_m2;
  END IF;
END $$;
