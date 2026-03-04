/*
  # Crear tabla de documentos de empleados (employee_documents)

  ## Descripción
  Crea la tabla `employee_documents` para gestionar metadata de documentos
  almacenados en Supabase Storage (CV, diplomas, certificaciones, contratos, etc.).

  ## Nuevas Tablas
  - `employee_documents`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, FK a employees) - ON DELETE CASCADE
    - `company_id` (uuid, FK a companies) - ON DELETE RESTRICT
    - `document_type_id` (smallint, FK a document_types)
    - `document_name` (text) - Nombre descriptivo del documento
    - `file_name` (text) - Nombre real del archivo en storage
    - `file_path` (text) - Ruta completa en Supabase Storage
    - `file_size_kb` (integer) - Tamaño en kilobytes
    - `mime_type` (text) - Tipo MIME del archivo
    - `is_active` (boolean) - Si el documento está activo
    - `notes` (text) - Notas adicionales
    - `uploaded_at` (timestamptz) - Fecha de carga
    - `uploaded_by` (uuid, FK a auth.users) - Usuario que lo cargó

  ## Integración con Supabase Storage
  
  Estructura de rutas en Storage:
  ```
  employee-documents/{company_id}/{employee_id}/{document_type_code}/{filename}
  ```
  
  Ejemplo:
  ```
  employee-documents/uuid-plihsa/uuid-employee/cv/curriculum_2026.pdf
  ```

  ## Buckets requeridos (crear manualmente en Supabase Dashboard)
  1. employee-photos
  2. employee-documents
  3. company-logos
  4. evaluation-attachments

  ## Notas Importantes
  - Esta tabla solo guarda METADATA, los archivos están en Storage
  - file_path contiene la ruta relativa dentro del bucket
  - ON DELETE CASCADE: si se elimina empleado, se elimina metadata (archivos quedan en Storage)
  - is_active permite "archivar" documentos sin eliminarlos
*/

-- Crear tabla de documentos de empleados
CREATE TABLE IF NOT EXISTS employee_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  document_type_id  SMALLINT NOT NULL REFERENCES document_types(id),
  document_name     TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_path         TEXT NOT NULL,
  file_size_kb      INTEGER,
  mime_type         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by       UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE employee_documents IS 'Metadata de documentos de empleados almacenados en Supabase Storage. file_path contiene la ruta relativa dentro del bucket correspondiente.';
COMMENT ON COLUMN employee_documents.file_path IS 'Ruta en Storage. Formato: {company_id}/{employee_id}/{document_type}/{filename}';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_employee_docs_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_docs_company ON employee_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_docs_type ON employee_documents(document_type_id);