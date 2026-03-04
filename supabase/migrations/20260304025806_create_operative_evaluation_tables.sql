/*
  # Sistema de Evaluación Operativa - PLIHSA

  ## Nuevas Tablas

  ### 1. operative_evaluations
  - Evaluaciones para empleados operativos
  - Similar a administrative_evaluations pero para operativos
  - Relación con employees, evaluation_periods
  
  ### 2. evaluation_functional_factors
  - Factores funcionales (Funciones del Puesto) - 5 por evaluación
  - Funciones del puesto y resultados esperados
  
  ### 3. evaluation_functional_reviews
  - Revisión de factores funcionales con calificaciones
  - Resultados a la fecha de revisión

  ## Nota
  - Reutilizamos evaluation_competencies y evaluation_competency_reviews
  - Solo cambiamos el tipo de evaluación

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas restrictivas por rol
*/

-- Tabla principal de evaluaciones operativas
CREATE TABLE IF NOT EXISTS operative_evaluations (
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

ALTER TABLE operative_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own operative evaluations"
  ON operative_evaluations FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM system_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view their team operative evaluations"
  ON operative_evaluations FOR SELECT
  TO authenticated
  USING (
    manager_id IN (
      SELECT employee_id FROM system_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "RRHH and admins can view all operative evaluations"
  ON operative_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

CREATE POLICY "RRHH and admins can manage operative evaluations"
  ON operative_evaluations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla de factores funcionales (definición)
CREATE TABLE IF NOT EXISTS evaluation_functional_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES operative_evaluations(id) ON DELETE CASCADE,
  factor_number int NOT NULL CHECK (factor_number BETWEEN 1 AND 5),
  job_function text,
  expected_results text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, factor_number)
);

ALTER TABLE evaluation_functional_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view functional factors from evaluations they can access"
  ON evaluation_functional_factors FOR SELECT
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM operative_evaluations
      WHERE employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage functional factors"
  ON evaluation_functional_factors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla de revisión de factores funcionales
CREATE TABLE IF NOT EXISTS evaluation_functional_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_id uuid NOT NULL REFERENCES evaluation_functional_factors(id) ON DELETE CASCADE,
  results_description text,
  rating text CHECK (rating IN ('below_expectations', 'needs_improvement', 'meets_expectations', 'exceeds_expectations')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(factor_id)
);

ALTER TABLE evaluation_functional_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view functional reviews from evaluations they can access"
  ON evaluation_functional_reviews FOR SELECT
  TO authenticated
  USING (
    factor_id IN (
      SELECT eff.id FROM evaluation_functional_factors eff
      JOIN operative_evaluations oe ON eff.evaluation_id = oe.id
      WHERE oe.employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR oe.manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage functional reviews"
  ON evaluation_functional_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

-- Tabla para competencias operativas (reutilizamos la misma estructura)
CREATE TABLE IF NOT EXISTS operative_evaluation_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES operative_evaluations(id) ON DELETE CASCADE,
  competency_number int NOT NULL CHECK (competency_number BETWEEN 1 AND 5),
  competency_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, competency_number)
);

ALTER TABLE operative_evaluation_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operative competencies from evaluations they can access"
  ON operative_evaluation_competencies FOR SELECT
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM operative_evaluations
      WHERE employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage operative competencies"
  ON operative_evaluation_competencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- Tabla de revisión de competencias operativas
CREATE TABLE IF NOT EXISTS operative_competency_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid NOT NULL REFERENCES operative_evaluation_competencies(id) ON DELETE CASCADE,
  results_description text,
  rating text CHECK (rating IN ('below_expectations', 'needs_improvement', 'meets_expectations', 'exceeds_expectations')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(competency_id)
);

ALTER TABLE operative_competency_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operative competency reviews from evaluations they can access"
  ON operative_competency_reviews FOR SELECT
  TO authenticated
  USING (
    competency_id IN (
      SELECT oec.id FROM operative_evaluation_competencies oec
      JOIN operative_evaluations oe ON oec.evaluation_id = oe.id
      WHERE oe.employee_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR oe.manager_id IN (SELECT employee_id FROM system_users WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM system_users
        WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
      )
    )
  );

CREATE POLICY "RRHH and managers can manage operative competency reviews"
  ON operative_competency_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

-- Insertar el período de evaluación Enero-Febrero 2025 para operativos
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
  'Evaluación Operativo - Enero 2025',
  (SELECT id FROM companies WHERE name = 'PLIHSA' LIMIT 1),
  'operativo',
  '2025-01-01',
  '2025-02-28',
  'PL-RH-P-002-F04',
  '01',
  'active'
)
ON CONFLICT DO NOTHING;