import { supabase } from './supabase';

interface SendGoalEmailParams {
  to: string;
  employeeName: string;
  evaluationPeriod: string;
  pdfBlob: Blob;
  fileName: string;
  senderName: string;
}

export async function sendGoalDefinitionEmail(params: SendGoalEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const base64 = await blobToBase64(params.pdfBlob);
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to.trim(),
        subject: `Definición de Metas - ${params.employeeName} (${params.evaluationPeriod})`,
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px"><h2 style="color:#1e3a8a">Definición de Metas</h2><p>Se adjunta la definición de metas del empleado <strong>${escapeHtml(params.employeeName)}</strong> correspondiente al periodo <strong>${escapeHtml(params.evaluationPeriod)}</strong>.</p><p>Enviado por: <strong>${escapeHtml(params.senderName)}</strong></p><p style="color:#64748b;font-size:12px">Correo enviado automáticamente desde el sistema de gestión de RRHH.</p></div>`,
        attachments: [{ filename: params.fileName, content: base64.split(',')[1], contentType: 'application/pdf' }],
      },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'No fue posible enviar el correo.');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending goal email:', error);
    return { success: false, error: error.message || 'No fue posible enviar el correo.' };
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}
