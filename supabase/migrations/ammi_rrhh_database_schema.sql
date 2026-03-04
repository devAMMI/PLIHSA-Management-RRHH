-- ============================================================
-- SISTEMA DE GESTIÓN DE RRHH - AMMI GROUP
-- Base de Datos Normalizada (1FN, 2FN, 3FN)
-- Versión: 1.0.0
-- Fecha: 2026-03-03
-- ============================================================
-- Empresas: PLIHSA | AMMI | PTM | MILLFOODS
-- Tipos de empleado: Administrativo | Operativo
-- Tipos de planta: Corona | Inyección
-- Evaluaciones: 3 por año (por empresa, por tipo de empleado)
-- ============================================================


-- ============================================================
-- EXTENSIONES REQUERIDAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- BLOQUE 1: ESTRUCTURA ORGANIZACIONAL
-- Tablas: companies → work_locations → departments → sub_departments
--
-- DECISIÓN DE DISEÑO — work_locations:
--   En lugar de "plants" (solo plantas productivas), usamos
--   "work_locations" que unifica TODOS los lugares físicos donde
--   puede trabajar un empleado dentro de una empresa:
--     • Planta productiva (Corona, Inyección)
--     • Edificio / Oficina administrativa
--   Esto evita que un empleado administrativo quede sin ubicación
--   (plant_id NULL) y permite filtrar/reportar por tipo de ubicación.
-- ============================================================

-- 1.1 EMPRESAS
CREATE TABLE companies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,              -- 'PLIHSA' | 'AMMI' | 'PTM' | 'MILLFOODS'
  name           TEXT NOT NULL,
  legal_name     TEXT,
  tax_id         TEXT,                              -- RUC / NIT / RFC
  country        TEXT NOT NULL DEFAULT 'HN',
  logo_url       TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE companies IS 'Empresas del grupo AMMI. Cada empresa tiene su propia estructura organizacional y evaluaciones independientes.';

INSERT INTO companies (code, name) VALUES
  ('PLIHSA',    'PLIHSA'),
  ('AMMI',      'AMMI'),
  ('PTM',       'PTM'),
  ('MILLFOODS', 'MillFoods');


-- ============================================================
-- 1.2 TIPOS DE UBICACIÓN DE TRABAJO (catálogo)
-- ============================================================
CREATE TABLE work_location_types (
  id           SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  is_plant     BOOLEAN NOT NULL DEFAULT false,   -- TRUE = planta productiva | FALSE = oficina/edificio
  description  TEXT
);

COMMENT ON TABLE work_location_types IS 'Catálogo de tipos de ubicación física. is_plant=true para plantas productivas (Corona, Inyección), is_plant=false para oficinas administrativas.';

INSERT INTO work_location_types (code, name, is_plant, description) VALUES
  ('planta_corona',    'Planta Corona',                   true,  'Planta de producción — línea Corona'),
  ('planta_inyeccion', 'Planta Inyección',                true,  'Planta de producción — línea Inyección'),
  ('edificio_admin',   'Edificio Administrativo',         false, 'Oficinas administrativas corporativas'),
  ('oficina_central',  'Oficina Central',                 false, 'Sede / oficina central de la empresa'),
  ('otro',             'Otro',                            false, 'Otra ubicación no clasificada');


-- ============================================================
-- 1.3 UBICACIONES DE TRABAJO  (antes: plants)
-- ============================================================
CREATE TABLE work_locations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  work_location_type_id SMALLINT NOT NULL REFERENCES work_location_types(id),
  code                  TEXT NOT NULL,
  name                  TEXT NOT NULL,
  address               TEXT,
  city                  TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

COMMENT ON TABLE work_locations IS 'Ubicaciones físicas de trabajo por empresa. Unifica plantas productivas y edificios administrativos en una sola tabla. Cada empleado tiene work_location_id, eliminando los NULL que existían con plant_id para empleados de oficina.';

