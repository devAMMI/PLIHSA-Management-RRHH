/*
  # Crear tabla de sub-departamentos (sub_departments)

  ## Descripción
  Crea la tabla `sub_departments` para normalizar las áreas o sub-departamentos
  dentro de cada departamento. Actualmente algunos sistemas usan texto libre
  para sub-departamentos, esto lo convierte en entidad normalizada (3FN).

  ## Nuevas Tablas
  - `sub_departments`
    - `id` (uuid, primary key)
    - `department_id` (uuid, FK a departments) - ON DELETE RESTRICT
    - `company_id` (uuid, FK a companies) - ON DELETE RESTRICT
    - `code` (text) - Código único dentro del departamento
    - `name` (text) - Nombre del sub-departamento
    - `description` (text) - Descripción
    - `is_active` (boolean) - Si está activo
    - `created_at`, `updated_at` (timestamptz)

  ## Normalización 3FN
  - Extrae sub-departamentos de texto libre a entidad propia
  - Permite jerarquía: company → department → sub_department
  - Facilita reportes y estructura organizacional

  ## Ventajas
  - Datos consistentes (no más "Contabilidad" vs "contabilidad")
  - Facilita búsquedas y filtros
  - Permite reportes por sub-departamento
  - Estructura organizacional clara

  ## Notas Importantes
  - Esta tabla NO afecta la tabla `employees` existente
  - NO elimina campos de employees todavía
  - Es completamente independiente por ahora
  - Constraint UNIQUE por (department_id, code)
*/

-- Crear tabla de sub-departamentos
CREATE TABLE IF NOT EXISTS sub_departments (
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

COMMENT ON TABLE sub_departments IS 'Sub-departamentos o áreas dentro de un departamento. Extraído de texto libre para cumplir 3FN. Permite estructura organizacional jerárquica.';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_sub_departments_department ON sub_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_sub_departments_company ON sub_departments(company_id);