/*
  # Add 'jefe' role to all RLS policies that reference 'manager'

  ## Summary
  Updates all Row Level Security policies that check for the 'manager' role
  to also include the new 'jefe' role. This ensures jefe users have identical
  database-level access as manager users.

  ## Tables updated
  - administrative_evaluations
  - competency_behaviors
  - employees (view subordinates policy)
  - evaluation_competencies
  - evaluation_functional_reviews
  - evaluation_goal_reviews
  - evaluation_goals
  - evaluation_individual_goals
  - evaluations
  - goal_definitions
  - individual_goals
  - operative_competency_reviews
  - operative_evaluation_competencies (no manager ref)
  - operative_evaluations
  - operative_goal_definitions
  - operative_individual_goals
  - operative_quality_indicators
  - operative_safety_standards
*/

-- administrative_evaluations: insert policy
DROP POLICY IF EXISTS "RRHH and admins can insert evaluations" ON administrative_evaluations;
CREATE POLICY "RRHH and admins can insert evaluations"
  ON administrative_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- administrative_evaluations: update policy
DROP POLICY IF EXISTS "RRHH and admins can update evaluations" ON administrative_evaluations;
CREATE POLICY "RRHH and admins can update evaluations"
  ON administrative_evaluations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- competency_behaviors: manage policy
DROP POLICY IF EXISTS "RRHH and managers can manage competency behaviors" ON competency_behaviors;
CREATE POLICY "RRHH and managers can manage competency behaviors"
  ON competency_behaviors FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','rrhh','manager','jefe'])
  ));

-- competency_behaviors: view policy
DROP POLICY IF EXISTS "Users can view competency behaviors" ON competency_behaviors;
CREATE POLICY "Users can view competency behaviors"
  ON competency_behaviors FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM goal_definitions gd
    JOIN system_users su ON su.user_id = auth.uid()
    WHERE gd.id = competency_behaviors.goal_definition_id
      AND su.role = ANY (ARRAY['superadmin','rrhh','manager','jefe','evaluator'])
  ));

-- employees: view subordinates policy
DROP POLICY IF EXISTS "Managers can view their direct subordinates" ON employees;
CREATE POLICY "Managers can view their direct subordinates"
  ON employees FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users su
    WHERE su.user_id = auth.uid()
      AND su.role = ANY (ARRAY['manager','jefe'])
      AND su.is_active = true
      AND su.employee_id = employees.manager_id
  ));

-- evaluation_competencies: insert
DROP POLICY IF EXISTS "RRHH and managers can insert competencies" ON evaluation_competencies;
CREATE POLICY "RRHH and managers can insert competencies"
  ON evaluation_competencies FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- evaluation_competencies: update
DROP POLICY IF EXISTS "RRHH and managers can update competencies" ON evaluation_competencies;
CREATE POLICY "RRHH and managers can update competencies"
  ON evaluation_competencies FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- evaluation_functional_reviews: manage
DROP POLICY IF EXISTS "RRHH and managers can manage functional reviews" ON evaluation_functional_reviews;
CREATE POLICY "RRHH and managers can manage functional reviews"
  ON evaluation_functional_reviews FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- evaluation_goal_reviews: manage
DROP POLICY IF EXISTS "RRHH and managers can manage goal reviews" ON evaluation_goal_reviews;
CREATE POLICY "RRHH and managers can manage goal reviews"
  ON evaluation_goal_reviews FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- evaluation_goals: manage
DROP POLICY IF EXISTS "HR and managers can manage goals" ON evaluation_goals;
CREATE POLICY "HR and managers can manage goals"
  ON evaluation_goals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['admin','rrhh','manager','jefe'])
  ));

-- evaluation_goals: view based on access
DROP POLICY IF EXISTS "Users can view goals based on evaluation access" ON evaluation_goals;
CREATE POLICY "Users can view goals based on evaluation access"
  ON evaluation_goals FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM evaluations e
      JOIN system_users su ON su.employee_id = (SELECT evaluations.employee_id FROM evaluations WHERE evaluations.id = e.id)
      WHERE e.id = evaluation_goals.evaluation_id AND su.user_id = auth.uid()
    ))
    OR
    (EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['admin','rrhh','manager','jefe'])
    ))
  );

-- evaluation_individual_goals: insert
DROP POLICY IF EXISTS "RRHH and managers can insert goals" ON evaluation_individual_goals;
CREATE POLICY "RRHH and managers can insert goals"
  ON evaluation_individual_goals FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- evaluation_individual_goals: update
DROP POLICY IF EXISTS "RRHH and managers can update goals" ON evaluation_individual_goals;
CREATE POLICY "RRHH and managers can update goals"
  ON evaluation_individual_goals FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- evaluations: view own
DROP POLICY IF EXISTS "Employees can view own evaluations" ON evaluations;
CREATE POLICY "Employees can view own evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM system_users su
      JOIN employees e ON e.id = su.employee_id
      WHERE su.user_id = auth.uid() AND e.id = evaluations.employee_id
    ))
    OR
    (EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = ANY (ARRAY['admin','rrhh','manager','jefe'])
    ))
  );

