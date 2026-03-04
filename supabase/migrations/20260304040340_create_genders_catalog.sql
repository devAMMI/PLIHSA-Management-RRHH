/*
  # Crear catálogo de géneros

  ## Descripción
  Crea la tabla `genders` que define las opciones de género disponibles
  en el sistema. Se usará para normalizar el campo de género de los empleados.

  ## Nuevas Tablas
  - `genders`
    - `id` (smallint, primary key, auto-increment)
    - `code` (text, unique) - Código único del género
    - `name` (text) - Nombre descriptivo

  ## Datos Iniciales
  Se insertan 4 opciones:
  1. **masculino** - Masculino
  2. **femenino** - Femenino
  3. **otro** - Otro
  4. **prefiero_no_decir** - Prefiero no decir

  ## Notas Importantes
  - Esta tabla NO afecta ninguna tabla existente
  - Es completamente independiente
  - Se usará después para agregar campo `gender_id` en employees
*/

-- Crear tabla de géneros
CREATE TABLE IF NOT EXISTS genders (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

COMMENT ON TABLE genders IS 'Catálogo de opciones de género para empleados.';

-- Insertar datos iniciales
INSERT INTO genders (code, name) VALUES
  ('masculino',         'Masculino'),
  ('femenino',          'Femenino'),
  ('otro',              'Otro'),
  ('prefiero_no_decir', 'Prefiero no decir')
ON CONFLICT (code) DO NOTHING;