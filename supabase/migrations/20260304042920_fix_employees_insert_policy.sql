/*
  # Fix employees INSERT policy

  ## Descripción
  Corrige la política de inserción en la tabla employees para permitir
  que usuarios con rol admin o rrhh puedan crear nuevos empleados.

  ## Cambios
  - Elimina la política restrictiva actual "HR can insert employees"
  - Crea una nueva política más permisiva que permite INSERT para admin/rrhh
  - La política verifica el rol del usuario desde system_users

  ## Seguridad
  - Solo usuarios autenticados con rol 'admin' o 'rrhh' pueden insertar
  - La verificación se hace contra la tabla system_users
  - El usuario debe estar activo (is_active = true)
*/

-- Eliminar la política anterior
DROP POLICY IF EXISTS "HR can insert employees" ON employees;

-- Crear nueva política de INSERT más clara
CREATE POLICY "Admin and HR can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM system_users
      WHERE system_users.user_id = auth.uid()
        AND system_users.role IN ('admin', 'rrhh')
        AND system_users.is_active = true
    )
  );
