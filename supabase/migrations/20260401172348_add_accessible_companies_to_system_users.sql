/*
  # Add accessible companies to system users

  ## Overview
  Add support for users to access multiple companies beyond their primary company.

  ## Changes
  
  1. New Column
    - `accessible_company_ids` (uuid[]): Array of company IDs the user can access
      - NULL or empty array means user only has access to their primary company
      - Superadmins can have access to all companies
  
  2. Helper Function
    - Function to check if user has access to a specific company
  
  ## Security
    - Only users with appropriate permissions can modify accessible companies
    - Users can only view/manage employees from companies they have access to
*/

-- Add accessible_company_ids column to system_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_users' AND column_name = 'accessible_company_ids'
  ) THEN
    ALTER TABLE system_users 
    ADD COLUMN accessible_company_ids uuid[] DEFAULT NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN system_users.accessible_company_ids IS 
'Array of company IDs the user can access. NULL or empty means only primary company. Superadmins typically have access to all companies.';

-- Create function to check if user has access to a company
CREATE OR REPLACE FUNCTION user_has_company_access(
  p_user_id uuid,
  p_company_id uuid
) RETURNS boolean AS $$
DECLARE
  v_user_company_id uuid;
  v_accessible_companies uuid[];
  v_role text;
BEGIN
  -- Get user's primary company, accessible companies, and role
  SELECT company_id, accessible_company_ids, role
  INTO v_user_company_id, v_accessible_companies, v_role
  FROM system_users
  WHERE user_id = p_user_id AND is_active = true;

  -- If user not found or inactive, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Superadmins have access to all companies
  IF v_role = 'superadmin' THEN
    RETURN true;
  END IF;

  -- Check if it's the user's primary company
  IF v_user_company_id = p_company_id THEN
    RETURN true;
  END IF;

  -- Check if company is in accessible companies list
  IF v_accessible_companies IS NOT NULL AND p_company_id = ANY(v_accessible_companies) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_has_company_access(uuid, uuid) TO authenticated;