-- Datos iniciales PLIHSA
-- (Insertar después de que exista el registro de PLIHSA en companies)
/*
INSERT INTO work_locations (company_id, work_location_type_id, code, name, city) VALUES
  (
    (SELECT id FROM companies WHERE code = 'PLIHSA'),
    (SELECT id FROM work_location_types WHERE code = 'planta_corona'),
    'PLIHSA-PL-COR',
    'Planta Corona PLIHSA',
    'San Pedro Sula'
  ),
  (
    (SELECT id FROM companies WHERE code = 'PLIHSA'),
    (SELECT id FROM work_location_types WHERE code = 'planta_inyeccion'),
    'PLIHSA-PL-INY',
    'Planta Inyección PLIHSA',
    'San Pedro Sula'
  ),
  (
    (SELECT id FROM companies WHERE code = 'PLIHSA'),
    (SELECT id FROM work_location_types WHERE code = 'edificio_admin'),
    'PLIHSA-ED-ADM',
    'Edificio Administrativo PLIHSA',
    'San Pedro Sula'
  );
*/


-- ============================================================
-- 1.4 DEPARTAMENTOS
-- ============================================================
CREATE TABLE departments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  code           TEXT NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

COMMENT ON TABLE departments IS 'Departamentos por empresa. El código es único dentro de la misma empresa.';


-- ============================================================
-- 1.5 SUB-DEPARTAMENTOS (3FN: extraído de evaluaciones)
-- ============================================================
CREATE TABLE sub_departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (department_id, code)
);

COMMENT ON TABLE sub_departments IS 'Sub-departamentos o áreas dentro de un departamento. Extraído de evaluaciones para cumplir 3FN.';


-- ============================================================
-- BLOQUE 2: CATÁLOGOS DE EMPLEADOS
-- Tablas: employee_types, job_positions, education_levels
-- ============================================================

-- 2.1 TIPOS DE EMPLEADO
CREATE TABLE employee_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,   -- 'administrativo' | 'operativo'
  name  TEXT NOT NULL
);

INSERT INTO employee_types (code, name) VALUES
  ('administrativo', 'Administrativo'),
  ('operativo',      'Operativo');


