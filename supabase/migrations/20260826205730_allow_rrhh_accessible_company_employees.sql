/* Permite a RRHH consultar empleados de su empresa principal y empresas autorizadas */

DROP POLICY IF EXISTS "Admin and HR can view company employees" ON employees;

CREATE POLICY "Admin and HR can view assigned company employees" ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM system_users su
      WHERE su.user_id = auth.uid()
        AND su.role = ANY (ARRAY['admin'::text, 'rrhh'::text])
        AND su.is_active = true
        AND (
          su.company_id = employees.company_id
          OR employees.company_id = ANY(COALESCE(su.accessible_company_ids, ARRAY[]::uuid[]))
        )
    )
  );