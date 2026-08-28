/*
# Retirar políticas redundantes de usuarios del sistema

1. Objetivo
- Retirar las políticas superpuestas creadas para `system_users`.
- Conservar la política existente `Select own or admin sees all`, que usa la función segura `is_admin()` y ya reconoce el rol `superadmin`.

2. Tablas modificadas
- `system_users`: se eliminan únicamente cuatro políticas redundantes de superadmin.
- No se eliminan columnas, tablas ni registros.

3. Seguridad
- Se evita una subconsulta recursiva contra `system_users` dentro de sus propias políticas.
- La política existente de acceso de administradores permanece vigente.
- La política existente de superadmin para consultar empleados permanece vigente.

4. Notas
- Esta migración no cambia los permisos de ningún rol.
*/

DROP POLICY IF EXISTS "Superadmins can view all system users" ON public.system_users;
DROP POLICY IF EXISTS "Superadmins can insert system users" ON public.system_users;
DROP POLICY IF EXISTS "Superadmins can update system users" ON public.system_users;
DROP POLICY IF EXISTS "Superadmins can delete system users" ON public.system_users;