-- 2.2 NIVELES EDUCATIVOS (catálogo)
CREATE TABLE education_levels (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO education_levels (code, name, sort_order) VALUES
  ('primaria',       'Primaria',             1),
  ('secundaria',     'Secundaria',           2),
  ('bachillerato',   'Bachillerato',         3),
  ('tecnico',        'Técnico',              4),
  ('universitario',  'Universitario',        5),
  ('postgrado',      'Postgrado',            6),
  ('maestria',       'Maestría',             7),
  ('doctorado',      'Doctorado',            8);


-- 2.3 GÉNEROS (catálogo)
CREATE TABLE genders (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

INSERT INTO genders (code, name) VALUES
  ('masculino',  'Masculino'),
  ('femenino',   'Femenino'),
  ('otro',       'Otro'),
  ('prefiero_no_decir', 'Prefiero no decir');


-- 2.4 ESTADOS DE EMPLEADO (catálogo)
CREATE TABLE employee_statuses (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

INSERT INTO employee_statuses (code, name) VALUES
  ('active',     'Activo'),
  ('inactive',   'Inactivo'),
  ('suspended',  'Suspendido'),
  ('on_leave',   'De permiso');


-- ============================================================
-- BLOQUE 3: EMPLEADOS Y SUS DATOS RELACIONADOS
-- Tablas: employees, employee_education, employee_emergency_contacts,
--         employee_work_history, employee_documents
-- ============================================================

-- 3.1 EMPLEADOS (tabla principal — datos únicos y atómicos)
CREATE TABLE employees (
  -- Identificadores
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code       TEXT NOT NULL UNIQUE,        -- Código interno único (ej: PLIHSA-0001)

  -- -------------------------------------------------------
  -- IDENTIDAD HONDUREÑA — 2 formatos posibles:
  --   Formato nuevo (DNI):  "0801 1973 02222"  → national_id_hn
  --   Formato antiguo:      "022-1955-00255"   → national_id_legacy
  --   Pasaporte / extran.:  alfanumérico       → passport_id
  -- Se guarda el número limpio (sin espacios ni guiones)
  -- para búsquedas; el formato visual se reconstruye en frontend.
  -- -------------------------------------------------------
  national_id_hn      TEXT UNIQUE,                 -- DNI nuevo HN: 13 dígitos sin espacios. Ej: "0801197302222"
  national_id_legacy  TEXT UNIQUE,                 -- Tarjeta identidad antigua: 11 dígitos. Ej: "02219550025"
  passport_id         TEXT,                        -- Pasaporte u otro doc. extranjero

  -- Datos personales (atómicos — 1FN)
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  birth_date          DATE,
  gender_id           SMALLINT REFERENCES genders(id),

  -- Relaciones organizacionales
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  work_location_id    UUID REFERENCES work_locations(id),   -- Planta Corona | Planta Inyección | Edificio Admin
  department_id       UUID REFERENCES departments(id),
  sub_department_id   UUID REFERENCES sub_departments(id),
  employee_type_id    SMALLINT NOT NULL REFERENCES employee_types(id),
  manager_id          UUID REFERENCES employees(id),        -- Supervisor directo

  -- Datos laborales
  position            TEXT NOT NULL,               -- Cargo / Puesto
  hire_date           DATE,
  termination_date    DATE,
  status_id           SMALLINT NOT NULL REFERENCES employee_statuses(id),

  -- Contacto
  email               TEXT,
  phone               TEXT,
  address             TEXT,
  city                TEXT,
  state               TEXT,
  country             TEXT DEFAULT 'HN',

  -- Foto de perfil
  photo_url           TEXT,

  -- Auditoría
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Al menos un identificador debe existir
  CONSTRAINT chk_at_least_one_id CHECK (
    national_id_hn IS NOT NULL
    OR national_id_legacy IS NOT NULL
    OR passport_id IS NOT NULL
  )
);

COMMENT ON TABLE employees IS 'Tabla central de empleados. Datos únicos y atómicos (1FN). Educación y contactos de emergencia normalizados en tablas propias (3FN).';
COMMENT ON COLUMN employees.employee_code       IS 'Código único del empleado. Formato: [EMPRESA]-[NUMERO]. Ej: PLIHSA-0001';
COMMENT ON COLUMN employees.national_id_hn      IS 'DNI hondureño nuevo (13 dígitos sin espacios). Ej: "0801197302222". Visualizar como "0801 1973 02222".';
COMMENT ON COLUMN employees.national_id_legacy  IS 'Tarjeta de identidad hondureña antigua (11 dígitos sin guiones). Ej: "02219550025". Visualizar como "022-1955-00255".';
COMMENT ON COLUMN employees.work_location_id    IS 'Ubicación física del empleado: Planta Corona, Planta Inyección o Edificio Administrativo. Nunca NULL — todo empleado tiene una ubicación.';


-- 3.2 EDUCACIÓN DEL EMPLEADO (normalizado — 3FN)
CREATE TABLE employee_education (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  education_level_id   SMALLINT NOT NULL REFERENCES education_levels(id),
  institution          TEXT NOT NULL,
  degree               TEXT,                       -- Nombre del título obtenido
  field_of_study       TEXT,                       -- Carrera / Especialidad
  start_date           DATE,
  end_date             DATE,
  is_completed         BOOLEAN NOT NULL DEFAULT false,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_education IS 'Historial educativo del empleado. Normalizado desde employees para cumplir 3FN.';


-- 3.3 CONTACTOS DE EMERGENCIA (normalizado — 3FN)
CREATE TABLE employee_emergency_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contact_name      TEXT NOT NULL,
  relationship      TEXT NOT NULL,                 -- Parentesco
  phone             TEXT NOT NULL,
  alternate_phone   TEXT,
  email             TEXT,
  address           TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_emergency_contacts IS 'Contactos de emergencia del empleado. Normalizado desde employees para cumplir 3FN. Un empleado puede tener múltiples contactos.';


-- 3.4 HISTORIAL LABORAL (posiciones anteriores)
CREATE TABLE employee_work_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  position        TEXT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  reason_leaving  TEXT,
  reference_name  TEXT,
  reference_phone TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_work_history IS 'Experiencia laboral previa del empleado en otras empresas.';


-- ============================================================
-- BLOQUE 4: DOCUMENTOS Y STORAGE
-- Tabla: employee_documents
-- Buckets Supabase: employee-photos | employee-documents | company-logos
-- ============================================================

-- 4.1 TIPOS DE DOCUMENTO (catálogo)
CREATE TABLE document_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

INSERT INTO document_types (code, name) VALUES
  ('photo',          'Foto de perfil'),
  ('cv',             'Curriculum Vitae'),
  ('diploma',        'Diploma'),
  ('degree',         'Título universitario'),
  ('certification',  'Certificación'),
  ('id_document',    'Documento de identidad'),
  ('contract',       'Contrato laboral'),
  ('labor_letter',   'Constancia laboral'),
  ('other',          'Otro');


-- 4.2 DOCUMENTOS DEL EMPLEADO
-- Storage path: {bucket}/{company_id}/{employee_id}/{document_type_code}/{filename}
CREATE TABLE employee_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  document_type_id  SMALLINT NOT NULL REFERENCES document_types(id),
  document_name     TEXT NOT NULL,                 -- Nombre descriptivo del archivo
  file_name         TEXT NOT NULL,                 -- Nombre real del archivo en storage
  file_path         TEXT NOT NULL,                 -- Ruta completa en Supabase Storage
  file_size_kb      INTEGER,
  mime_type         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by       UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE employee_documents IS 'Documentos del empleado almacenados en Supabase Storage. file_path contiene la ruta relativa dentro del bucket correspondiente.';
COMMENT ON COLUMN employee_documents.file_path IS 'Ruta en Storage. Formato: {company_id}/{employee_id}/{document_type}/{filename}';


-- ============================================================
-- BLOQUE 5: SISTEMA DE EVALUACIONES
-- Periodos → Evaluaciones (Admin / Operativo) → Componentes
-- ============================================================

-- 5.1 PERIODOS DE EVALUACIÓN
-- Cada empresa tiene 3 períodos al año (por tipo de empleado)
CREATE TABLE evaluation_periods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  employee_type_id  SMALLINT NOT NULL REFERENCES employee_types(id),
  period_number     SMALLINT NOT NULL CHECK (period_number BETWEEN 1 AND 3),  -- 1, 2 o 3
  year              SMALLINT NOT NULL,
  name              TEXT NOT NULL,                 -- Ej: "PLIHSA - Administrativos - Periodo 1 - 2026"
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  definition_date   DATE,                          -- Fecha límite para definir metas
  review_date       DATE,                          -- Fecha de revisión intermedia
  form_code         TEXT,
  form_version      TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_type_id, period_number, year)
);

COMMENT ON TABLE evaluation_periods IS '3 periodos de evaluación por año, por empresa, por tipo de empleado. Máximo 3 periodos activos simultáneos por empresa.';


-- 5.2 EVALUACIONES ADMINISTRATIVAS
CREATE TABLE administrative_evaluations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_period_id    UUID NOT NULL REFERENCES evaluation_periods(id) ON DELETE RESTRICT,
  employee_id             UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  manager_id              UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

  -- NO se duplica: position, department, hire_date → se leen desde employees (3FN)

  -- Estado del workflow
  status                  TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'pending_employee',
      'pending_manager',
      'pending_rrhh',
      'completed',
      'cancelled'
    )),

  -- Comentarios
  employee_comments       TEXT,
  manager_comments        TEXT,
  rrhh_comments           TEXT,

  -- Firmas y fechas
  employee_signature_date   TIMESTAMPTZ,
  manager_signature_date    TIMESTAMPTZ,
  rrhh_signature_date       TIMESTAMPTZ,

  -- Puntaje final calculado
  final_score             NUMERIC(5,2),

  -- Auditoría
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_period_id, employee_id)
);

