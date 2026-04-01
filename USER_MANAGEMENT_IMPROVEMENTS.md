# Mejoras al Sistema de Gestión de Usuarios

## Resumen de Cambios

Se ha mejorado significativamente el formulario de gestión de usuarios (CRUD) con las siguientes funcionalidades:

## 1. Jerarquía de Roles

Se implementó un sistema completo de jerarquía que respeta los niveles de autoridad:

**Niveles de Jerarquía (de mayor a menor):**
- Superadmin (nivel 6) - Control total del sistema
- Admin (nivel 5) - Administrador de empresa
- RRHH (nivel 4) - Recursos Humanos
- Manager (nivel 3) - Gerente
- Employee (nivel 2) - Empleado
- Viewer (nivel 1) - Visitante

**Reglas de Jerarquía:**
- Los usuarios solo pueden ver usuarios de nivel inferior o igual al suyo
- Solo pueden editar, eliminar o cambiar contraseñas de usuarios de nivel inferior
- Solo pueden crear usuarios con roles de nivel inferior
- Ejemplo: Karla (Admin) NO puede ver ni gestionar a Kenneth (Superadmin)

## 2. Acceso Multi-Empresa

Se agregó la capacidad de que un usuario tenga acceso a múltiples empresas:

**Campos Agregados:**
- **Empresa Principal**: La empresa a la que pertenece el usuario
- **Empresas Adicionales Accesibles**: Lista de checkboxes para seleccionar empresas adicionales:
  - PLIHSA
  - PTM
  - AMMI
  - Millfoods

**Funcionalidad:**
- Los usuarios pueden ver y gestionar empleados de todas las empresas a las que tienen acceso
- Los Superadmins tienen acceso automático a todas las empresas
- Se implementó la función `user_has_company_access()` en la base de datos para verificar permisos

## 3. Vinculación con Empleados

**Mejoras en la Vinculación:**
- Cuando se selecciona un empleado, su email se autocompleta en el formulario
- El nombre y apellido del empleado se muestran en la lista de usuarios
- Ayuda a identificar usuarios rápidamente con su información personal

## 4. Estructura del Formulario Mejorada

**Campos del Formulario (en orden):**
1. **Email*** (solo creación)
2. **Contraseña*** (solo creación, mínimo 6 caracteres)
3. **Empresa Principal*** (requerido)
4. **Empresas Adicionales Accesibles** (checkboxes múltiples)
5. **Empleado** (opcional, vincula con empleado existente)
6. **Rol*** (solo muestra roles de nivel inferior al usuario actual)
7. **Usuario activo** (checkbox)

## 5. Campos de la Base de Datos

**Nueva Columna Agregada:**
```sql
accessible_company_ids uuid[] DEFAULT NULL
```

**Función de Helper Creada:**
```sql
user_has_company_access(p_user_id uuid, p_company_id uuid)
```

## Uso del Sistema

### Para Crear un Usuario:

1. Hacer clic en "Nuevo Usuario"
2. Completar email y contraseña
3. Seleccionar la empresa principal
4. (Opcional) Seleccionar empresas adicionales a las que tendrá acceso
5. (Opcional) Vincular con un empleado existente
6. Seleccionar el rol (solo se muestran roles que puedes asignar)
7. Guardar

### Ejemplo de Configuración:

**Usuario: Karla (Admin de PLIHSA)**
- Empresa Principal: PLIHSA
- Empresas Adicionales: PTM, AMMI
- Resultado: Karla puede ver y gestionar empleados de PLIHSA, PTM y AMMI, pero NO de Millfoods

**Usuario: Kenneth (Superadmin)**
- Empresa Principal: PLIHSA
- Empresas Adicionales: (ninguna necesaria)
- Resultado: Como Superadmin, tiene acceso automático a todas las empresas

## Seguridad

- Las políticas RLS verifican el acceso a empresas
- La jerarquía de roles se valida tanto en frontend como backend
- Los usuarios no pueden elevar su propio nivel de permisos
- Todas las operaciones se registran con timestamps

## Beneficios

1. **Control Granular**: Define exactamente qué empresas puede ver cada usuario
2. **Jerarquía Clara**: Protege usuarios de nivel superior (como Kenneth)
3. **Flexibilidad**: Un usuario de RRHH puede gestionar empleados de múltiples empresas
4. **Trazabilidad**: Saber quién tiene acceso a qué información
5. **Seguridad**: Cumple con principio de mínimo privilegio
