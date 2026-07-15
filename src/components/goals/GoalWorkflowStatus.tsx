import { FileText, Upload, CheckCircle, Clock, Printer, Download } from 'lucide-react';

export type WorkflowStatus = 'draft' | 'pending_signature' | 'completed';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  signedDocumentUrl?: string | null;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
  onUploadSigned?: () => void;
  onMarkAsCompleted?: () => void;
}

export function GoalWorkflowStatus({
  status,
  signedDocumentUrl,
  onPrint,
  onDownloadPDF,
  onUploadSigned,
  onMarkAsCompleted
}: WorkflowStatusBadgeProps) {
  const getStatusConfig = (status: WorkflowStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Borrador',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: FileText,
          description: 'En edición'
        };
      case 'pending_signature':
        return {
          label: 'Pendiente Firma',
          color: 'bg-amber-100 text-amber-700 border-amber-300',
          icon: Clock,
          description: 'Esperando firma manual'
        };
      case 'completed':
        return {
          label: 'Completado',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: CheckCircle,
          description: 'Firmado y finalizado'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-slate-600" />
          <div>
            <h3 className="font-semibold text-slate-800">Estado del Workflow</h3>
            <p className="text-sm text-slate-500">{config.description}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full border font-medium text-sm ${config.color}`}>
          {config.label}
        </span>
      </div>

      {status === 'draft' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Siguiente paso:</strong> Imprime el documento, fírmalo a puño y letra, escanéalo y súbelo aquí.
          </p>
          <div className="flex flex-wrap gap-2">
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            )}
            {onUploadSigned && (
              <button
                onClick={onUploadSigned}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                Subir Documento Firmado
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'pending_signature' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          {signedDocumentUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Documento firmado subido correctamente. Presiona "Finalizar Definicion" para completar el proceso.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={signedDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Ver Documento
                </a>
                {onUploadSigned && (
                  <button
                    onClick={onUploadSigned}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Reemplazar Documento
                  </button>
                )}
                {onMarkAsCompleted && (
                  <button
                    onClick={onMarkAsCompleted}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalizar Definicion
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-amber-800 mb-3">
                <strong>Paso requerido:</strong> Firma el documento impreso a puño y letra, escanéalo y súbelo aquí.
              </p>
              <div className="flex gap-2">
                {onUploadSigned && (
                  <button
                    onClick={onUploadSigned}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Subir Documento Firmado
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'completed' && signedDocumentUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 mb-3">
            <strong>Proceso completado:</strong> El documento ha sido firmado y finalizado exitosamente.
          </p>
          <a
            href={signedDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Ver Documento Firmado
          </a>
        </div>
      )}
    </div>
  );
}
