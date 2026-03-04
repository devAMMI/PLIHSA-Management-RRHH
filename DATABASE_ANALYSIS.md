# Análisis de Base de Datos - Sistema AMMI RRHH

## Estado Actual de la Base de Datos

### 1. EMPRESAS (companies) ✅
**Estado: BIEN ESTRUCTURADA**
- 4 empresas creadas: PLIHSA, AMMI, PTM, MillFoods
- Campos: id, name, code, logo_url
- Normalización: 1FN, 2FN, 3FN ✅

```
PLIHSA   → ef0cbe1b-06be-4587-a9a3-6233c14795f5
AMMI     → a193919b-a633-480d-bfaa-0b987c9349dd
PTM      → 7ee95c9d-d7cf-4a5f-afe5-a6112b45bc41
MillFoods → f279f1b7-7142-4fba-abe7-89a81965d360
```

---

### 2. PLANTAS (plants) ⚠️
**Estado: PARCIALMENTE IMPLEMENTADA**
- 2 plantas creadas
- Relacionadas a empresas (company_id)
- **FALTA**: Clasificación de tipo de planta (Corona, Inyección)

**Estructura Actual:**
```
- id (UUID)
- company_id → companies.id
- name
- location
```

**PROBLEMA**: No hay campo para diferenciar tipo de planta (Corona vs Inyección)

---

### 3. DEPARTAMENTOS (departments) ✅
**Estado: BIEN ESTRUCTURADA**
- 28 departamentos creados
- Relacionados a empresas (company_id)
- Campos: id, company_id, name, description

---

### 4. EMPLEADOS (employees) ⚠️
**Estado: NECESITA NORMALIZACIÓN Y MEJORAS**

**Estructura Actual:**
```
✅ Datos Básicos:
- id, employee_code (único)
- first_name, last_name
- birth_date, age, gender
- national_id

✅ Relaciones:
- company_id → companies.id
- department_id → departments.id
- plant_id → plants.id
- manager_id → employees.id (supervisor directo)

✅ Clasificación:
- employee_type: 'operativo' | 'administrativo'
- position
- status: 'active' | 'inactive' | 'suspended'

✅ Contacto:
- email, phone
- address, city, state

⚠️ PROBLEMAS IDENTIFICADOS:
1. Educación no normalizada (education_level, university, degree en mismo registro)
2. Emergencia no normalizada (emergency_contact_name, emergency_contact_phone)
3. NO HAY STORAGE para documentos (CV, diplomas, certificados)
4. Datos repetitivos sin normalización
```

---

### 5. EVALUACIONES - SISTEMA ACTUAL ⚠️

#### 5.1 Periodos de Evaluación (evaluation_periods) ✅
**Estado: BIEN ESTRUCTURADA**
```
- id
- company_id → companies.id
- name
- employee_type: 'administrativo' | 'operativo'
- start_date, end_date
- definition_date, review_date
- status: 'active' | 'completed' | 'cancelled'
- form_code, form_version
```

#### 5.2 Evaluaciones Administrativas (administrative_evaluations) ⚠️
**Estado: FUNCIONAL PERO PUEDE MEJORAR**
```
✅ Relaciones:
- evaluation_period_id → evaluation_periods.id
- employee_id → employees.id
- manager_id → employees.id

⚠️ CAMPOS DUPLICADOS:
- employee_position (ya existe en employees.position)
- department (ya existe en employees.department_id)
- sub_department (no normalizado)
- hire_date (ya existe en employees.hire_date)

✅ Workflow:
- status: draft | pending_employee | pending_manager | pending_rrhh | completed
- employee_signature_date, manager_signature_date, rrhh_signature_date
- manager_comments, employee_comments
```

**Tablas Relacionadas:**
- `evaluation_individual_goals` → Metas individuales (5 máximo)
- `evaluation_competencies` → Competencias (5 máximo)
- `evaluation_goal_reviews` → Revisión de metas
- `evaluation_competency_reviews` → Revisión de competencias

#### 5.3 Evaluaciones Operativas (operative_evaluations) ⚠️
**Estado: ESTRUCTURA IGUAL A ADMINISTRATIVAS - DUPLICACIÓN**
```
⚠️ MISMO PROBLEMA:
- Campos duplicados de employees
- Misma estructura que administrative_evaluations
```

