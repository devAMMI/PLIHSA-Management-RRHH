/*
  # Fix employees INSERT policy to include superadmin

  ## Descripción
  Actualiza la política de inserción en la tabla employees para incluir
  el rol superadmin además de admin y rrhh.

  ## Cambios
  - Elimina la política actual "Admin and HR can insert employees"
  - Crea una nueva política que incluye superadmin, admin y rrhh

  ## Seguridad
  - Solo usuarios autenticados con rol 'superadmin', 'admin' o 'rrhh' pueden insertar
  - La verificación se hace contra la tabla system_users
  - El usuario debe estar activo (is_active = true)
*/

-- Eliminar la política anterior
DROP POLICY IF EXISTS "Admin and HR can insert employees" ON employees;

-- Crear nueva política de INSERT que incluye superadmin
CREATE POLICY "Superadmin, Admin and HR can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('superadmin', 'admin', 'rrhh')
        AND system_users.is_active = true
    )
  );
