/*
  # Permisos de Sidebar por Usuario

  ## Descripción
  Permite al superadmin configurar qué items del sidebar puede ver cada usuario,
  independientemente de su rol. Acceso granular a secciones específicas por usuario.

  ## Tabla: user_sidebar_permissions
  - `id` — UUID, clave primaria
  - `system_user_id` — FK a system_users
  - `menu_item_id` — identificador del item del sidebar (ej: 'reportes', 'audit-log')
  - `granted` — true = acceso otorgado, false = acceso denegado
  - `granted_by` — FK a auth.users (quién configuró el permiso)
  - `created_at`, `updated_at`
*/

CREATE TABLE IF NOT EXISTS user_sidebar_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_user_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  menu_item_id text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(system_user_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sidebar_perms_system_user_id
  ON user_sidebar_permissions(system_user_id);

ALTER TABLE user_sidebar_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and owner can read sidebar permissions"
  ON user_sidebar_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'superadmin'
    )
    OR
    EXISTS (
      SELECT 1 FROM system_users su2
      WHERE su2.id = user_sidebar_permissions.system_user_id
      AND su2.user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmin can insert sidebar permissions"
  ON user_sidebar_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmin can update sidebar permissions"
  ON user_sidebar_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmin can delete sidebar permissions"
  ON user_sidebar_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
      AND su.role = 'superadmin'
    )
  );
