# Instrucciones para Crear Usuarios Administrativos

El sistema ahora cuenta con una sección de **Usuarios** donde puedes crear los usuarios solicitados.

## Acceso al Módulo de Usuarios

1. Inicia sesión como administrador
2. En el menú lateral, haz clic en **"Usuarios"** (icono de escudo)
3. Haz clic en el botón **"Nuevo Usuario"**

## Usuarios a Crear

### Usuario 1: Karla Sagastume
- **Email:** `karla.sagastume@plihsa.com`
- **Contraseña:** `Temporal2026`
- **Empresa:** PLIHSA
- **Rol:** Administrador
- **Estado:** Activo

### Usuario 2: Andrea Fuentes
- **Email:** `Andrea.fuentes@plihsa.com`
- **Contraseña:** `Temporal2026`
- **Empresa:** PLIHSA
- **Rol:** Administrador
- **Estado:** Activo

### Usuario 3: Dev AMMI
- **Email:** `dev@ammi.com`
- **Contraseña:** `Temporal2026`
- **Empresa:** AMMI
- **Rol:** Administrador
- **Estado:** Activo

## Pasos para Crear Cada Usuario

1. Completa el formulario con los datos de cada usuario:
   - Email (obligatorio)
   - Contraseña (mínimo 6 caracteres)
   - Selecciona la empresa correspondiente
   - Puedes vincular con un empleado existente (opcional)
   - Selecciona el rol: **Administrador**
   - Marca la casilla "Usuario activo"

2. Haz clic en **"Crear Usuario"**

3. El sistema creará automáticamente:
   - El usuario en Supabase Auth
   - El registro en la tabla system_users
   - La vinculación con la empresa

## Notas Importantes

- Los usuarios creados podrán iniciar sesión inmediatamente
- Como administradores, tendrán acceso completo al sistema
- Pueden cambiar su contraseña desde la sección "Mi Perfil"
- Si vinculas un empleado existente, heredará su foto y datos personales
