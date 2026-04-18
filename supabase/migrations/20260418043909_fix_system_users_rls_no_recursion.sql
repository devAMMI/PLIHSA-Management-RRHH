/*
  # Fix system_users RLS - Eliminate infinite recursion

  ## Problem
  The is_admin() function queries system_users using auth.uid(), but this
  function is called inside system_users RLS policies, causing infinite
  recursion when non-service-role clients try to UPDATE or DELETE rows.

  ## Solution
  1. Replace is_admin() with a version that avoids recursion by using
     a security definer function that bypasses RLS internally.
  2. Drop and recreate all system_users policies to be simpler and
     recursion-safe.

  ## Changes
  - Recreate is_admin() to be safe against recursion using SET search_path
  - Drop all existing system_users policies
  - Recreate SELECT, INSERT, UPDATE, DELETE policies using safe helpers
*/

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM system_users
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_system_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role FROM system_users WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

DROP POLICY IF EXISTS "Admins can view all system users" ON system_users;
DROP POLICY IF EXISTS "Users can view own profile" ON system_users;
DROP POLICY IF EXISTS "Admins can insert system users" ON system_users;
DROP POLICY IF EXISTS "Admins can update system users" ON system_users;
DROP POLICY IF EXISTS "Admins can delete system users" ON system_users;

CREATE POLICY "Select own or admin sees all"
  ON system_users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_admin()
  );

CREATE POLICY "Only admins can insert"
  ON system_users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update"
  ON system_users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete"
  ON system_users FOR DELETE
  TO authenticated
  USING (is_admin());
