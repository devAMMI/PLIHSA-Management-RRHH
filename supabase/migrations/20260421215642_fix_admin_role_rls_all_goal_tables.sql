/*
  # Fix admin role missing from RLS policies on goal-related tables

  ## Problem
  Users with role 'admin' (e.g. Jessica Lopez, Karla Sagastume) were getting
  "row-level security policy violation" errors when trying to create or view
  evaluations because these tables had RLS policies that did NOT include 'admin'
  in the allowed roles list:

  - individual_goals: ALL and SELECT policies missing 'admin'
  - competency_behaviors: ALL and SELECT policies missing 'admin'

  ## Fix
  Drop and recreate the affected policies to include 'admin' in all role arrays.
*/

-- =============================================
-- individual_goals
-- =============================================
DROP POLICY IF EXISTS "RRHH and managers can manage individual goals" ON individual_goals;
DROP POLICY IF EXISTS "Users can view individual goals" ON individual_goals;

CREATE POLICY "Admins RRHH and managers can manage individual goals"
  ON individual_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
    )
  );

CREATE POLICY "Users can view individual goals"
  ON individual_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM goal_definitions gd
      JOIN system_users su ON su.user_id = auth.uid()
      WHERE gd.id = individual_goals.goal_definition_id
        AND su.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe','evaluator'])
    )
  );

-- =============================================
-- competency_behaviors
-- =============================================
DROP POLICY IF EXISTS "RRHH and managers can manage competency behaviors" ON competency_behaviors;
DROP POLICY IF EXISTS "Users can view competency behaviors" ON competency_behaviors;

CREATE POLICY "Admins RRHH and managers can manage competency behaviors"
  ON competency_behaviors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
    )
  );

CREATE POLICY "Users can view competency behaviors"
  ON competency_behaviors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM goal_definitions gd
      JOIN system_users su ON su.user_id = auth.uid()
      WHERE gd.id = competency_behaviors.goal_definition_id
        AND su.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe','evaluator'])
    )
  );
