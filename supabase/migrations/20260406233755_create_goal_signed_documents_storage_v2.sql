/*
  # Crear Storage Bucket para Documentos Firmados de Metas

  1. Nuevo Bucket de Storage
    - `goal-signed-documents` - Para almacenar PDFs, imágenes de documentos firmados
    - Organizado por tipo: administrative/ y operative/
    - Archivos públicos para facilitar acceso
  
  2. Estructura de Carpetas
    - administrative/{goal_definition_id}_{timestamp}.pdf
    - operative/{goal_definition_id}_{timestamp}.pdf
  
  3. Políticas de Seguridad
    - Usuarios autenticados pueden subir documentos
    - Usuarios autenticados pueden ver documentos
    - Solo RRHH y administradores pueden eliminar documentos
  
  4. Notas Importantes
    - Archivos permitidos: PDF, PNG, JPG
    - Tamaño máximo: 10MB
    - Los documentos están vinculados a goal_definitions y operative_goal_definitions
*/

-- Crear el bucket para documentos firmados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'goal-signed-documents',
  'goal-signed-documents',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

-- Política: Usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload signed documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'goal-signed-documents'
  AND (storage.foldername(name))[1] IN ('administrative', 'operative')
);

-- Política: Usuarios autenticados pueden ver archivos
CREATE POLICY "Authenticated users can view signed documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'goal-signed-documents');

-- Política: RRHH y administradores pueden eliminar archivos
CREATE POLICY "RRHH and admins can delete signed documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
  AND EXISTS (
    SELECT 1 FROM system_users
    WHERE system_users.user_id::text = (auth.uid())::text
    AND system_users.role IN ('rrhh', 'super_admin')
  )
);

-- Política: Usuarios pueden actualizar sus propios archivos
CREATE POLICY "Users can update their uploaded documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'goal-signed-documents'
  AND owner_id::text = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'goal-signed-documents'
);