**Tablas Relacionadas:**
- `evaluation_functional_factors` → Factores funcionales (5 máximo)
- `operative_evaluation_competencies` → Competencias operativas (5 máximo)
- `evaluation_functional_reviews` → Revisión de factores
- `operative_competency_reviews` → Revisión de competencias

---

### 6. SISTEMA DE USUARIOS (system_users) ✅
**Estado: BIEN ESTRUCTURADA**
```
- id
- user_id → auth.users.id
- employee_id → employees.id
- company_id → companies.id
- role: superadmin | admin | rrhh | manager | employee | viewer
- is_active
```

---

### 7. PERMISOS (role_permissions) ✅
**Estado: BIEN ESTRUCTURADA**
- 40 permisos definidos
- Relacionados por rol

---

## PROBLEMAS PRINCIPALES IDENTIFICADOS

### ❌ 1. FALTA SISTEMA DE STORAGE
**NO EXISTE** almacenamiento para documentos de empleados:
- Foto de perfil (photo_url existe pero no hay gestión de storage)
- CV / Curriculum Vitae
- Diplomas
- Títulos universitarios
- Certificaciones
- Constancias laborales
- Documentos de identidad
- Contratos

### ❌ 2. DUPLICACIÓN DE DATOS EN EVALUACIONES
Las tablas `administrative_evaluations` y `operative_evaluations` duplican información de `employees`:
- employee_position → employees.position
- department → employees.department_id
- hire_date → employees.hire_date

**Violación de 3FN**: Datos no atómicos y dependencias transitivas

### ❌ 3. DATOS NO NORMALIZADOS EN EMPLOYEES
- `education_level`, `university`, `degree` → Deberían estar en tabla `employee_education`
- `emergency_contact_name`, `emergency_contact_phone` → Deberían estar en tabla `employee_emergency_contacts`
- `sub_department` → No existe como entidad

### ❌ 4. FALTA CLASIFICACIÓN DE PLANTAS
No hay forma de diferenciar:
- Planta Corona
- Planta Inyección

### ❌ 5. NO HAY SEGREGACIÓN POR EMPRESA EN EVALUACIONES
Las evaluaciones actuales están mezcladas. Falta:
- Vista/filtro por empresa
- Reportes por empresa
- Dashboard por empresa

### ❌ 6. FALTA TABLA DE SUBDEPARTAMENTOS
`sub_department` aparece como texto libre en evaluaciones, debería ser una tabla normalizada

---

## PROPUESTA DE NORMALIZACIÓN (1FN, 2FN, 3FN)

### 1. NUEVA TABLA: employee_documents (STORAGE)
```sql
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'cv',
    'diploma',
    'degree',
    'certification',
    'id_document',
    'contract',
    'other'
  )),
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Ruta en Supabase Storage
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);
```

### 2. NUEVA TABLA: employee_education
```sql
CREATE TABLE employee_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  education_level TEXT NOT NULL CHECK (education_level IN (
    'primaria',
    'secundaria',
    'bachillerato',
    'tecnico',
    'universitario',
    'postgrado',
    'maestria',
    'doctorado'
  )),
  institution TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. NUEVA TABLA: employee_emergency_contacts
```sql
CREATE TABLE employee_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. NUEVA TABLA: sub_departments
```sql
CREATE TABLE sub_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. AGREGAR CAMPO A plants: plant_type
```sql
ALTER TABLE plants
ADD COLUMN plant_type TEXT CHECK (plant_type IN ('corona', 'inyeccion'));
```

### 6. ELIMINAR CAMPOS REDUNDANTES DE EVALUACIONES
```sql
-- Quitar de administrative_evaluations y operative_evaluations:
ALTER TABLE administrative_evaluations
DROP COLUMN employee_position,
DROP COLUMN department,
DROP COLUMN sub_department,
DROP COLUMN hire_date;