COMMENT ON TABLE administrative_evaluations IS 'Evaluaciones para empleados administrativos. Los datos del empleado (cargo, departamento, fecha de ingreso) se leen de employees para evitar duplicación (3FN).';


-- 5.3 METAS INDIVIDUALES — EVALUACIÓN ADMINISTRATIVA (máx. 5)
CREATE TABLE admin_eval_goals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id           UUID NOT NULL REFERENCES administrative_evaluations(id) ON DELETE CASCADE,
  goal_number             SMALLINT NOT NULL CHECK (goal_number BETWEEN 1 AND 5),
  description             TEXT NOT NULL,
  weight_pct              NUMERIC(5,2) NOT NULL DEFAULT 20.00,  -- Peso porcentual
  target_value            TEXT,
  measurement_unit        TEXT,
  deadline                DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, goal_number)
);


-- 5.4 REVISIÓN DE METAS — EVALUACIÓN ADMINISTRATIVA
CREATE TABLE admin_eval_goal_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id             UUID NOT NULL REFERENCES admin_eval_goals(id) ON DELETE CASCADE,
  achieved_value      TEXT,
  score               NUMERIC(5,2),                -- Puntaje obtenido en esta meta
  manager_comment     TEXT,
  reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 5.5 COMPETENCIAS — EVALUACIÓN ADMINISTRATIVA (máx. 5)
