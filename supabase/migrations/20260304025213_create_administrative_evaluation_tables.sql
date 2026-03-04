/*
  # Sistema de Evaluación Administrativa - PLIHSA

  ## Nuevas Tablas

  ### 1. evaluation_periods
  - Períodos de evaluación (Enero-Febrero 2025, etc.)
  - Campos: nombre, fecha inicio, fecha fin, estado, tipo empleado
  
  ### 2. administrative_evaluations
  - Evaluaciones individuales por empleado
  - Relación con employees, evaluation_periods
  - Campos de encabezado del formulario
  - Estados: draft, pending_employee, pending_manager, pending_rrhh, completed
  
  ### 3. evaluation_individual_goals
  - Metas individuales definidas (5 por evaluación)
  - Medición y resultados esperados
  
  ### 4. evaluation_competencies
  - Competencias conductuales/habilidades (5 por evaluación)
  
  ### 5. evaluation_goal_reviews
  - Revisión de metas con calificaciones
  - Opciones: Debajo de Expectativas, Desempeño a Mejorar, Cumple Expectativas, Supera Expectativas
  
  ### 6. evaluation_competency_reviews
  - Revisión de competencias con calificaciones

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas restrictivas por rol
*/

-- Tabla de períodos de evaluación
CREATE TABLE IF NOT EXISTS evaluation_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_type text NOT NULL CHECK (employee_type IN ('administrativo', 'operativo')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  definition_date date,
  review_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  form_code text NOT NULL,
  form_version text DEFAULT '01',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evaluation_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evaluation periods"
  ON evaluation_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and RRHH can manage evaluation periods"
  ON evaluation_periods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla principal de evaluaciones administrativas
CREATE TABLE IF NOT EXISTS administrative_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_period_id uuid NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_position text,
  department text,
  sub_department text,
  hire_date date,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  definition_date date,
  review_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_employee', 'pending_manager', 'pending_rrhh', 'completed')),
  manager_comments text,
  employee_comments text,
  employee_signature_date timestamptz,
  manager_signature_date timestamptz,
  rrhh_signature_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_period_id, employee_id)
);

ALTER TABLE administrative_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own evaluations"
  ON administrative_evaluations FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM system_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view their team evaluations"
  ON administrative_evaluations FOR SELECT
  TO authenticated
  USING (
    manager_id IN (
      SELECT employee_id FROM system_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "RRHH and admins can view all evaluations"
  ON administrative_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

CREATE POLICY "RRHH and admins can manage evaluations"
  ON administrative_evaluations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla de metas individuales (definición)
CREATE TABLE IF NOT EXISTS evaluation_individual_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES administrative_evaluations(id) ON DELETE CASCADE,
  goal_number int NOT NULL CHECK (goal_number BETWEEN 1 AND 5),
  goal_description text,
  measurement_and_expected_results text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, goal_number)
);

ALTER TABLE evaluation_individual_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals from evaluations they can access"
  ON evaluation_individual_goals FOR SELECT
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM administrative_evaluations
      WHERE employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage goals"
  ON evaluation_individual_goals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla de competencias conductuales/habilidades (definición)
CREATE TABLE IF NOT EXISTS evaluation_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES administrative_evaluations(id) ON DELETE CASCADE,
  competency_number int NOT NULL CHECK (competency_number BETWEEN 1 AND 5),
  competency_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, competency_number)
);

ALTER TABLE evaluation_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competencies from evaluations they can access"
  ON evaluation_competencies FOR SELECT
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM administrative_evaluations
      WHERE employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage competencies"
  ON evaluation_competencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla de revisión de metas individuales
CREATE TABLE IF NOT EXISTS evaluation_goal_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES evaluation_individual_goals(id) ON DELETE CASCADE,
  results_description text,
  rating text CHECK (rating IN ('below_expectations', 'needs_improvement', 'meets_expectations', 'exceeds_expectations')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(goal_id)
);

ALTER TABLE evaluation_goal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goal reviews from evaluations they can access"
  ON evaluation_goal_reviews FOR SELECT
  TO authenticated
  USING (
    goal_id IN (
      SELECT eig.id FROM evaluation_individual_goals eig
      JOIN administrative_evaluations ae ON eig.evaluation_id = ae.id
      WHERE ae.employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR ae.manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage goal reviews"
  ON evaluation_goal_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

-- Tabla de revisión de competencias
CREATE TABLE IF NOT EXISTS evaluation_competency_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid NOT NULL REFERENCES evaluation_competencies(id) ON DELETE CASCADE,
  results_description text,
  rating text CHECK (rating IN ('below_expectations', 'needs_improvement', 'meets_expectations', 'exceeds_expectations')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(competency_id)
);

ALTER TABLE evaluation_competency_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competency reviews from evaluations they can access"
  ON evaluation_competency_reviews FOR SELECT
  TO authenticated
  USING (
    competency_id IN (
      SELECT ec.id FROM evaluation_competencies ec
      JOIN administrative_evaluations ae ON ec.evaluation_id = ae.id
      WHERE ae.employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR ae.manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage competency reviews"
  ON evaluation_competency_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

-- Insertar el período de evaluación Enero-Febrero 2025
INSERT INTO evaluation_periods (
  name,
  company_id,
  employee_type,
  start_date,
  end_date,
  form_code,
  form_version,
  status
) VALUES (
  'Evaluación Administrativo - Enero 2025',
  (SELECT id FROM companies WHERE name = 'PLIHSA' LIMIT 1),
  'administrativo',
  '2025-01-01',
  '2025-02-28',
  'PL-RH-P-002-F01',
  '01',
  'active'
)
ON CONFLICT DO NOTHING;