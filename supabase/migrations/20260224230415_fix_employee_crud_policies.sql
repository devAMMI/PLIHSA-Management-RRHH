/*
  # Arreglar políticas CRUD de empleados

  1. Políticas actualizadas
    - Mejorar política de INSERT para empleados
    - Agregar política de DELETE
    - Asegurar que WITH CHECK funcione correctamente
  
  2. Cambios
    - DROP de políticas existentes de INSERT y UPDATE
    - Crear nuevas políticas con WITH CHECK apropiado
    - Agregar política de DELETE

  3. Seguridad
    - Solo admin y rrhh pueden insertar/eliminar empleados
    - Admin, rrhh y managers pueden actualizar empleados
*/

-- Eliminar políticas existentes de INSERT y UPDATE
DROP POLICY IF EXISTS "HR and managers can insert employees" ON employees;
DROP POLICY IF EXISTS "HR and managers can update employees" ON employees;

-- Crear política de INSERT mejorada
CREATE POLICY "Admin and HR can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
      AND system_users.is_active = true
    )
  );

-- Crear política de UPDATE mejorada
CREATE POLICY "Admin, HR and managers can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
      AND system_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
      AND system_users.is_active = true
    )
  );

-- Crear política de DELETE
CREATE POLICY "Admin and HR can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
      AND system_users.is_active = true
    )
  );

-- Agregar políticas similares para employee_family_members
DROP POLICY IF EXISTS "Authenticated users can view family members" ON employee_family_members;

CREATE POLICY "Authenticated users can view family members"
  ON employee_family_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and HR can insert family members"
  ON employee_family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
      AND system_users.is_active = true
    )
  );

CREATE POLICY "Admin, HR and managers can update family members"
  ON employee_family_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
      AND system_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh', 'manager')
      AND system_users.is_active = true
    )
  );

CREATE POLICY "Admin and HR can delete family members"
  ON employee_family_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users
      WHERE system_users.user_id = auth.uid()
      AND system_users.role IN ('admin', 'rrhh')
      AND system_users.is_active = true
    )
  );
