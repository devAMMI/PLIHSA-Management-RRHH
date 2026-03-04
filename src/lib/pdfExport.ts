import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabase';
import { formatDateForDisplay } from './timezone';

export async function generatePDF(elementId: string, fileName: string): Promise<Blob | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return null;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

export async function saveFormExport(
  formId: string,
  userId: string,
  fileName: string,
  fileType: 'pdf',
  blob: Blob
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = `${userId}/${formId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('evaluation-exports')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { error: insertError } = await supabase
      .from('form_exports')
      .insert({
        form_id: formId,
        user_id: userId,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: blob.size,
        exported_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving form export:', error);
    return { success: false, error: String(error) };
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
