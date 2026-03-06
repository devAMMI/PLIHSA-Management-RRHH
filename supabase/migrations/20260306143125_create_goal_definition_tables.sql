/*
  # Create Goal Definition Tables for Q1 2026 (Enero-Marzo)

  1. New Tables
    - `goal_definitions`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `evaluation_period` (text) - "Q1-2026"
      - `definition_date` (date) - Fecha de definición de factores
      - `employee_comments` (text) - Comentarios del colaborador
      - `manager_comments` (text) - Comentarios del jefe inmediato
      - `employee_signature` (text) - Firma del colaborador
      - `manager_signature` (text) - Firma del jefe inmediato
      - `status` (text) - draft, submitted, approved
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

    - `individual_goals`
      - `id` (uuid, primary key)
      - `goal_definition_id` (uuid, references goal_definitions)
      - `goal_number` (integer) - 1 to 5
      - `goal_description` (text) - Descripción de la meta
      - `measurement_and_expected_results` (text) - Medición y resultados esperados
      - `created_at` (timestamptz)

    - `competency_behaviors`
      - `id` (uuid, primary key)
      - `goal_definition_id` (uuid, references goal_definitions)
      - `behavior_number` (integer) - 1 to 5
      - `behavior_description` (text) - Descripción de la conducta/habilidad
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users with proper role checking
*/

-- Create goal_definitions table
CREATE TABLE IF NOT EXISTS goal_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluation_period text NOT NULL DEFAULT 'Q1-2026',
  definition_date date NOT NULL DEFAULT CURRENT_DATE,
  employee_comments text DEFAULT '',
  manager_comments text DEFAULT '',
  employee_signature text DEFAULT '',
  manager_signature text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE goal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goal definitions"
  ON goal_definitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager', 'evaluator')
    )
  );

CREATE POLICY "RRHH and managers can insert goal definitions"
  ON goal_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and managers can update goal definitions"
  ON goal_definitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and superadmin can delete goal definitions"
  ON goal_definitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh')
    )
  );

-- Create individual_goals table
CREATE TABLE IF NOT EXISTS individual_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_definition_id uuid NOT NULL REFERENCES goal_definitions(id) ON DELETE CASCADE,
  goal_number integer NOT NULL CHECK (goal_number BETWEEN 1 AND 5),
  goal_description text DEFAULT '',
  measurement_and_expected_results text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE individual_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view individual goals"
  ON individual_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goal_definitions gd
      INNER JOIN system_users su ON su.user_id = auth.uid()
      WHERE gd.id = individual_goals.goal_definition_id
      AND su.role IN ('superadmin', 'rrhh', 'manager', 'evaluator')
    )
  );

CREATE POLICY "RRHH and managers can manage individual goals"
  ON individual_goals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  );

-- Create competency_behaviors table
CREATE TABLE IF NOT EXISTS competency_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_definition_id uuid NOT NULL REFERENCES goal_definitions(id) ON DELETE CASCADE,
  behavior_number integer NOT NULL CHECK (behavior_number BETWEEN 1 AND 5),
  behavior_description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competency_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competency behaviors"
  ON competency_behaviors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goal_definitions gd
      INNER JOIN system_users su ON su.user_id = auth.uid()
      WHERE gd.id = competency_behaviors.goal_definition_id
      AND su.role IN ('superadmin', 'rrhh', 'manager', 'evaluator')
    )
  );

CREATE POLICY "RRHH and managers can manage competency behaviors"
  ON competency_behaviors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'rrhh', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goal_definitions_employee_id ON goal_definitions(employee_id);
CREATE INDEX IF NOT EXISTS idx_goal_definitions_period ON goal_definitions(evaluation_period);
CREATE INDEX IF NOT EXISTS idx_goal_definitions_status ON goal_definitions(status);
CREATE INDEX IF NOT EXISTS idx_individual_goals_definition_id ON individual_goals(goal_definition_id);
CREATE INDEX IF NOT EXISTS idx_competency_behaviors_definition_id ON competency_behaviors(goal_definition_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_goal_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goal_definitions_updated_at
  BEFORE UPDATE ON goal_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_definitions_updated_at();