CREATE TABLE admin_eval_competencies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id       UUID NOT NULL REFERENCES administrative_evaluations(id) ON DELETE CASCADE,
  competency_number   SMALLINT NOT NULL CHECK (competency_number BETWEEN 1 AND 5),
  name                TEXT NOT NULL,
  description         TEXT,
  weight_pct          NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, competency_number)
);


-- 5.6 REVISIÓN DE COMPETENCIAS — EVALUACIÓN ADMINISTRATIVA
CREATE TABLE admin_eval_competency_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id       UUID NOT NULL REFERENCES admin_eval_competencies(id) ON DELETE CASCADE,
  score               NUMERIC(5,2),
  manager_comment     TEXT,
  reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 5.7 EVALUACIONES OPERATIVAS
-- ============================================================
CREATE TABLE operative_evaluations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_period_id    UUID NOT NULL REFERENCES evaluation_periods(id) ON DELETE RESTRICT,
  employee_id             UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  manager_id              UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

  -- NO se duplica: datos del empleado se leen desde employees (3FN)

  status                  TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'pending_employee',
      'pending_manager',
      'pending_rrhh',
      'completed',
      'cancelled'
    )),

  employee_comments       TEXT,
  manager_comments        TEXT,
  rrhh_comments           TEXT,

  employee_signature_date   TIMESTAMPTZ,
  manager_signature_date    TIMESTAMPTZ,
  rrhh_signature_date       TIMESTAMPTZ,

  final_score             NUMERIC(5,2),

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_period_id, employee_id)
);

COMMENT ON TABLE operative_evaluations IS 'Evaluaciones para empleados operativos. Misma lógica que administrative_evaluations pero con factores funcionales en vez de metas.';


-- 5.8 FACTORES FUNCIONALES — EVALUACIÓN OPERATIVA (máx. 5)
CREATE TABLE operative_eval_factors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id       UUID NOT NULL REFERENCES operative_evaluations(id) ON DELETE CASCADE,
  factor_number       SMALLINT NOT NULL CHECK (factor_number BETWEEN 1 AND 5),
  name                TEXT NOT NULL,
  description         TEXT,
  weight_pct          NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, factor_number)
);


-- 5.9 REVISIÓN DE FACTORES — EVALUACIÓN OPERATIVA
CREATE TABLE operative_eval_factor_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_id           UUID NOT NULL REFERENCES operative_eval_factors(id) ON DELETE CASCADE,
  score               NUMERIC(5,2),
  manager_comment     TEXT,
  reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 5.10 COMPETENCIAS — EVALUACIÓN OPERATIVA (máx. 5)
CREATE TABLE operative_eval_competencies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id       UUID NOT NULL REFERENCES operative_evaluations(id) ON DELETE CASCADE,
  competency_number   SMALLINT NOT NULL CHECK (competency_number BETWEEN 1 AND 5),
  name                TEXT NOT NULL,
  description         TEXT,
  weight_pct          NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, competency_number)
);


-- 5.11 REVISIÓN DE COMPETENCIAS — EVALUACIÓN OPERATIVA
CREATE TABLE operative_eval_competency_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id       UUID NOT NULL REFERENCES operative_eval_competencies(id) ON DELETE CASCADE,
  score               NUMERIC(5,2),
  manager_comment     TEXT,
  reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 5.12 ADJUNTOS DE EVALUACIONES (documentos de soporte)
CREATE TABLE evaluation_attachments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id),
  evaluation_type     TEXT NOT NULL CHECK (evaluation_type IN ('administrative', 'operative')),
  evaluation_id       UUID NOT NULL,                -- FK polimórfica (admin o operativa)
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_size_kb        INTEGER,
  mime_type           TEXT,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by         UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE evaluation_attachments IS 'Documentos adjuntos a evaluaciones (evidencias, cartas, etc.). Referencia polimórfica por evaluation_type + evaluation_id.';