ALTER TABLE operative_evaluations
DROP COLUMN employee_position,
DROP COLUMN department,
DROP COLUMN sub_department,
DROP COLUMN hire_date;
```

### 7. NUEVA TABLA: evaluation_attachments (opcional)
```sql
CREATE TABLE evaluation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL, -- Puede ser admin o operative
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('administrative', 'operative')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);
```

---

## RESUMEN DE NORMALIZACIÓN

### ✅ PRIMERA FORMA NORMAL (1FN)
- Todos los datos son atómicos
- No hay grupos repetitivos
- Cada columna contiene un solo valor

### ✅ SEGUNDA FORMA NORMAL (2FN)
- Cumple 1FN
- Todos los atributos no clave dependen completamente de la clave primaria
- No hay dependencias parciales

### ✅ TERCERA FORMA NORMAL (3FN)
- Cumple 2FN
- No hay dependencias transitivas
- Cada atributo no clave depende SOLO de la clave primaria

---

## SUPABASE STORAGE - BUCKETS RECOMENDADOS

```javascript
// Estructura de buckets en Supabase Storage:

1. employee-documents/
   - {company_id}/{employee_id}/cv/
   - {company_id}/{employee_id}/diplomas/
   - {company_id}/{employee_id}/certifications/
   - {company_id}/{employee_id}/contracts/
   - {company_id}/{employee_id}/ids/

2. employee-photos/
   - {company_id}/{employee_id}/profile.jpg

3. company-logos/
   - {company_id}/logo.png

4. evaluation-attachments/
   - {company_id}/{evaluation_id}/
```

---

## QUERIES PARA VISUALIZACIÓN POR EMPRESA

### Evaluaciones Administrativas por Empresa
```sql
SELECT
  ae.id,
  ae.status,
  ae.created_at,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,
  d.name as department_name,
  c.name as company_name,
  ep.name as period_name
FROM administrative_evaluations ae
JOIN employees e ON ae.employee_id = e.id
JOIN companies c ON e.company_id = c.id
LEFT JOIN departments d ON e.department_id = d.id
JOIN evaluation_periods ep ON ae.evaluation_period_id = ep.id
WHERE c.code = 'PLIHSA'
ORDER BY ae.created_at DESC;
```

### Evaluaciones Operativas por Empresa
```sql
SELECT
  oe.id,
  oe.status,
  oe.created_at,
  e.first_name || ' ' || e.last_name as employee_name,
  e.position,
  d.name as department_name,
  c.name as company_name,
  ep.name as period_name
FROM operative_evaluations oe
JOIN employees e ON oe.employee_id = e.id
JOIN companies c ON e.company_id = c.id
LEFT JOIN departments d ON e.department_id = d.id
JOIN evaluation_periods ep ON oe.evaluation_period_id = ep.id
WHERE c.code = 'PLIHSA'
ORDER BY oe.created_at DESC;
```

---

## CONCLUSIONES Y RECOMENDACIONES

### ✅ LO QUE ESTÁ BIEN
1. Estructura de empresas (companies)
2. Departamentos (departments)
3. Sistema de usuarios y permisos
4. Periodos de evaluación
5. Workflow de firmas en evaluaciones

### ⚠️ LO QUE NECESITA MEJORA
1. **CRÍTICO**: Implementar sistema de Storage para documentos
2. **CRÍTICO**: Normalizar datos de educación y contactos de emergencia
3. **IMPORTANTE**: Eliminar duplicación en tablas de evaluaciones
4. **IMPORTANTE**: Crear tabla de subdepartamentos
5. **IMPORTANTE**: Agregar tipo de planta (Corona/Inyección)
6. **RECOMENDADO**: Agregar vistas/filtros por empresa en frontend

### 📊 MÉTRICAS ACTUALES
- 4 empresas
- 28 departamentos
- 2 plantas
- 109 empleados
- 4 usuarios del sistema
- 40 permisos definidos
- 1 evaluación administrativa guardada
- 0 evaluaciones operativas

---

## PRÓXIMOS PASOS SUGERIDOS

1. ✅ Crear tablas de normalización (employee_education, employee_emergency_contacts, sub_departments)
2. ✅ Configurar Supabase Storage buckets
3. ✅ Migrar datos existentes a nuevas tablas normalizadas
4. ✅ Eliminar campos redundantes de evaluaciones
5. ✅ Crear componente de gestión de documentos
6. ✅ Implementar filtros por empresa en frontend
7. ✅ Crear dashboard de evaluaciones por empresa
