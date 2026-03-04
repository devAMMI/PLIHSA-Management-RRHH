/*
  # Fix employees UPDATE and DELETE policies to include superadmin

  ## Descripción
  Actualiza las políticas de actualización y eliminación en la tabla employees
  para incluir el rol superadmin.

  ## Cambios
  - Actualiza la política "Managers can update employees" para incluir superadmin
  - Actualiza la política "HR can delete employees" para incluir superadmin
  - Mantiene las funciones is_manager() e is_hr() pero agrega políticas adicionales

  ## Seguridad
  - Superadmin tiene acceso completo a UPDATE y DELETE
  - Se mantienen las políticas existentes para otros roles
  - Todas las verificaciones requieren usuario activo
*/

-- Política UPDATE para superadmin
DROP POLICY IF EXISTS "Superadmin can update employees" ON employees;
CREATE POLICY "Superadmin can update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = 'superadmin'
        AND system_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = 'superadmin'
        AND system_users.is_active = true
    )
  );

-- Política DELETE para superadmin
DROP POLICY IF EXISTS "Superadmin can delete employees" ON employees;
CREATE POLICY "Superadmin can delete employees"
  ON employees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role = 'superadmin'
        AND system_users.is_active = true
    )
  );
