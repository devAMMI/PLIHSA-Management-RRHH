/*
# Garantizar acceso total para superadministradores

1. Objetivo
- Garantizar que un usuario con rol `superadmin` pueda consultar y administrar todos los usuarios del sistema.
- Mantener el acceso completo de superadmin a todos los empleados.

2. Tablas modificadas
- `system_users`: permisos explícitos de lectura, creación, actualización y eliminación para superadmins activos.
- `employees`: permiso explícito de lectura para superadmins activos, conservando las políticas existentes de escritura.

3. Seguridad
- Todas las políticas se limitan a usuarios autenticados.
- La autorización se valida contra `system_users.user_id = auth.uid()` y `role = 'superadmin'`.
- Se exige `is_active = true` para evitar acceso de cuentas desactivadas.
- No se eliminan datos, columnas ni tablas.

4. Notas
- Las políticas se eliminan y recrean para que la migración sea segura si se ejecuta nuevamente.
- El acceso de otros roles no se modifica.
*/

DROP POLICY IF EXISTS "Superadmins can view all system users" ON public.system_users;
CREATE POLICY "Superadmins can view all system users"
ON public.system_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.system_users AS current_user_record
    WHERE current_user_record.user_id = auth.uid()
      AND current_user_record.role = 'superadmin'
      AND current_user_record.is_active = true
  )
);

DROP POLICY IF EXISTS "Superadmins can insert system users" ON public.system_users;
CREATE POLICY "Superadmins can insert system users"
ON public.system_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.system_users AS current_user_record
    WHERE current_user_record.user_id = auth.uid()
      AND current_user_record.role = 'superadmin'
      AND current_user_record.is_active = true
  )
);

DROP POLICY IF EXISTS "Superadmins can update system users" ON public.system_users;
CREATE POLICY "Superadmins can update system users"
ON public.system_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.system_users AS current_user_record
    WHERE current_user_record.user_id = auth.uid()
      AND current_user_record.role = 'superadmin'
      AND current_user_record.is_active = true
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Superadmins can delete system users" ON public.system_users;
CREATE POLICY "Superadmins can delete system users"
ON public.system_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.system_users AS current_user_record
    WHERE current_user_record.user_id = auth.uid()
      AND current_user_record.role = 'superadmin'
      AND current_user_record.is_active = true
  )
);

DROP POLICY IF EXISTS "Superadmins can view all employees" ON public.employees;
CREATE POLICY "Superadmins can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.system_users AS current_user_record
    WHERE current_user_record.user_id = auth.uid()
      AND current_user_record.role = 'superadmin'
      AND current_user_record.is_active = true
  )
);