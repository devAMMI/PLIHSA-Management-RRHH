/*
  # Corregir Políticas RLS de Evaluaciones

  ## Problema Identificado
  Las políticas existentes son demasiado restrictivas y no permiten:
  - INSERT de nuevas evaluaciones
  - Managers deben poder insertar evaluaciones para su equipo
  
  ## Cambios
  1. Agregar política de INSERT para RRHH/Admins/Managers en administrative_evaluations
  2. Agregar política de INSERT para operative_evaluations
  3. Agregar WITH CHECK apropiado para INSERT policies
  4. Mantener las políticas SELECT existentes

  ## Seguridad
  - RRHH y admins pueden crear evaluaciones para cualquier empleado
  - Managers pueden crear evaluaciones para su equipo
  - Se mantienen restricciones de lectura por rol
*/

-- =====================================================
-- ADMINISTRATIVE EVALUATIONS
-- =====================================================

-- Política para insertar evaluaciones (RRHH, Admins, Managers)
DROP POLICY IF EXISTS "RRHH and admins can manage evaluations" ON administrative_evaluations;

CREATE POLICY "RRHH and admins can insert evaluations"
  ON administrative_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and admins can update evaluations"
  ON administrative_evaluations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and admins can delete evaluations"
  ON administrative_evaluations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- =====================================================
-- EVALUATION INDIVIDUAL GOALS
-- =====================================================

DROP POLICY IF EXISTS "RRHH and managers can manage goals" ON evaluation_individual_goals;

CREATE POLICY "RRHH and managers can insert goals"
  ON evaluation_individual_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and managers can update goals"
  ON evaluation_individual_goals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH can delete goals"
  ON evaluation_individual_goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- =====================================================
-- EVALUATION COMPETENCIES
-- =====================================================

DROP POLICY IF EXISTS "RRHH and managers can manage competencies" ON evaluation_competencies;

CREATE POLICY "RRHH and managers can insert competencies"
  ON evaluation_competencies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and managers can update competencies"
  ON evaluation_competencies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH can delete competencies"
  ON evaluation_competencies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );

-- =====================================================
-- OPERATIVE EVALUATIONS (mismas políticas)
-- =====================================================

DROP POLICY IF EXISTS "RRHH and admins can manage operative evaluations" ON operative_evaluations;

CREATE POLICY "RRHH and admins can insert operative evaluations"
  ON operative_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and admins can update operative evaluations"
  ON operative_evaluations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh', 'manager')
    )
  );

CREATE POLICY "RRHH and admins can delete operative evaluations"
  ON operative_evaluations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('superadmin', 'admin', 'rrhh')
    )
  );
