import { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EmployeeInfo {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface SignedDocumentUploadProps {
  goalDefinitionId: string;
  definitionType: 'administrative' | 'operative';
  evalYear?: number;
  employee?: EmployeeInfo;
  currentDocumentUrl?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PHASE_1_LABEL = 'Definicion de Metas';

function buildStoragePath(
  employeeId: string,
  employeeCode: string,
  year: number,
  definitionType: 'administrative' | 'operative',
  fileExt: string
): string {
  const typeSlug = definitionType === 'administrative' ? 'Administrativo' : 'Operativo';
  const filename = `${employeeCode}_Definicion_Metas_${year}.${fileExt}`;
  return `${employeeId}/${year}/01_definicion_metas/${typeSlug}/${filename}`;
}

export function SignedDocumentUpload({
  goalDefinitionId,
  definitionType,
  evalYear,
  employee,
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

    if (file.size > 10 * 1024 * 1024) {
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

      const fileExt = selectedFile.name.split('.').pop() || 'pdf';
      const year = evalYear || new Date().getFullYear();

      let storagePath: string;
      if (employee) {
        storagePath = buildStoragePath(
          employee.id,
          employee.employee_code,
          year,
          definitionType,
          fileExt
        );
      } else {
        storagePath = `${definitionType}/${goalDefinitionId}_${Date.now()}.${fileExt}`;
      }

      const { error: uploadError } = await supabase.storage
        .from('goal-signed-documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('goal-signed-documents')
        .getPublicUrl(storagePath);

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
          workflow_status: 'pending_signature'
        })
        .eq('id', goalDefinitionId);

      if (updateError) throw updateError;

      if (employee) {
        const employeeName = `${employee.first_name} ${employee.last_name}`;
        const { error: regError } = await supabase
          .from('evaluation_documents')
          .upsert({
            employee_id: employee.id,
            employee_code: employee.employee_code,
            employee_name: employeeName,
            eval_year: year,
            eval_phase: 1,
            phase_label: PHASE_1_LABEL,
            employee_type: definitionType,
            source_table: tableName,
            source_record_id: goalDefinitionId,
            document_url: publicUrl,
            document_filename: selectedFile.name,
            document_mime_type: selectedFile.type,
            storage_path: storagePath,
            document_kind: 'signed',
            uploaded_by: user.id,
            uploaded_at: new Date().toISOString()
          }, {
            onConflict: 'employee_id,eval_year,eval_phase,document_kind,source_record_id',
            ignoreDuplicates: false
          });

        if (regError) {
          console.warn('Could not register in evaluation_documents:', regError.message);
        }
      }

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

          {employee && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="text-sm text-slate-700">
                <span className="font-medium">{employee.first_name} {employee.last_name}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span className="text-slate-500">{employee.employee_code}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span className="text-slate-500">Definicion de Metas {evalYear || new Date().getFullYear()}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Imprime el documento de definicion de metas</li>
                  <li>Firma el documento a puno y letra</li>
                  <li>Escanea o toma una foto clara del documento firmado</li>
                  <li>Sube el archivo aqui (PDF, JPG o PNG, maximo 10MB)</li>
                </ol>
              </div>
            </div>
          </div>

          {currentDocumentUrl && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2">
                Ya existe un documento firmado. Subir uno nuevo lo reemplazara:
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
                        PDF, JPG o PNG (maximo 10MB)
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
            {uploading ? 'Subiendo...' : 'Subir Documento'}
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