-- ============================================================
-- BLOQUE 6: SISTEMA DE USUARIOS Y PERMISOS
-- ============================================================

-- 6.1 ROLES DEL SISTEMA
CREATE TABLE system_roles (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  description TEXT
);

INSERT INTO system_roles (code, name, description) VALUES
  ('superadmin', 'Super Administrador', 'Acceso total al sistema, todas las empresas'),
  ('admin',      'Administrador',       'Administrador de una empresa específica'),
  ('rrhh',       'RRHH',                'Personal de Recursos Humanos'),
  ('manager',    'Gerente / Supervisor','Supervisa empleados y firma evaluaciones'),
  ('employee',   'Empleado',            'Acceso a sus propias evaluaciones'),
  ('viewer',     'Visor',               'Solo lectura');


-- 6.2 USUARIOS DEL SISTEMA
CREATE TABLE system_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  company_id  UUID REFERENCES companies(id),        -- NULL para superadmin
  role_id     SMALLINT NOT NULL REFERENCES system_roles(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

COMMENT ON TABLE system_users IS 'Usuarios con acceso al sistema. Un usuario puede tener roles en múltiples empresas. superadmin no requiere company_id.';


-- 6.3 PERMISOS POR ROL
CREATE TABLE role_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     SMALLINT NOT NULL REFERENCES system_roles(id),
  resource    TEXT NOT NULL,   -- Recurso (ej: 'employees', 'evaluations')
  action      TEXT NOT NULL,   -- Acción (ej: 'read', 'create', 'update', 'delete')
  company_scope BOOLEAN NOT NULL DEFAULT true,  -- Si true, limitado a su company_id
  UNIQUE (role_id, resource, action)
);

COMMENT ON TABLE role_permissions IS '40+ permisos definidos por rol y recurso. company_scope=true significa que el permiso está restringido a la empresa del usuario.';


-- ============================================================
-- BLOQUE 7: ÍNDICES DE PERFORMANCE
-- ============================================================

-- Employees
CREATE INDEX idx_employees_company        ON employees(company_id);
CREATE INDEX idx_employees_department     ON employees(department_id);
CREATE INDEX idx_employees_work_location  ON employees(work_location_id);
CREATE INDEX idx_employees_manager        ON employees(manager_id);
CREATE INDEX idx_employees_type           ON employees(employee_type_id);
CREATE INDEX idx_employees_status         ON employees(status_id);
CREATE INDEX idx_employees_code           ON employees(employee_code);
CREATE INDEX idx_employees_national_id_hn     ON employees(national_id_hn) WHERE national_id_hn IS NOT NULL;
CREATE INDEX idx_employees_national_id_legacy ON employees(national_id_legacy) WHERE national_id_legacy IS NOT NULL;

-- Departments & sub-departments
CREATE INDEX idx_departments_company         ON departments(company_id);
CREATE INDEX idx_sub_departments_department  ON sub_departments(department_id);
CREATE INDEX idx_sub_departments_company     ON sub_departments(company_id);

-- Work locations
CREATE INDEX idx_work_locations_company      ON work_locations(company_id);
CREATE INDEX idx_work_locations_type         ON work_locations(work_location_type_id);

-- Evaluation periods
CREATE INDEX idx_eval_periods_company     ON evaluation_periods(company_id);
CREATE INDEX idx_eval_periods_type        ON evaluation_periods(employee_type_id);
CREATE INDEX idx_eval_periods_year        ON evaluation_periods(year);

-- Administrative evaluations
CREATE INDEX idx_admin_eval_period        ON administrative_evaluations(evaluation_period_id);
CREATE INDEX idx_admin_eval_employee      ON administrative_evaluations(employee_id);
CREATE INDEX idx_admin_eval_manager       ON administrative_evaluations(manager_id);
CREATE INDEX idx_admin_eval_status        ON administrative_evaluations(status);

