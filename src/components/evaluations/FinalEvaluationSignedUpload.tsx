import { useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { buildStoragePath, storagePathToProxyUrl, BUCKET } from '../../lib/storagePaths';

interface EmployeeInfo {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface FinalEvaluationSignedUploadProps {
  evaluationId: string;
  evaluationType: 'administrativo' | 'operativo';
  employee: EmployeeInfo;
  currentDocumentUrl?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FinalEvaluationSignedUpload({
  evaluationId,
  evaluationType,
  employee,
  currentDocumentUrl,
  onSuccess,
  onCancel,
}: FinalEvaluationSignedUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('El archivo no puede superar 10 MB'); return; }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) { setError('Solo se permiten archivos PDF, JPG o PNG'); return; }
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
      const year = new Date().getFullYear();
      const empType = evaluationType === 'administrativo' ? 'administrativo' : 'operativo';

      const storagePath = buildStoragePath({
        docKind: 'evaluacion',
        empType,
        year,
        employee,
        fileExt,
      });

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const proxyUrl = storagePathToProxyUrl(storagePath);
      const table = evaluationType === 'administrativo' ? 'final_administrative_evaluations' : 'operative_evaluations';
      const { error: updateError } = await supabase.from(table).update({
        signed_document_url: proxyUrl,
        signed_document_filename: selectedFile.name,
        signed_document_mime_type: selectedFile.type,
        signed_document_uploaded_at: new Date().toISOString(),
        signed_document_uploaded_by: user.id,
        workflow_status: 'pending_signature',
      }).eq('id', evaluationId);
      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">Subir Documento Firmado</h2>
          <button onClick={onCancel} className="rounded-lg p-2 hover:bg-slate-100 transition"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <FileText className="h-4 w-4 shrink-0 text-slate-500" />
            <span><span className="font-medium">{employee.first_name} {employee.last_name}</span> <span className="text-slate-400 mx-1">·</span> {employee.employee_code} <span className="text-slate-400 mx-1">·</span> Evaluación Final {new Date().getFullYear()}</span>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="mb-2 font-medium">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Imprime el PDF de la evaluación final</li>
                  <li>Firma el documento a puño y letra (Jefe, Colaborador y RRHH)</li>
                  <li>Escanea o toma una foto clara del documento firmado</li>
                  <li>Sube el archivo aquí (PDF, JPG o PNG, máximo 10 MB)</li>
                </ol>
              </div>
            </div>
          </div>

          {currentDocumentUrl && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="mb-2">Ya existe un documento firmado. Subir uno nuevo lo reemplazará:</p>
              <a href={currentDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">Ver documento actual</a>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Seleccionar archivo</p>
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-400">
              <input type="file" id="final-signed-upload" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
              <label htmlFor="final-signed-upload" className="flex cursor-pointer flex-col items-center gap-3">
                {selectedFile ? (
                  <>
                    <FileText className="h-12 w-12 text-blue-600" />
                    <div className="text-sm text-slate-700">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); setSelectedFile(null); }} className="text-sm text-red-600 hover:text-red-700">Eliminar archivo</button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-slate-400" />
                    <div className="text-sm text-slate-600">
                      <p className="font-medium">Haz clic para seleccionar un archivo</p>
                      <p className="mt-1 text-slate-500">PDF, JPG o PNG (máximo 10 MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={handleUpload} disabled={!selectedFile || uploading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Upload className="h-4 w-4" />
            {uploading ? 'Subiendo...' : 'Subir Documento'}
          </button>
          <button onClick={onCancel} disabled={uploading} className="rounded-lg bg-slate-200 px-6 py-2 font-medium text-slate-700 transition hover:bg-slate-300 disabled:opacity-50">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
