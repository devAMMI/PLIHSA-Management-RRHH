# Plan de Migración - Base de Datos AMMI RRHH

## Análisis del Schema Propuesto

### ✅ MEJORAS IMPLEMENTADAS EN EL NUEVO SCHEMA

#### 1. **plants → work_locations (CAMBIO CRÍTICO)**
**Antes:**
- Tabla `plants` solo para plantas productivas
- Empleados administrativos tenían `plant_id = NULL`
- No había forma de saber dónde trabajaban los administrativos

**Ahora:**
- Tabla `work_locations` con tipos:
  - Planta Corona (`is_plant = true`)
  - Planta Inyección (`is_plant = true`)
  - Edificio Administrativo PLIHSA (`is_plant = false`)
- **TODO empleado tiene `work_location_id`** (nunca NULL)
- Catálogo `work_location_types` con campo `is_plant` para distinguir

**Para PLIHSA:**
```
1. Planta Corona          → work_location_types.code = 'planta_corona'
2. Planta Inyección       → work_location_types.code = 'planta_inyeccion'
3. Edificio Administrativo → work_location_types.code = 'edificio_admin'
```

#### 2. **IDENTIDAD HONDUREÑA - Dos Formatos Soportados**

**DNI Nuevo (formato moderno):**
- Campo: `national_id_hn`
- Formato: `0801197302222` (13 dígitos sin espacios)
- Display: `0801 1973 02222`
- Ejemplo imagen 2: María del Carmen - "0801 1973 02222"

**Tarjeta de Identidad Antigua:**
- Campo: `national_id_legacy`
- Formato: `02219550025` (11 dígitos sin guiones)
- Display: `022-1955-00255`
- Ejemplo imagen 1: Orlando Amado - "022-1955-00255"

**Validación:**
- Constraint `chk_at_least_one_id` asegura que al menos uno de los 3 IDs exista
- Índices parciales para búsqueda rápida por cédula

#### 3. **NORMALIZACIÓN 3FN - Datos Extraídos**

**De `employees` se extraen a tablas propias:**
- ✅ `employee_education` → Historial académico completo
- ✅ `employee_emergency_contacts` → Múltiples contactos de emergencia
- ✅ `employee_work_history` → Experiencia laboral previa
- ✅ `sub_departments` → Ya no es texto libre, es entidad normalizada

**De `evaluations` se eliminan campos duplicados:**
- ❌ `employee_position` → Se lee desde `employees.position`
- ❌ `department` → Se lee desde `employees.department_id`
- ❌ `hire_date` → Se lee desde `employees.hire_date`

#### 4. **SISTEMA DE STORAGE COMPLETO**

**Nuevas tablas:**
- `document_types` → Catálogo de 9 tipos de documentos
- `employee_documents` → Metadata de archivos en Supabase Storage

**Buckets requeridos:**
```
1. employee-photos       → Fotos de perfil
2. employee-documents    → CV, diplomas, certificaciones
3. company-logos         → Logos de empresas
4. evaluation-attachments → Documentos de evaluaciones
```

**Estructura de rutas:**
```
employee-documents/{company_id}/{employee_id}/{document_type}/{filename}
employee-photos/{company_id}/{employee_id}/profile.jpg
```

#### 5. **CATÁLOGOS NUEVOS**

Todas las tablas de catálogo usan `SMALLINT` con `GENERATED ALWAYS AS IDENTITY`:
- ✅ `work_location_types` (5 tipos)
- ✅ `employee_types` (administrativo, operativo)
- ✅ `education_levels` (8 niveles con sort_order)
- ✅ `genders` (4 opciones)
- ✅ `employee_statuses` (4 estados)
- ✅ `document_types` (9 tipos)
- ✅ `system_roles` (6 roles)

#### 6. **EVALUACIONES - NOMBRES CLARIFICADOS**

**Evaluaciones Administrativas:**
- `administrative_evaluations` (antes duplicaba datos)
- `admin_eval_goals` (5 metas máximo)
- `admin_eval_goal_reviews` (revisiones de metas)
- `admin_eval_competencies` (5 competencias)
- `admin_eval_competency_reviews`

**Evaluaciones Operativas:**
- `operative_evaluations`
- `operative_eval_factors` (5 factores funcionales)
- `operative_eval_factor_reviews`
- `operative_eval_competencies` (5 competencias)
- `operative_eval_competency_reviews`

**Mejoras:**
- Cada componente tiene campo `weight_pct` (peso porcentual)
- `final_score` calculado en la evaluación principal
- Sin duplicación de datos del empleado