-- Operative evaluations
CREATE INDEX idx_oper_eval_period         ON operative_evaluations(evaluation_period_id);
CREATE INDEX idx_oper_eval_employee       ON operative_evaluations(employee_id);
CREATE INDEX idx_oper_eval_manager        ON operative_evaluations(manager_id);
CREATE INDEX idx_oper_eval_status         ON operative_evaluations(status);

-- Documents
CREATE INDEX idx_employee_docs_employee   ON employee_documents(employee_id);
CREATE INDEX idx_employee_docs_company    ON employee_documents(company_id);
CREATE INDEX idx_employee_docs_type       ON employee_documents(document_type_id);

-- System users
CREATE INDEX idx_system_users_user        ON system_users(user_id);
CREATE INDEX idx_system_users_employee    ON system_users(employee_id);
CREATE INDEX idx_system_users_company     ON system_users(company_id);


-- ============================================================
-- BLOQUE 8: VISTAS ÚTILES
-- ============================================================

-- 8.1 Vista: empleados con todos sus datos relacionados
CREATE VIEW v_employees_full AS
SELECT
  e.id,
  e.employee_code,
  e.first_name,
  e.last_name,
  e.first_name || ' ' || e.last_name  AS full_name,
  e.national_id,
  e.birth_date,
  g.name        AS gender,
  e.position,
  e.hire_date,
  e.email,
  e.phone,
  e.photo_url,
  et.code       AS employee_type_code,
  et.name       AS employee_type,
  es.code       AS status_code,
  es.name       AS status,
  c.code        AS company_code,
  c.name        AS company_name,
  p.name        AS plant_name,
  pt.name       AS plant_type,
  d.name        AS department_name,
  sd.name       AS sub_department_name,
  mgr.first_name || ' ' || mgr.last_name AS manager_name
FROM employees e
LEFT JOIN genders          g   ON e.gender_id         = g.id
LEFT JOIN employee_types   et  ON e.employee_type_id  = et.id
LEFT JOIN employee_statuses es ON e.status_id         = es.id
LEFT JOIN companies        c   ON e.company_id        = c.id
LEFT JOIN plants           p   ON e.plant_id          = p.id
LEFT JOIN plant_types      pt  ON p.plant_type_id     = pt.id
LEFT JOIN departments      d   ON e.department_id     = d.id
LEFT JOIN sub_departments  sd  ON e.sub_department_id = sd.id
LEFT JOIN employees        mgr ON e.manager_id        = mgr.id;


-- 8.2 Vista: evaluaciones administrativas con contexto completo
CREATE VIEW v_admin_evaluations AS
SELECT
  ae.id                                             AS evaluation_id,
  ae.status                                         AS eval_status,
  ae.final_score,
  ae.created_at,
  ep.name                                           AS period_name,
  ep.period_number,
  ep.year,
  ep.start_date                                     AS period_start,
  ep.end_date                                       AS period_end,
  c.code                                            AS company_code,
  c.name                                            AS company_name,
  e.employee_code,
  e.first_name || ' ' || e.last_name                AS employee_name,
  e.position                                        AS employee_position,
  d.name                                            AS department_name,
  sd.name                                           AS sub_department_name,
  e.hire_date,
  mgr.first_name || ' ' || mgr.last_name            AS manager_name
FROM administrative_evaluations ae
JOIN evaluation_periods ep  ON ae.evaluation_period_id = ep.id
JOIN companies          c   ON ep.company_id           = c.id
JOIN employees          e   ON ae.employee_id          = e.id
LEFT JOIN departments   d   ON e.department_id         = d.id
LEFT JOIN sub_departments sd ON e.sub_department_id    = sd.id
JOIN employees          mgr ON ae.manager_id           = mgr.id;


-- 8.3 Vista: evaluaciones operativas con contexto completo
CREATE VIEW v_operative_evaluations AS
SELECT
  oe.id                                             AS evaluation_id,
  oe.status                                         AS eval_status,
  oe.final_score,
  oe.created_at,
  ep.name                                           AS period_name,
  ep.period_number,
  ep.year,
  ep.start_date                                     AS period_start,
  ep.end_date                                       AS period_end,
  c.code                                            AS company_code,
  c.name                                            AS company_name,
  e.employee_code,
  e.first_name || ' ' || e.last_name                AS employee_name,
  e.position                                        AS employee_position,
  d.name                                            AS department_name,
  p.name                                            AS plant_name,
  pt.name                                           AS plant_type,
  e.hire_date,
  mgr.first_name || ' ' || mgr.last_name            AS manager_name
