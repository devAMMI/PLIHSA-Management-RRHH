import { X, Download, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface SignedDocumentViewerProps {
  documentUrl: string;
  filename: string;
  mimeType: string;
  uploadedAt?: string;
  onClose: () => void;
  originalDocumentUrl?: string;
  employeeName?: string;
}

export function SignedDocumentViewer({
  documentUrl,
  filename,
  mimeType,
  uploadedAt,
  onClose,
  originalDocumentUrl,
  employeeName
}: SignedDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalLoading, setOriginalLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'signed' | 'original' | 'both'>('both');
  const [downloadingBoth, setDownloadingBoth] = useState(false);

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

  const handleDownloadBoth = async () => {
    if (!originalDocumentUrl) return;

    setDownloadingBoth(true);
    try {
      const signedLink = document.createElement('a');
      signedLink.href = documentUrl;
      signedLink.download = `Firmado_${filename}`;
      document.body.appendChild(signedLink);
      signedLink.click();
      document.body.removeChild(signedLink);

      setTimeout(() => {
        const originalLink = document.createElement('a');
        originalLink.href = originalDocumentUrl;
        originalLink.download = `Original_${employeeName || 'Documento'}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(originalLink);
        originalLink.click();
        document.body.removeChild(originalLink);
      }, 500);
    } catch (error) {
      console.error('Error downloading documents:', error);
    } finally {
      setDownloadingBoth(false);
    }
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
              <h2 className="text-lg font-bold">Visualizador de Documentos</h2>
              <p className="text-sm text-green-100">{filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {originalDocumentUrl && (
              <button
                onClick={handleDownloadBoth}
                disabled={downloadingBoth}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition font-medium text-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingBoth ? 'Descargando...' : 'Descargar Ambos Archivos'}
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar Firmado
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

        {originalDocumentUrl && (
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'both'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                Ver Ambos
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'original'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setActiveTab('signed')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'signed'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                Firmado
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {loadError && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white rounded-lg p-8 shadow-md max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-slate-700 font-medium mb-2">Error al cargar el documento</p>
                <p className="text-slate-500 text-sm mb-4">{loadError}</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Intentar Descargar
                </button>
              </div>
            </div>
          )}

          {!loadError && (isLoading || (originalDocumentUrl && originalLoading && activeTab !== 'signed')) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                <p className="mt-4 text-slate-600">Cargando documento...</p>
              </div>
            </div>
          )}

          {!loadError && activeTab === 'both' && originalDocumentUrl && (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Original</h3>
                <iframe
                  src={originalDocumentUrl}
                  className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white"
                  title="Documento original PDF"
                  onLoad={() => setOriginalLoading(false)}
                />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Firmado</h3>
                {isPDF ? (
                  <iframe
                    src={documentUrl}
                    className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white"
                    title="Documento firmado PDF"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setLoadError('No se pudo cargar el archivo PDF firmado.');
                    }}
                  />
                ) : isImage ? (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
                    <img
                      src={documentUrl}
                      alt="Documento firmado"
                      className="max-w-full max-h-full rounded-lg"
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        setIsLoading(false);
                        setLoadError('No se pudo cargar la imagen firmada.');
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {!loadError && activeTab === 'original' && originalDocumentUrl && (
            <iframe
              src={originalDocumentUrl}
              className="w-full h-full rounded-lg border-2 border-slate-300 bg-white"
              title="Documento original PDF"
              onLoad={() => setOriginalLoading(false)}
            />
          )}

          {!loadError && (activeTab === 'signed' || !originalDocumentUrl) && (
            <>
              {isPDF && (
                <iframe
                  src={documentUrl}
                  className="w-full h-full rounded-lg border-2 border-slate-300 bg-white"
                  title="Documento firmado PDF"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError('No se pudo cargar el archivo PDF. Verifica que el archivo existe y es accesible.');
                  }}
                />
              )}

              {isImage && (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={documentUrl}
                    alt="Documento firmado"
                    className="max-w-full max-h-full rounded-lg shadow-lg border-2 border-slate-300"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setLoadError('No se pudo cargar la imagen. Verifica que el archivo existe y es accesible.');
                    }}
                  />
                </div>
              )}
            </>
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
