-- Allow RRHH role to insert, update, and delete vacation balances
-- (previously only superadmin and admin could do this)

DROP POLICY IF EXISTS "Admins delete balances" ON vacation_balances;
DROP POLICY IF EXISTS "Admins insert balances" ON vacation_balances;
DROP POLICY IF EXISTS "Admins update balances" ON vacation_balances;

CREATE POLICY "Admins and RRHH delete balances"
  ON vacation_balances FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
        AND su.is_active = true
        AND su.role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'rrhh'::text])
    )
  );

CREATE POLICY "Admins and RRHH insert balances"
  ON vacation_balances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
        AND su.is_active = true
        AND su.role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'rrhh'::text])
    )
  );

CREATE POLICY "Admins and RRHH update balances"
  ON vacation_balances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
        AND su.is_active = true
        AND su.role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'rrhh'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users su
      WHERE su.user_id = auth.uid()
        AND su.is_active = true
        AND su.role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'rrhh'::text])
    )
  );