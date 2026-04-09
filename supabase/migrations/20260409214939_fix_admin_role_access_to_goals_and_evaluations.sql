/*
  # Fix admin role access to goal definitions and evaluations

  ## Summary
  Jessica Lopez (admin) and Karla Sagastume (admin) cannot view goal definitions
  or access the full evaluations views. This migration fixes that.

  ## Changes

  ### 1. goal_definitions - SELECT policy
  - Old: superadmin, rrhh, manager, evaluator
  - New: superadmin, admin, rrhh, manager, evaluator

  ### 2. goal_definitions - DELETE policy
  - Old: superadmin, rrhh
  - New: superadmin, admin, rrhh

  ### 3. goal_definitions - UPDATE policy
  - Old: superadmin, rrhh, manager
  - New: superadmin, admin, rrhh, manager

  ### 4. operative_goal_definitions - SELECT policy (Admins and HR)
  - Already includes admin, but superadmin was in a separate policy
  - Merge into unified policy that includes superadmin + admin + rrhh + manager

  ## Security
  Admins (Jessica, Karla) get full read/delete/update access consistent with their role level.
*/

-- Fix goal_definitions SELECT policy: add admin role
DROP POLICY IF EXISTS "Users can view goal definitions" ON goal_definitions;
CREATE POLICY "Users can view goal definitions"
  ON goal_definitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','evaluator'])
    )
  );

-- Fix goal_definitions DELETE policy: add admin role
DROP POLICY IF EXISTS "RRHH and superadmin can delete goal definitions" ON goal_definitions;
CREATE POLICY "Admins and RRHH can delete goal definitions"
  ON goal_definitions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh'])
    )
  );

-- Fix goal_definitions UPDATE policy: add admin role
DROP POLICY IF EXISTS "RRHH and managers can update goal definitions" ON goal_definitions;
CREATE POLICY "Admins RRHH and managers can update goal definitions"
  ON goal_definitions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager'])
    )
  );

-- Fix goal_definitions INSERT policy: add admin role
DROP POLICY IF EXISTS "RRHH and managers can insert goal definitions" ON goal_definitions;
CREATE POLICY "Admins RRHH and managers can insert goal definitions"
  ON goal_definitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager'])
    )
  );

-- Fix operative_goal_definitions: unify SELECT policies to include all admin-level roles
DROP POLICY IF EXISTS "Admins and HR can view all operative goal definitions" ON operative_goal_definitions;
DROP POLICY IF EXISTS "Superadmins can view all operative goal definitions" ON operative_goal_definitions;
CREATE POLICY "Admins HR and superadmins can view all operative goal definitions"
  ON operative_goal_definitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh'])
    )
    OR employee_id IN (
      SELECT system_users.employee_id FROM system_users
      WHERE system_users.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM employees e
      JOIN system_users su ON su.employee_id = e.manager_id
      WHERE e.id = operative_goal_definitions.employee_id
        AND su.user_id = auth.uid()
    )
  );

-- Fix operative_goal_definitions DELETE: add admin
DROP POLICY IF EXISTS "Admins can delete operative goal definitions" ON operative_goal_definitions;
DROP POLICY IF EXISTS "Superadmins can delete operative goal definitions" ON operative_goal_definitions;
CREATE POLICY "Admins and superadmins can delete operative goal definitions"
  ON operative_goal_definitions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh'])
    )
  );

-- Fix operative_goal_definitions UPDATE: add admin
DROP POLICY IF EXISTS "Admins, HR, and Managers can update operative goal definitions" ON operative_goal_definitions;
DROP POLICY IF EXISTS "Superadmins can update operative goal definitions" ON operative_goal_definitions;
CREATE POLICY "Admins HR and managers can update operative goal definitions"
  ON operative_goal_definitions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager'])
    )
  );

-- Fix operative_goal_definitions INSERT: consolidate policies
DROP POLICY IF EXISTS "Admins, HR, and Managers can insert operative goal definitions" ON operative_goal_definitions;
DROP POLICY IF EXISTS "Superadmins can insert operative goal definitions" ON operative_goal_definitions;
CREATE POLICY "Admins HR and managers can insert operative goal definitions"
  ON operative_goal_definitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager'])
    )
  );
