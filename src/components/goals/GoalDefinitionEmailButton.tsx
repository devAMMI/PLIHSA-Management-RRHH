import { useState } from 'react';
import { Loader2, Mail, X } from 'lucide-react';
import { sendGoalDefinitionEmail } from '../../lib/sendGoalEmail';

interface AttachmentResult { url: string; fileName: string; blob: Blob; contentType: string }
interface GoalDefinitionEmailButtonProps {
  employeeName: string;
  employeeEmail?: string | null;
  evaluationPeriod: string;
  generatePdf: () => Promise<AttachmentResult | null>;
  signedDocumentUrl?: string;
  signedDocumentFileName?: string;
  signedDocumentMimeType?: string;
  accent: 'blue' | 'orange';
}

export function GoalDefinitionEmailButton({ employeeName, employeeEmail, evaluationPeriod, generatePdf, signedDocumentUrl, signedDocumentFileName, signedDocumentMimeType, accent }: GoalDefinitionEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(employeeEmail || '');
  const [sending, setSending] = useState(false);
  const [documentType, setDocumentType] = useState<'original' | 'signed'>(signedDocumentUrl ? 'signed' : 'original');
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);
  const colors = accent === 'blue' ? { header: 'bg-blue-900', hover: 'hover:bg-blue-800', button: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-500' } : { header: 'bg-orange-700', hover: 'hover:bg-orange-600', button: 'bg-orange-600 hover:bg-orange-700', ring: 'focus:ring-orange-500' };

  const send = async () => {
    if (!email.trim()) { setResult({ success: false, text: 'Ingresa un correo electrónico válido.' }); return; }
    setSending(true); setResult(null);
    try {
      let attachment: AttachmentResult | null = null;
      if (documentType === 'signed' && signedDocumentUrl) {
        attachment = await fetchSignedDocument(signedDocumentUrl, signedDocumentFileName || 'Definicion_Metas_Firmada.pdf', signedDocumentMimeType || 'application/pdf');
      } else {
        attachment = await generatePdf();
      }
      if (!attachment) throw new Error('No se pudo preparar el documento');
      const response = await sendGoalDefinitionEmail({ to: email, employeeName, evaluationPeriod, attachmentBlob: attachment.blob, fileName: attachment.fileName, contentType: attachment.contentType, senderName: 'Sistema de Gestión de RRHH' });
      if (!response.success) throw new Error(response.error);
      setResult({ success: true, text: `Correo enviado exitosamente a ${email}` });
      setTimeout(() => { setOpen(false); setResult(null); }, 1800);
    } catch (error: any) {
      setResult({ success: false, text: error.message || 'No fue posible enviar el correo.' });
    } finally { setSending(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={`p-2 ${colors.hover} rounded-lg transition`} title="Enviar por correo"><Mail className="w-5 h-5" /></button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`${colors.header} text-white px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6" />
                <h2 className="text-lg font-bold">Enviar Definición por Correo</h2>
              </div>
              <button onClick={() => setOpen(false)} className={`p-2 ${colors.hover} rounded-lg`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p><strong>Empleado:</strong> {employeeName}</p>
                <p><strong>Periodo:</strong> {evaluationPeriod}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Documento a enviar</label>
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value as 'original' | 'signed')}
                  disabled={sending || !signedDocumentUrl}
                  className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 ${colors.ring} disabled:bg-slate-100`}
                >
                  {signedDocumentUrl && <option value="signed">Definición firmada</option>}
                  <option value="original">Definición sin firmar</option>
                </select>
                {!signedDocumentUrl && (
                  <p className="text-xs text-slate-400 mt-1.5">No hay documento firmado. Se enviará la definición sin firmar.</p>
                )}
              </div>
              {result && (
                <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {result.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo del destinatario</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={sending}
                  placeholder="nombre@empresa.com"
                  className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 ${colors.ring}`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setOpen(false)} disabled={sending} className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={send} disabled={sending} className={`flex items-center gap-2 px-5 py-2 ${colors.button} text-white rounded-lg disabled:opacity-50`}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function fetchSignedDocument(url: string, fileName: string, contentType: string): Promise<AttachmentResult> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo cargar el documento firmado');
  return { url, fileName, blob: await response.blob(), contentType };
}
