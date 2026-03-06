/*
  # Create Operative Goal Definition Tables

  ## Overview
  Creates tables for managing operative employee goal definitions, focusing on operational
  objectives, safety standards, and quality indicators for non-administrative personnel.

  ## New Tables
  
  1. `operative_goal_definitions`
     - Main table for operative goal definition records
     - Links to employees and tracks evaluation periods
     - Fields: employee_id, evaluation_period, definition_date, work_area, manager_comments, employee_comments, status
     - Tracks creation and update timestamps
     - Status: draft, submitted, approved

  2. `operative_individual_goals`
     - Stores individual operational goals and production targets
     - Links to goal definitions
     - Fields: goal_number, goal_description, measurement_and_expected_results
     - Each goal has clear measurement criteria

  3. `operative_safety_standards`
     - Records safety standards and procedure compliance requirements
     - Links to goal definitions
     - Fields: standard_number, standard_description
     - Focuses on safety protocols and operational procedures

  4. `operative_quality_indicators`
     - Stores quality and efficiency indicators
     - Links to goal definitions
     - Fields: indicator_number, indicator_description, target_value
     - Defines measurable quality targets

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for authenticated users based on roles
  - Managers can access their team members' goal definitions
  - HR and admins have full access

  ## Important Notes
  - All tables use UUID primary keys with automatic generation
  - Foreign key constraints ensure data integrity
  - Timestamps track when records are created and modified
  - Status field allows workflow management (draft → submitted → approved)
*/

-- Create operative_goal_definitions table
CREATE TABLE IF NOT EXISTS operative_goal_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluation_period text NOT NULL DEFAULT '',
  definition_date date NOT NULL DEFAULT CURRENT_DATE,
  work_area text DEFAULT '',
  manager_comments text DEFAULT '',
  employee_comments text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create operative_individual_goals table
CREATE TABLE IF NOT EXISTS operative_individual_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_definition_id uuid NOT NULL REFERENCES operative_goal_definitions(id) ON DELETE CASCADE,
  goal_number integer NOT NULL,
  goal_description text NOT NULL DEFAULT '',
  measurement_and_expected_results text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create operative_safety_standards table
CREATE TABLE IF NOT EXISTS operative_safety_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_definition_id uuid NOT NULL REFERENCES operative_goal_definitions(id) ON DELETE CASCADE,
  standard_number integer NOT NULL,
  standard_description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create operative_quality_indicators table
CREATE TABLE IF NOT EXISTS operative_quality_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_definition_id uuid NOT NULL REFERENCES operative_goal_definitions(id) ON DELETE CASCADE,
  indicator_number integer NOT NULL,
  indicator_description text NOT NULL DEFAULT '',
  target_value text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE operative_goal_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operative_individual_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE operative_safety_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE operative_quality_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operative_goal_definitions
CREATE POLICY "Superadmins can view all operative goal definitions"
  ON operative_goal_definitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role = 'superadmin'
    )
  );

CREATE POLICY "Admins and HR can view all operative goal definitions"
  ON operative_goal_definitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
    )
  );

CREATE POLICY "Managers can view their team operative goal definitions"
  ON operative_goal_definitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      INNER JOIN system_users su ON su.employee_id = e.manager_id
      WHERE e.id = operative_goal_definitions.employee_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view their own operative goal definitions"
  ON operative_goal_definitions FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM system_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert operative goal definitions"
  ON operative_goal_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role = 'superadmin'
    )
  );

CREATE POLICY "Admins, HR, and Managers can insert operative goal definitions"
  ON operative_goal_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Superadmins can update operative goal definitions"
  ON operative_goal_definitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role = 'superadmin'
    )
  );

CREATE POLICY "Admins, HR, and Managers can update operative goal definitions"
  ON operative_goal_definitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Superadmins can delete operative goal definitions"
  ON operative_goal_definitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role = 'superadmin'
    )
  );

CREATE POLICY "Admins can delete operative goal definitions"
  ON operative_goal_definitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
    )
  );

-- RLS Policies for operative_individual_goals
CREATE POLICY "Users can view operative goals if they can view the definition"
  ON operative_individual_goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operative_goal_definitions ogd
      WHERE ogd.id = operative_individual_goals.goal_definition_id
    )
  );

CREATE POLICY "Users can insert operative goals if they can insert definitions"
  ON operative_individual_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Users can update operative goals if they can update definitions"
  ON operative_individual_goals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Users can delete operative goals if they can delete definitions"
  ON operative_individual_goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- RLS Policies for operative_safety_standards
CREATE POLICY "Users can view safety standards if they can view the definition"
  ON operative_safety_standards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operative_goal_definitions ogd
      WHERE ogd.id = operative_safety_standards.goal_definition_id
    )
  );

CREATE POLICY "Users can insert safety standards if they can insert definitions"
  ON operative_safety_standards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Users can update safety standards if they can update definitions"
  ON operative_safety_standards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Users can delete safety standards if they can delete definitions"
  ON operative_safety_standards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- RLS Policies for operative_quality_indicators
CREATE POLICY "Users can view quality indicators if they can view the definition"
  ON operative_quality_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operative_goal_definitions ogd
      WHERE ogd.id = operative_quality_indicators.goal_definition_id
    )
  );

CREATE POLICY "Users can insert quality indicators if they can insert definitions"
  ON operative_quality_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Users can update quality indicators if they can update definitions"
  ON operative_quality_indicators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "Users can delete quality indicators if they can delete definitions"
  ON operative_quality_indicators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_operative_goal_definitions_employee_id ON operative_goal_definitions(employee_id);
CREATE INDEX IF NOT EXISTS idx_operative_goal_definitions_status ON operative_goal_definitions(status);
CREATE INDEX IF NOT EXISTS idx_operative_individual_goals_definition_id ON operative_individual_goals(goal_definition_id);
CREATE INDEX IF NOT EXISTS idx_operative_safety_standards_definition_id ON operative_safety_standards(goal_definition_id);
CREATE INDEX IF NOT EXISTS idx_operative_quality_indicators_definition_id ON operative_quality_indicators(goal_definition_id);
