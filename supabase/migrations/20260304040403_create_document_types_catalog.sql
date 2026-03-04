/*
  # Crear catálogo de tipos de documento

  ## Descripción
  Crea la tabla `document_types` que define los tipos de documentos
  que se pueden almacenar para los empleados en Supabase Storage.

  ## Nuevas Tablas
  - `document_types`
    - `id` (smallint, primary key, auto-increment)
    - `code` (text, unique) - Código único del tipo
    - `name` (text) - Nombre descriptivo

  ## Datos Iniciales
  Se insertan 9 tipos de documento:
  1. **photo** - Foto de perfil
  2. **cv** - Curriculum Vitae
  3. **diploma** - Diploma
  4. **degree** - Título universitario
  5. **certification** - Certificación
  6. **id_document** - Documento de identidad
  7. **contract** - Contrato laboral
  8. **labor_letter** - Constancia laboral
  9. **other** - Otro

  ## Notas Importantes
  - Esta tabla NO afecta ninguna tabla existente
  - Es completamente independiente
  - Se usará después para crear `employee_documents`
  - Preparación para integración con Supabase Storage
*/

-- Crear tabla de tipos de documento
CREATE TABLE IF NOT EXISTS document_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

COMMENT ON TABLE document_types IS 'Catálogo de tipos de documentos que pueden almacenarse para empleados en Supabase Storage.';

-- Insertar datos iniciales
INSERT INTO document_types (code, name) VALUES
  ('photo',          'Foto de perfil'),
  ('cv',             'Curriculum Vitae'),
  ('diploma',        'Diploma'),
  ('degree',         'Título universitario'),
  ('certification',  'Certificación'),
  ('id_document',    'Documento de identidad'),
  ('contract',       'Contrato laboral'),
  ('labor_letter',   'Constancia laboral'),
  ('other',          'Otro')
ON CONFLICT (code) DO NOTHING;