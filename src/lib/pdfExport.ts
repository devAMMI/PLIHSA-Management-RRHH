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

    const pageElements = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-page]'));
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const renderedPages = pageElements.length > 0
      ? await renderExplicitPages(element, pageElements)
      : [await renderLegacyPage(element, elementId)];

    renderedPages.forEach((canvas, index) => {
      if (!canvas) return;
      if (index > 0) pdf.addPage();
      const pageWidth = pdf.internal.pageSize.getWidth() - 20;
      const pageHeight = pdf.internal.pageSize.getHeight() - 20;
      const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imageWidth = canvas.width * scale;
      const imageHeight = canvas.height * scale;
      const x = (pdf.internal.pageSize.getWidth() - imageWidth) / 2;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 10, imageWidth, imageHeight);
    });

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

async function renderExplicitPages(element: HTMLElement, pages: HTMLElement[]): Promise<HTMLCanvasElement[]> {
  const originalRootStyle = { display: element.style.display, width: element.style.width, maxWidth: element.style.maxWidth, margin: element.style.margin };
  const ignoredElements = Array.from(element.querySelectorAll<HTMLElement>('[data-html2canvas-ignore="true"]'));
  const originalPageStyles = pages.map((page) => ({ page, display: page.style.display, width: page.style.width }));
  element.style.display = 'block';
  element.style.width = `${element.clientWidth}px`;
  element.style.maxWidth = 'none';
  element.style.margin = '0';
  ignoredElements.forEach((item) => { item.style.display = 'none'; });
  pages.forEach((page) => { page.style.display = 'block'; page.style.width = '100%'; });

  try {
    const canvases: HTMLCanvasElement[] = [];
    for (const page of pages) {
      canvases.push(await html2canvas(page, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' }));
    }
    return canvases;
  } finally {
    element.style.display = originalRootStyle.display;
    element.style.width = originalRootStyle.width;
    element.style.maxWidth = originalRootStyle.maxWidth;
    element.style.margin = originalRootStyle.margin;
    ignoredElements.forEach((item) => { item.style.display = ''; });
    originalPageStyles.forEach(({ page, display, width }) => { page.style.display = display; page.style.width = width; });
  }
}

async function renderLegacyPage(element: HTMLElement, elementId: string): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDocument) => {
      const clonedElement = clonedDocument.getElementById(elementId);
      if (!clonedElement) return;
      clonedElement.querySelectorAll('[data-html2canvas-ignore="true"]').forEach((node) => node.remove());
      clonedElement.style.display = 'block';
      clonedElement.style.width = `${element.clientWidth}px`;
      clonedElement.style.maxWidth = 'none';
      clonedElement.style.margin = '0';
    },
  });
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