#### 7. **VISTAS ÚTILES**

3 vistas creadas para simplificar queries:
- `v_employees_full` → Empleado con todos sus datos relacionados
- `v_admin_evaluations` → Evaluaciones admin con contexto completo
- `v_operative_evaluations` → Evaluaciones operativas con contexto

#### 8. **30+ ÍNDICES DE PERFORMANCE**

Índices en:
- Employees (8 índices incluyendo cédulas)
- Departments, sub_departments (3 índices)
- Work locations (2 índices)
- Evaluation periods (3 índices)
- Administrative evaluations (4 índices)
- Operative evaluations (4 índices)
- Documents (3 índices)
- System users (3 índices)

---

## COMPARACIÓN: BASE DE DATOS ACTUAL vs PROPUESTA

### TABLA: employees

| Campo Actual | Campo Propuesto | Cambio |
|--------------|----------------|---------|
| `plant_id` | `work_location_id` | ✅ Renombrado, ahora nunca NULL |
| `national_id` | `national_id_hn` + `national_id_legacy` | ✅ 2 formatos separados |
| - | `passport_id` | ✅ Nuevo para extranjeros |
| `education_level` | → `employee_education.education_level_id` | ✅ Normalizado |
| `university` | → `employee_education.institution` | ✅ Normalizado |
| `degree` | → `employee_education.degree` | ✅ Normalizado |
| `emergency_contact_name` | → `employee_emergency_contacts.contact_name` | ✅ Normalizado |
| `emergency_contact_phone` | → `employee_emergency_contacts.phone` | ✅ Normalizado |
| `gender` (text) | `gender_id` → catálogo | ✅ Normalizado |
| `status` (text) | `status_id` → catálogo | ✅ Normalizado |
| `employee_type` (text) | `employee_type_id` → catálogo | ✅ Normalizado |
| - | `sub_department_id` | ✅ Nuevo |
| `age` | ❌ Eliminado | ✅ Se calcula desde birth_date |

### TABLAS NUEVAS

| Tabla | Propósito | Registros Esperados |
|-------|-----------|-------------------|
| `work_location_types` | Catálogo tipos de ubicación | 5 |
| `work_locations` | Ubicaciones físicas | ~10-15 |
| `sub_departments` | Sub-departamentos normalizados | ~50 |
| `education_levels` | Catálogo niveles educativos | 8 |
| `genders` | Catálogo géneros | 4 |
| `employee_statuses` | Catálogo estados empleado | 4 |
| `employee_education` | Historial académico | 100-300 |
| `employee_emergency_contacts` | Contactos emergencia | 100-200 |
| `employee_work_history` | Experiencia previa | 0-500 |
| `document_types` | Catálogo tipos documento | 9 |
| `employee_documents` | Metadata documentos | 0-1000 |
| `system_roles` | Roles del sistema | 6 |

### TABLAS A RENOMBRAR/MODIFICAR

| Actual | Propuesta | Acción |
|--------|-----------|--------|
| `plants` | `work_locations` | RENOMBRAR + agregar type |
| `evaluation_individual_goals` | `admin_eval_goals` | RENOMBRAR + agregar weight_pct |
| `evaluation_competencies` | `admin_eval_competencies` | RENOMBRAR + agregar weight_pct |
| `evaluation_functional_factors` | `operative_eval_factors` | RENOMBRAR + agregar weight_pct |

---

## PLAN DE MIGRACIÓN - PASO A PASO

### FASE 1: PREPARACIÓN (Sin afectar datos existentes)

**Paso 1.1:** Crear catálogos nuevos
```sql
- work_location_types
- education_levels
- genders
- employee_statuses
- document_types
- system_roles
```

**Paso 1.2:** Crear tablas de ubicaciones
```sql
- work_locations (con datos de PLIHSA)
```

**Paso 1.3:** Crear tabla sub_departments
```sql
- sub_departments
```

### FASE 2: MIGRACIÓN DE DATOS (Con cuidado)

**Paso 2.1:** Migrar `plants` → `work_locations`
- Copiar datos existentes
- Crear "Edificio Administrativo PLIHSA"
- Actualizar `employees.plant_id` → `employees.work_location_id`

**Paso 2.2:** Migrar identificaciones
- Analizar formato de `employees.national_id`
- Dividir en `national_id_hn` o `national_id_legacy`
- Limpiar formato (quitar espacios/guiones)

**Paso 2.3:** Normalizar campos de texto a catálogos
- `employees.gender` → `employees.gender_id`
- `employees.status` → `employees.status_id`
- `employees.employee_type` → `employees.employee_type_id`

