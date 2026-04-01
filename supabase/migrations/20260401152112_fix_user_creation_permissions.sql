/*
  # Fix User Creation Permissions

  1. Changes
    - Update is_admin() function to include superadmin role
    - Add is_superadmin() function for superadmin-only checks
    - Update system_users RLS policies to allow superadmin to manage users
  
  2. Security
    - Superadmin gets full access to user management
    - Admin keeps existing permissions
    - Both can create, read, update users
*/

-- Replace function (will work because we're redefining with same signature)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
    AND is_active = true
  );
END;
$$;

-- Function to check if user is specifically superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM system_users
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
    AND is_active = true
  );
END;
$$;

-- Add policy for superadmin to delete users if needed
DROP POLICY IF EXISTS "Admins can delete system users" ON system_users;
CREATE POLICY "Admins can delete system users"
  ON system_users
  FOR DELETE
  TO authenticated
  USING (is_admin());
