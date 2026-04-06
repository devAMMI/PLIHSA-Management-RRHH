import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface SignedDocumentViewerProps {
  documentUrl: string;
  filename: string;
  mimeType: string;
  uploadedAt?: string;
  onClose: () => void;
}

export function SignedDocumentViewer({
  documentUrl,
  filename,
  mimeType,
  uploadedAt,
  onClose
}: SignedDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.includes('image');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            {isPDF ? (
              <FileText className="w-6 h-6" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
            <div>
              <h2 className="text-lg font-bold">Documento Firmado</h2>
              <p className="text-sm text-green-100">{filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar Evaluación Firmada
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-600 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {uploadedAt && (
          <div className="px-6 py-2 bg-green-50 border-b border-green-200 text-sm text-green-800">
            <span className="font-medium">Fecha de subida:</span>{' '}
            {new Date(uploadedAt).toLocaleString('es-HN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                <p className="mt-4 text-slate-600">Cargando documento...</p>
              </div>
            </div>
          )}

          {isPDF && (
            <iframe
              src={documentUrl}
              className="w-full h-full rounded-lg border-2 border-slate-300 bg-white"
              title="Documento firmado PDF"
              onLoad={() => setIsLoading(false)}
            />
          )}

          {isImage && (
            <div className="flex items-center justify-center h-full">
              <img
                src={documentUrl}
                alt="Documento firmado"
                className="max-w-full max-h-full rounded-lg shadow-lg border-2 border-slate-300"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          )}

          {!isPDF && !isImage && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white rounded-lg p-8 shadow-md">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 font-medium mb-2">
                  No se puede previsualizar este tipo de archivo
                </p>
                <p className="text-slate-500 text-sm mb-4">Tipo: {mimeType}</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Descargar Documento
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-xl">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Tipo:</span>{' '}
            {isPDF ? 'PDF' : isImage ? 'Imagen' : mimeType}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
