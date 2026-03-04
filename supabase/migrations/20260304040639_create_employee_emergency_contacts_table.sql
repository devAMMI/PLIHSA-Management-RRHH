/*
  # Crear tabla de contactos de emergencia (employee_emergency_contacts)

  ## Descripción
  Crea la tabla `employee_emergency_contacts` para normalizar los contactos
  de emergencia de los empleados. En lugar de tener campos emergency_contact_name
  y emergency_contact_phone en employees, ahora cada empleado puede tener
  múltiples contactos de emergencia con información completa.

  ## Nuevas Tablas
  - `employee_emergency_contacts`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, FK a employees) - ON DELETE CASCADE
    - `contact_name` (text) - Nombre del contacto
    - `relationship` (text) - Parentesco (ej: esposa, padre, hermano)
    - `phone` (text) - Teléfono principal
    - `alternate_phone` (text) - Teléfono alternativo
    - `email` (text) - Email del contacto
    - `address` (text) - Dirección del contacto
    - `is_primary` (boolean) - Si es el contacto principal
    - `created_at` (timestamptz)

  ## Normalización 3FN
  Esta tabla extrae de `employees`:
  - emergency_contact_name → contact_name
  - emergency_contact_phone → phone
  
  ## Ventajas
  - Un empleado puede tener múltiples contactos de emergencia
  - Información más completa (parentesco, teléfonos alternos, email)
  - Puede marcar contacto principal con is_primary
  - Datos normalizados y estructurados

  ## Notas Importantes
  - Esta tabla NO afecta la tabla `employees` existente
  - NO elimina campos de employees todavía
  - Es completamente independiente por ahora
  - ON DELETE CASCADE: si se elimina empleado, se eliminan sus contactos
*/

-- Crear tabla de contactos de emergencia
CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contact_name      TEXT NOT NULL,
  relationship      TEXT NOT NULL,
  phone             TEXT NOT NULL,
  alternate_phone   TEXT,
  email             TEXT,
  address           TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_emergency_contacts IS 'Contactos de emergencia del empleado. Normalizado desde employees para cumplir 3FN. Un empleado puede tener múltiples contactos.';

-- Crear índice para búsquedas por empleado
CREATE INDEX IF NOT EXISTS idx_employee_emergency_contacts_employee ON employee_emergency_contacts(employee_id);