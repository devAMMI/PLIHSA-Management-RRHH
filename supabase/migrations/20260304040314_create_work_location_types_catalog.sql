/*
  # Crear catálogo de tipos de ubicación de trabajo

  ## Descripción
  Crea la tabla `work_location_types` que define los tipos de ubicaciones
  físicas donde pueden trabajar los empleados.

  ## Nuevas Tablas
  - `work_location_types`
    - `id` (smallint, primary key, auto-increment)
    - `code` (text, unique) - Código único del tipo
    - `name` (text) - Nombre descriptivo
    - `is_plant` (boolean) - TRUE para plantas productivas, FALSE para oficinas
    - `description` (text) - Descripción opcional

  ## Datos Iniciales
  Se insertan 5 tipos:
  1. **planta_corona** - Planta Corona (is_plant=true)
  2. **planta_inyeccion** - Planta Inyección (is_plant=true)
  3. **edificio_admin** - Edificio Administrativo (is_plant=false)
  4. **oficina_central** - Oficina Central (is_plant=false)
  5. **otro** - Otro (is_plant=false)

  ## Notas Importantes
  - Esta tabla NO afecta ninguna tabla existente
  - Es completamente independiente
  - Se usará después para crear `work_locations`
  - `is_plant=true` identifica plantas productivas (Corona, Inyección)
  - `is_plant=false` identifica oficinas administrativas (Edificio Admin PLIHSA)
*/

-- Crear tabla de tipos de ubicación
CREATE TABLE IF NOT EXISTS work_location_types (
  id           SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  is_plant     BOOLEAN NOT NULL DEFAULT false,
  description  TEXT
);

COMMENT ON TABLE work_location_types IS 'Catálogo de tipos de ubicación física. is_plant=true para plantas productivas (Corona, Inyección), is_plant=false para oficinas administrativas.';

-- Insertar datos iniciales
INSERT INTO work_location_types (code, name, is_plant, description) VALUES
  ('planta_corona',    'Planta Corona',           true,  'Planta de producción — línea Corona'),
  ('planta_inyeccion', 'Planta Inyección',        true,  'Planta de producción — línea Inyección'),
  ('edificio_admin',   'Edificio Administrativo', false, 'Oficinas administrativas corporativas'),
  ('oficina_central',  'Oficina Central',         false, 'Sede / oficina central de la empresa'),
  ('otro',             'Otro',                    false, 'Otra ubicación no clasificada')
ON CONFLICT (code) DO NOTHING;