-- evaluations: HR and managers manage
DROP POLICY IF EXISTS "HR and managers can manage evaluations" ON evaluations;
CREATE POLICY "HR and managers can manage evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['admin','rrhh','manager','jefe'])
  ));

-- goal_definitions: insert
DROP POLICY IF EXISTS "Admins RRHH and managers can insert goal definitions" ON goal_definitions;
CREATE POLICY "Admins RRHH and managers can insert goal definitions"
  ON goal_definitions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- goal_definitions: update
DROP POLICY IF EXISTS "Admins RRHH and managers can update goal definitions" ON goal_definitions;
CREATE POLICY "Admins RRHH and managers can update goal definitions"
  ON goal_definitions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- goal_definitions: view
DROP POLICY IF EXISTS "Users can view goal definitions" ON goal_definitions;
CREATE POLICY "Users can view goal definitions"
  ON goal_definitions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe','evaluator'])
  ));

-- individual_goals: manage
DROP POLICY IF EXISTS "RRHH and managers can manage individual goals" ON individual_goals;
CREATE POLICY "RRHH and managers can manage individual goals"
  ON individual_goals FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','rrhh','manager','jefe'])
  ));

-- individual_goals: view
DROP POLICY IF EXISTS "Users can view individual goals" ON individual_goals;
CREATE POLICY "Users can view individual goals"
  ON individual_goals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM goal_definitions gd
    JOIN system_users su ON su.user_id = auth.uid()
    WHERE gd.id = individual_goals.goal_definition_id
      AND su.role = ANY (ARRAY['superadmin','rrhh','manager','jefe','evaluator'])
  ));

-- operative_competency_reviews: manage
DROP POLICY IF EXISTS "RRHH and managers can manage operative competency reviews" ON operative_competency_reviews;
CREATE POLICY "RRHH and managers can manage operative competency reviews"
  ON operative_competency_reviews FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_evaluations: insert
DROP POLICY IF EXISTS "RRHH and admins can insert operative evaluations" ON operative_evaluations;
CREATE POLICY "RRHH and admins can insert operative evaluations"
  ON operative_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_evaluations: update
DROP POLICY IF EXISTS "RRHH and admins can update operative evaluations" ON operative_evaluations;
CREATE POLICY "RRHH and admins can update operative evaluations"
  ON operative_evaluations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_goal_definitions: insert
DROP POLICY IF EXISTS "Admins HR and managers can insert operative goal definitions" ON operative_goal_definitions;
CREATE POLICY "Admins HR and managers can insert operative goal definitions"
  ON operative_goal_definitions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_goal_definitions: update
DROP POLICY IF EXISTS "Admins HR and managers can update operative goal definitions" ON operative_goal_definitions;
CREATE POLICY "Admins HR and managers can update operative goal definitions"
  ON operative_goal_definitions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_individual_goals: insert
DROP POLICY IF EXISTS "Users can insert operative goals if they can insert definitions" ON operative_individual_goals;
CREATE POLICY "Users can insert operative goals if they can insert definitions"
  ON operative_individual_goals FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_individual_goals: update
DROP POLICY IF EXISTS "Users can update operative goals if they can update definitions" ON operative_individual_goals;
CREATE POLICY "Users can update operative goals if they can update definitions"
  ON operative_individual_goals FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_quality_indicators: insert
DROP POLICY IF EXISTS "Users can insert quality indicators if they can insert definiti" ON operative_quality_indicators;
CREATE POLICY "Users can insert quality indicators if they can insert definiti"
  ON operative_quality_indicators FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_quality_indicators: update
DROP POLICY IF EXISTS "Users can update quality indicators if they can update definiti" ON operative_quality_indicators;
CREATE POLICY "Users can update quality indicators if they can update definiti"
  ON operative_quality_indicators FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_safety_standards: insert
DROP POLICY IF EXISTS "Users can insert safety standards if they can insert definition" ON operative_safety_standards;
CREATE POLICY "Users can insert safety standards if they can insert definition"
  ON operative_safety_standards FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- operative_safety_standards: update
DROP POLICY IF EXISTS "Users can update safety standards if they can update definition" ON operative_safety_standards;
CREATE POLICY "Users can update safety standards if they can update definition"
  ON operative_safety_standards FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id = auth.uid()
      AND system_users.role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
  ));

-- Also update the is_manager() function if it exists to include 'jefe'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_manager') THEN
    CREATE OR REPLACE FUNCTION is_manager()
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    AS $func$
      SELECT EXISTS (
        SELECT 1 FROM system_users
        WHERE user_id = auth.uid()
          AND role = ANY (ARRAY['superadmin','admin','rrhh','manager','jefe'])
          AND is_active = true
      )
    $func$;
  END IF;
END $$;
