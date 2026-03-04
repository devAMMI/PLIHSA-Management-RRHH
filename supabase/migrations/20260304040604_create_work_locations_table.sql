/*
  # Crear tabla de ubicaciones de trabajo (work_locations)

  ## Descripción
  Crea la tabla `work_locations` que unifica TODAS las ubicaciones físicas
  donde pueden trabajar los empleados: plantas productivas (Corona, Inyección)
  y oficinas administrativas (Edificio Administrativo PLIHSA).

  ## Nuevas Tablas
  - `work_locations`
    - `id` (uuid, primary key)
    - `company_id` (uuid, FK a companies)
    - `work_location_type_id` (smallint, FK a work_location_types)
    - `code` (text) - Código único por empresa
    - `name` (text) - Nombre descriptivo
    - `address` (text) - Dirección física
    - `city` (text) - Ciudad
    - `is_active` (boolean) - Si está activa
    - `created_at`, `updated_at` (timestamptz)

  ## Datos Iniciales para PLIHSA
  Se crean 3 ubicaciones:
  1. **Planta Corona PLIHSA** (tipo: planta_corona)
  2. **Planta Inyección PLIHSA** (tipo: planta_inyeccion)
  3. **Edificio Administrativo PLIHSA** (tipo: edificio_admin) ← NUEVA

  ## Diferencia con `plants` (tabla actual)
  - `plants` solo tiene plantas productivas (Corona, Inyección)
  - `work_locations` incluye TODAS las ubicaciones físicas
  - Empleados administrativos ahora tienen ubicación (antes plant_id = NULL)

  ## Notas Importantes
  - Esta tabla NO afecta la tabla `plants` existente
  - NO modifica la tabla `employees` existente
  - Es completamente independiente por ahora
  - Se usará en fase posterior para agregar `work_location_id` a employees
  - Constraint UNIQUE por (company_id, code)
*/

-- Crear tabla de ubicaciones de trabajo
CREATE TABLE IF NOT EXISTS work_locations (
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

COMMENT ON TABLE work_locations IS 'Ubicaciones físicas de trabajo por empresa. Unifica plantas productivas y edificios administrativos. Cada empleado tendrá work_location_id (nunca NULL).';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_work_locations_company ON work_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_work_locations_type ON work_locations(work_location_type_id);

-- Insertar ubicaciones iniciales para PLIHSA
INSERT INTO work_locations (company_id, work_location_type_id, code, name, city)
SELECT
  c.id,
  wlt.id,
  'PLIHSA-PL-COR',
  'Planta Corona PLIHSA',
  'San Pedro Sula'
FROM companies c
CROSS JOIN work_location_types wlt
WHERE c.code = 'PLIHSA' AND wlt.code = 'planta_corona'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO work_locations (company_id, work_location_type_id, code, name, city)
SELECT
  c.id,
  wlt.id,
  'PLIHSA-PL-INY',
  'Planta Inyección PLIHSA',
  'San Pedro Sula'
FROM companies c
CROSS JOIN work_location_types wlt
WHERE c.code = 'PLIHSA' AND wlt.code = 'planta_inyeccion'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO work_locations (company_id, work_location_type_id, code, name, city)
SELECT
  c.id,
  wlt.id,
  'PLIHSA-ED-ADM',
  'Edificio Administrativo PLIHSA',
  'San Pedro Sula'
FROM companies c
CROSS JOIN work_location_types wlt
WHERE c.code = 'PLIHSA' AND wlt.code = 'edificio_admin'
ON CONFLICT (company_id, code) DO NOTHING;