**Paso 2.4:** Extraer datos educativos
- Migrar `education_level`, `university`, `degree` → `employee_education`

**Paso 2.5:** Extraer contactos de emergencia
- Migrar `emergency_contact_name`, `emergency_contact_phone` → `employee_emergency_contacts`

### FASE 3: NUEVAS TABLAS DE EVALUACIONES

**Paso 3.1:** Renombrar tablas de evaluaciones
- `evaluation_individual_goals` → `admin_eval_goals`
- `evaluation_competencies` → `admin_eval_competencies`
- `evaluation_functional_factors` → `operative_eval_factors`

**Paso 3.2:** Agregar campos nuevos
- `weight_pct` a todas las tablas de componentes
- `final_score` a evaluaciones principales

**Paso 3.3:** Eliminar campos duplicados
- Quitar `employee_position`, `department`, `hire_date` de evaluaciones

### FASE 4: STORAGE Y DOCUMENTOS

**Paso 4.1:** Crear buckets en Supabase Storage
```
- employee-photos
- employee-documents
- company-logos
- evaluation-attachments
```

**Paso 4.2:** Configurar políticas RLS en Storage

**Paso 4.3:** Migrar URLs de fotos existentes
- Copiar fotos desde `employees.photo_url` al bucket
- Crear registros en `employee_documents`

### FASE 5: ÍNDICES Y VISTAS

**Paso 5.1:** Crear 30+ índices de performance

**Paso 5.2:** Crear 3 vistas útiles

### FASE 6: LIMPIEZA

**Paso 6.1:** Eliminar columnas obsoletas de `employees`
```sql
- education_level
- university
- degree
- emergency_contact_name
- emergency_contact_phone
- age (calculado)
```

**Paso 6.2:** Verificar integridad referencial

**Paso 6.3:** Probar queries y aplicación

---

## RIESGOS Y CONSIDERACIONES

### ⚠️ RIESGOS ALTOS
1. **Cambio de `plant_id` → `work_location_id`**
   - El código del frontend debe actualizarse
   - Todas las queries que usan `plant_id` deben cambiar

2. **División de `national_id`**
   - Hay que analizar el formato actual de las 109 cédulas
   - Posibles datos inconsistentes

3. **Normalización de catálogos**
   - Textos libres → IDs de catálogo
   - Posibles valores no esperados

### ⚠️ RIESGOS MEDIOS
4. **Extracción de educación y contactos**
   - Datos pueden estar NULL
   - Formato inconsistente

5. **Renombrado de tablas de evaluaciones**
   - Queries existentes deben actualizarse
   - Foreign keys deben recrearse

### ✅ RIESGOS BAJOS
6. **Creación de nuevas tablas** (sin afectar existentes)
7. **Índices** (solo performance)
8. **Vistas** (no afectan datos)

---

## ESTRATEGIA RECOMENDADA

### OPCIÓN A: MIGRACIÓN COMPLETA (Recomendada para nuevo inicio)
- Crear schema desde cero con el archivo SQL
- Migrar datos manualmente
- Actualizar aplicación completa
- **Ventaja:** Base de datos perfectamente normalizada
- **Desventaja:** Trabajo extenso

### OPCIÓN B: MIGRACIÓN INCREMENTAL (Recomendada para producción)
- Crear tablas nuevas sin afectar existentes
- Mantener compatibilidad con código actual
- Migrar por fases
- Actualizar frontend gradualmente
- **Ventaja:** Sin interrupción de servicio
- **Desventaja:** Mantener dos sistemas temporalmente

### OPCIÓN C: HÍBRIDA (Recomendada para este proyecto)
- Crear catálogos y tablas normalizadas nuevas
- Mantener `employees` actual pero agregar campos nuevos
- Usar vistas para compatibilidad
- Migrar evaluaciones a nuevo formato
- **Ventaja:** Balance entre modernización y seguridad
- **Desventaja:** Esquema temporal dual

---

## SIGUIENTE PASO SUGERIDO

**Recomiendo OPCIÓN C: HÍBRIDA**

1. Crear nueva migración con:
   - Catálogos nuevos
   - work_locations + work_location_types
   - Mantener estructura actual de employees
   - Agregar campos nuevos opcionales

2. Después analizar datos existentes para ver:
   - Formatos de cédulas actuales
   - Valores de gender, status actuales
   - Datos de educación existentes

3. Crear script de migración de datos incremental

¿Quieres que proceda con la OPCIÓN C y cree la primera migración?
