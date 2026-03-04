/*
  # Crear catálogo de niveles educativos

  ## Descripción
  Crea la tabla `education_levels` que define los niveles educativos
  disponibles en el sistema. Se usará para normalizar la educación
  de los empleados (actualmente en campo `education_level` de employees).

  ## Nuevas Tablas
  - `education_levels`
    - `id` (smallint, primary key, auto-increment)
    - `code` (text, unique) - Código único del nivel
    - `name` (text) - Nombre descriptivo
    - `sort_order` (smallint) - Orden de jerarquía educativa

  ## Datos Iniciales
  Se insertan 8 niveles educativos (del menor al mayor):
  1. Primaria (sort_order=1)
  2. Secundaria (sort_order=2)
  3. Bachillerato (sort_order=3)
  4. Técnico (sort_order=4)
  5. Universitario (sort_order=5)
  6. Postgrado (sort_order=6)
  7. Maestría (sort_order=7)
  8. Doctorado (sort_order=8)

  ## Notas Importantes
  - Esta tabla NO afecta ninguna tabla existente
  - Es completamente independiente
  - Se usará después para crear `employee_education`
  - `sort_order` permite ordenar por nivel educativo
*/

-- Crear tabla de niveles educativos
CREATE TABLE IF NOT EXISTS education_levels (
  id         SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

COMMENT ON TABLE education_levels IS 'Catálogo de niveles educativos. sort_order define la jerarquía (1=Primaria hasta 8=Doctorado).';

-- Insertar datos iniciales
INSERT INTO education_levels (code, name, sort_order) VALUES
  ('primaria',       'Primaria',       1),
  ('secundaria',     'Secundaria',     2),
  ('bachillerato',   'Bachillerato',   3),
  ('tecnico',        'Técnico',        4),
  ('universitario',  'Universitario',  5),
  ('postgrado',      'Postgrado',      6),
  ('maestria',       'Maestría',       7),
  ('doctorado',      'Doctorado',      8)
ON CONFLICT (code) DO NOTHING;