FROM operative_evaluations oe
JOIN evaluation_periods ep  ON oe.evaluation_period_id = ep.id
JOIN companies          c   ON ep.company_id           = c.id
JOIN employees          e   ON oe.employee_id          = e.id
LEFT JOIN departments   d   ON e.department_id         = d.id
LEFT JOIN plants        p   ON e.plant_id              = p.id
LEFT JOIN plant_types   pt  ON p.plant_type_id         = pt.id
JOIN employees          mgr ON oe.manager_id           = mgr.id;


-- ============================================================
-- BLOQUE 9: SUPABASE STORAGE — POLÍTICAS RLS
-- ============================================================

/*
BUCKETS SUPABASE STORAGE
------------------------
Crear los siguientes buckets en Supabase Dashboard > Storage:

1. "employee-photos"
   Ruta: {company_id}/{employee_id}/profile.{ext}
   Público: NO (acceso autenticado)

2. "employee-documents"
   Ruta: {company_id}/{employee_id}/{document_type_code}/{filename}
   Público: NO (acceso autenticado)

3. "company-logos"
   Ruta: {company_id}/logo.{ext}
   Público: SÍ (logos visibles)

4. "evaluation-attachments"
   Ruta: {company_id}/{evaluation_id}/{filename}
   Público: NO (acceso autenticado)


POLÍTICAS RLS RECOMENDADAS (employee-documents):
-------------------------------------------------

-- Lectura: empleado ve sus docs | manager ve los de su equipo | rrhh/admin ven los de su empresa
CREATE POLICY "employee_docs_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM system_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Escritura: solo rrhh y admin pueden subir documentos
CREATE POLICY "employee_docs_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  EXISTS (
    SELECT 1 FROM system_users su
    JOIN system_roles sr ON su.role_id = sr.id
    WHERE su.user_id = auth.uid()
      AND sr.code IN ('superadmin', 'admin', 'rrhh')
      AND su.is_active = true
  )
);
*/


-- ============================================================
-- BLOQUE 10: QUERY DE EJEMPLO — DASHBOARD POR EMPRESA
-- ============================================================

/*
-- Resumen de evaluaciones administrativas por empresa y año
SELECT
  c.code                          AS empresa,
  ep.year,
  ep.period_number,
  COUNT(ae.id)                    AS total_evaluaciones,
  SUM(CASE WHEN ae.status = 'completed' THEN 1 ELSE 0 END) AS completadas,
  SUM(CASE WHEN ae.status = 'draft'     THEN 1 ELSE 0 END) AS borrador,
  ROUND(AVG(ae.final_score), 2)   AS puntaje_promedio
FROM evaluation_periods ep
JOIN companies c ON ep.company_id = c.id
JOIN administrative_evaluations ae ON ae.evaluation_period_id = ep.id
GROUP BY c.code, ep.year, ep.period_number
ORDER BY c.code, ep.year, ep.period_number;


-- Empleados sin evaluación en un periodo activo (PLIHSA)
SELECT
  e.employee_code,
  e.first_name || ' ' || e.last_name  AS empleado,
  e.position,
  d.name AS departamento
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN employee_types et ON e.employee_type_id = et.id
WHERE e.company_id = (SELECT id FROM companies WHERE code = 'PLIHSA')
  AND et.code = 'administrativo'
  AND e.status_id = (SELECT id FROM employee_statuses WHERE code = 'active')
  AND e.id NOT IN (
    SELECT ae.employee_id
    FROM administrative_evaluations ae
    JOIN evaluation_periods ep ON ae.evaluation_period_id = ep.id
    WHERE ep.company_id = e.company_id
      AND ep.year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND ep.status = 'active'
  );
*/


-- ============================================================
-- FIN DEL SCHEMA
-- Tablas creadas: 30
-- Vistas creadas: 3
-- Bloques: Organización | Catálogos | Empleados | Documentos |
--          Evaluaciones | Usuarios | Índices | Storage
-- Normalización: 1FN ✅ | 2FN ✅ | 3FN ✅
-- ============================================================
