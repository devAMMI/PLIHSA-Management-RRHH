import { X, Download, FileText, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState<'signed' | 'original' | 'both'>('both');
  const [downloadingBoth, setDownloadingBoth] = useState(false);

  // Signed document blob state
  const [signedBlobUrl, setSignedBlobUrl] = useState<string | null>(null);
  const [signedLoading, setSignedLoading] = useState(true);
  const [signedError, setSignedError] = useState<string | null>(null);

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.includes('image');

  // Fetch signed document as blob to avoid iframe/CORS issues with Supabase URLs
  useEffect(() => {
    let objectUrl: string | null = null;

    async function fetchSignedDoc() {
      setSignedLoading(true);
      setSignedError(null);
      try {
        const response = await fetch(documentUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setSignedBlobUrl(objectUrl);
      } catch (err) {
        setSignedError('No se pudo cargar el documento firmado.');
      } finally {
        setSignedLoading(false);
      }
    }

    fetchSignedDoc();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = signedBlobUrl || documentUrl;
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
      signedLink.href = signedBlobUrl || documentUrl;
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

  const renderSignedDocument = (className = 'flex-1 w-full rounded-lg border-2 border-slate-300 bg-white') => {
    if (signedLoading) {
      return (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm">Cargando documento firmado...</p>
          </div>
        </div>
      );
    }

    if (signedError || !signedBlobUrl) {
      return (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
          <div className="text-center p-8 max-w-sm">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">Error al cargar el documento</p>
            <p className="text-slate-500 text-sm mb-4">{signedError}</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium mx-auto text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar en su lugar
            </button>
          </div>
        </div>
      );
    }

    if (isPDF) {
      return <iframe src={signedBlobUrl} className={className} title="Documento firmado PDF" />;
    }

    if (isImage) {
      return (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
          <img src={signedBlobUrl} alt="Documento firmado" className="max-w-full max-h-full rounded-lg" />
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
        <div className="text-center p-8">
          <FileText className="w-14 h-14 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-700 font-medium mb-2">No se puede previsualizar este tipo de archivo</p>
          <p className="text-slate-500 text-sm mb-4">Tipo: {mimeType}</p>
          <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium mx-auto text-sm">
            <Download className="w-4 h-4" />
            Descargar Documento
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            {isPDF ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
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
            <button onClick={onClose} className="p-2 hover:bg-green-600 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Upload date */}
        {uploadedAt && (
          <div className="px-6 py-2 bg-green-50 border-b border-green-200 text-sm text-green-800">
            <span className="font-medium">Fecha de subida:</span>{' '}
            {new Date(uploadedAt).toLocaleString('es-HN', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        )}

        {/* Tabs */}
        {originalDocumentUrl && (
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-2">
              {(['both', 'original', 'signed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                    activeTab === tab
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {tab === 'both' ? 'Ver Ambos' : tab === 'original' ? 'Original' : 'Firmado'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {activeTab === 'both' && originalDocumentUrl && (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col h-full">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Original</h3>
                <iframe
                  src={originalDocumentUrl}
                  className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white"
                  title="Documento original PDF"
                />
              </div>
              <div className="flex flex-col h-full">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Firmado</h3>
                {renderSignedDocument()}
              </div>
            </div>
          )}

          {activeTab === 'original' && originalDocumentUrl && (
            <iframe
              src={originalDocumentUrl}
              className="w-full h-full rounded-lg border-2 border-slate-300 bg-white"
              title="Documento original PDF"
            />
          )}

          {(activeTab === 'signed' || !originalDocumentUrl) && (
            <div className="w-full h-full flex flex-col">
              {renderSignedDocument('w-full h-full rounded-lg border-2 border-slate-300 bg-white')}
            </div>
          )}
        </div>

        {/* Footer */}
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
