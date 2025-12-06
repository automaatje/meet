/*
  # Set Default to Enterprise Plan

  ## Summary
  Update all existing organizations to Enterprise plan with unlimited users.
  This app is positioned as the premium enterprise solution.

  ## Changes
  1. Update existing organizations to enterprise plan with 999 max_users
  2. Change default values for new organizations to enterprise
  
  ## Notes
  - 999 users is effectively unlimited for most use cases
  - Enterprise plan provides all features
*/

-- Update existing organizations to enterprise
UPDATE organizations 
SET 
  subscription_plan = 'enterprise',
  max_users = 999
WHERE subscription_plan = 'starter';

-- Change default for new organizations
ALTER TABLE organizations 
  ALTER COLUMN subscription_plan SET DEFAULT 'enterprise';

ALTER TABLE organizations 
  ALTER COLUMN max_users SET DEFAULT 999;
