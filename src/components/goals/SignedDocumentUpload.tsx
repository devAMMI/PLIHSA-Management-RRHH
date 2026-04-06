import { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SignedDocumentUploadProps {
  goalDefinitionId: string;
  definitionType: 'administrative' | 'operative';
  currentDocumentUrl?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SignedDocumentUpload({
  goalDefinitionId,
  definitionType,
  currentDocumentUrl,
  onSuccess,
  onCancel
}: SignedDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('El archivo no puede ser mayor a 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${goalDefinitionId}_${Date.now()}.${fileExt}`;
      const filePath = `${definitionType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('goal-signed-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('goal-signed-documents')
        .getPublicUrl(filePath);

      const tableName = definitionType === 'administrative'
        ? 'goal_definitions'
        : 'operative_goal_definitions';

      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          signed_document_url: publicUrl,
          signed_document_filename: selectedFile.name,
          signed_document_mime_type: selectedFile.type,
          signed_document_uploaded_at: new Date().toISOString(),
          signed_document_uploaded_by: user.id,
          workflow_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', goalDefinitionId);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Subir Documento Firmado
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Imprime el documento de definición de metas</li>
                  <li>Firma el documento a puño y letra</li>
                  <li>Escanea o toma una foto clara del documento firmado</li>
                  <li>Sube el archivo aquí (PDF, JPG o PNG, máximo 10MB)</li>
                </ol>
              </div>
            </div>
          </div>

          {currentDocumentUrl && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2">
                Ya existe un documento firmado:
              </p>
              <a
                href={currentDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Ver documento actual
              </a>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Seleccionar Archivo
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {selectedFile ? (
                  <>
                    <FileText className="w-12 h-12 text-blue-600" />
                    <div className="text-sm text-slate-700">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Eliminar archivo
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400" />
                    <div className="text-sm text-slate-600">
                      <p className="font-medium">Haz clic para seleccionar un archivo</p>
                      <p className="text-slate-500 mt-1">
                        PDF, JPG o PNG (máximo 10MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Subiendo...' : 'Subir y Finalizar'}
          </button>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
