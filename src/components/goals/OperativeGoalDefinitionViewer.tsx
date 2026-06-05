import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Printer, Pencil, X, ArrowLeft, Download, FileText, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';
import { GoalWorkflowStatus } from './GoalWorkflowStatus';
import { SignedDocumentUpload } from './SignedDocumentUpload';
import { SignedDocumentViewer } from './SignedDocumentViewer';

interface Employee {
  employee_code: string;
  first_name: string;
  last_name: string;
  position: string;
  hire_date: string;
  department: { name: string } | null;
  sub_department: { name: string } | null;
  manager: { first_name: string; last_name: string; position: string } | null;
}

interface OperativeGoalDefinition {
  id: string;
  employee_id: string;
  evaluation_period: string;
  definition_date: string;
  work_area: string;
  sub_department?: string | null;
  status: string;
  workflow_status?: string;
  signed_document_url?: string;
  signed_document_filename?: string;
  signed_document_mime_type?: string;
  signed_document_uploaded_at?: string;
  completed_at?: string;
  created_at: string;
  employee: Employee;
  manager_comments: string;
  employee_comments: string;
  operative_individual_goals: Array<{
    id: string;
    goal_number: number;
    goal_description: string;
    measurement_and_expected_results: string;
  }>;
  operative_safety_standards: Array<{
    id: string;
    standard_number: number;
    standard_description: string;
  }>;
}

interface OperativeGoalDefinitionViewerProps {
  definition: OperativeGoalDefinition;
  onClose: () => void;
  onUpdate?: () => void;
  mode?: 'view' | 'edit';
}

export function OperativeGoalDefinitionViewer({ definition, onClose, onUpdate, mode: initialMode = 'view' }: OperativeGoalDefinitionViewerProps) {
  const { systemUser } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(definition);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);

  const [functionalFactors, setFunctionalFactors] = useState(
    Array.from({ length: 5 }, (_, i) => {
      const existing = definition.operative_individual_goals.find(g => g.goal_number === i + 1);
      return {
        id: existing?.id,
        number: i + 1,
        jobFunction: existing?.goal_description || '',
        expectedResults: existing?.measurement_and_expected_results || ''
      };
    })
  );

  const [behavioralCompetencies, setBehavioralCompetencies] = useState(
    Array.from({ length: 5 }, (_, i) => {
      const existing = definition.operative_safety_standards.find(s => s.standard_number === i + 1);
      return {
        id: existing?.id,
        number: i + 1,
        description: existing?.standard_description || ''
      };
    })
  );

  const [managerComments, setManagerComments] = useState(definition.manager_comments || '');
  const [employeeComments, setEmployeeComments] = useState(definition.employee_comments || '');
  const [definitionDate, setDefinitionDate] = useState(definition.definition_date);
  const [subDepartment, setSubDepartment] = useState(
    definition.sub_department ?? definition.employee?.sub_department?.name ?? ''
  );

  const handleFunctionalFactorChange = (index: number, field: 'jobFunction' | 'expectedResults', value: string) => {
    const updated = [...functionalFactors];
    updated[index][field] = value;
    setFunctionalFactors(updated);
  };

  const handleCompetencyChange = (index: number, value: string) => {
    const updated = [...behavioralCompetencies];
    updated[index].description = value;
    setBehavioralCompetencies(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error: updateError } = await supabase
        .from('operative_goal_definitions')
        .update({
          definition_date: definitionDate,
          employee_comments: employeeComments,
          manager_comments: managerComments,
          sub_department: subDepartment.trim() || null
        })
        .eq('id', definition.id);

      if (updateError) throw updateError;

      for (const factor of functionalFactors) {
        if (factor.jobFunction.trim() || factor.expectedResults.trim()) {
          if (factor.id) {
            const { error } = await supabase
              .from('operative_individual_goals')
              .update({
                goal_description: factor.jobFunction,
                measurement_and_expected_results: factor.expectedResults
              })
              .eq('id', factor.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('operative_individual_goals')
              .insert({
                goal_definition_id: definition.id,
                goal_number: factor.number,
                goal_description: factor.jobFunction,
                measurement_and_expected_results: factor.expectedResults
              });
            if (error) throw error;
          }
        } else if (factor.id) {
          const { error } = await supabase
            .from('operative_individual_goals')
            .delete()
            .eq('id', factor.id);
          if (error) throw error;
        }
      }

      for (const competency of behavioralCompetencies) {
        if (competency.description.trim()) {
          if (competency.id) {
            const { error } = await supabase
              .from('operative_safety_standards')
              .update({ standard_description: competency.description })
              .eq('id', competency.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('operative_safety_standards')
              .insert({
                goal_definition_id: definition.id,
                standard_number: competency.number,
                standard_description: competency.description
              });
            if (error) throw error;
          }
        } else if (competency.id) {
          const { error } = await supabase
            .from('operative_safety_standards')
            .delete()
            .eq('id', competency.id);
          if (error) throw error;
        }
      }

      setMessage({ type: 'success', text: 'Definicion de factores actualizada exitosamente' });
      setMode('view');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Error updating operative goal definition:', error);
      setMessage({ type: 'error', text: error.message || 'Error al actualizar la definicion de factores' });
    } finally {
      setLoading(false);
    }
  };

  const generatePdfBlob = async (): Promise<{ url: string; fileName: string } | null> => {
    if (!formRef.current) return null;

    try {
      // Push comments section to next page if it would be split
      let addedMargin = 0;
      if (commentsRef.current) {
        const imgWidth = 215.9 - 20; // 195.9mm content width
        const contentHeightMm = 279.4 - 20; // 259.4mm content height
        const pxPerMm = formRef.current.offsetWidth / imgWidth;
        const pageHeightPx = contentHeightMm * pxPerMm;
        const formTop = formRef.current.getBoundingClientRect().top;
        const commentsTop = commentsRef.current.getBoundingClientRect().top;
        const offsetPx = commentsTop - formTop;
        const posWithinPage = offsetPx % pageHeightPx;
        if (posWithinPage > 0) {
          addedMargin = pageHeightPx - posWithinPage + 8;
          commentsRef.current.style.marginTop = `${addedMargin}px`;
          await new Promise(r => setTimeout(r, 50));
        }
      }

      const canvas = await html2canvas(formRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: formRef.current.scrollWidth,
        windowHeight: formRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      if (addedMargin > 0 && commentsRef.current) {
        commentsRef.current.style.marginTop = '';
      }

      const margin = 10;
      const imgWidth = 215.9 - margin * 2;
      const pageWidth = 215.9;
      const pageHeight = 279.4;
      const contentHeight = pageHeight - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'letter');

      if (imgHeight <= contentHeight) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Slice canvas into page-sized chunks to avoid cutting mid-text
        const scale = canvas.width / imgWidth;
        const pageHeightPx = Math.floor(contentHeight * scale);
        const totalPages = Math.ceil(canvas.height / pageHeightPx);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const srcY = page * pageHeightPx;
          const srcH = Math.min(pageHeightPx, canvas.height - srcY);
          const sliceHeight = (srcH / scale);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = srcH;
          const ctx = pageCanvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, sliceHeight);
        }
      }

      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Definicion_Factores_Operativo_${definition.employee.first_name}_${definition.employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      return { url, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const generatePdfUrl = async (): Promise<string | null> => {
    const result = await generatePdfBlob();
    return result ? result.url : null;
  };

  const handleDownloadPDF = async () => {
    if (!formRef.current) return;

    setLoading(true);
    try {
      const result = await generatePdfBlob();
      if (!result) throw new Error('No se pudo generar el PDF');

      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(result.url), 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = async () => {
    if (!formRef.current) return;
    setLoading(true);
    try {
      const result = await generatePdfBlob();
      if (!result) throw new Error('No se pudo generar el PDF');
      window.open(result.url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSignedDocument = () => {
    if (!currentDefinition.signed_document_url) return;
    const link = document.createElement('a');
    link.href = currentDefinition.signed_document_url;
    link.download = currentDefinition.signed_document_filename || 'documento_firmado.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && formRef.current) {
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n');
          } catch {
            return '';
          }
        })
        .join('\n');

      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Definicion de Factores Operativo</title>
            <style>${styles}body { margin: 0; padding: 20px; }@media print { body { margin: 0; padding: 0; } }</style>
          </head>
          <body>${formRef.current.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleUploadSuccess = async () => {
    setShowUploadModal(false);

    const { data } = await supabase
      .from('operative_goal_definitions')
      .select('*, workflow_status, signed_document_url, signed_document_filename, signed_document_mime_type, signed_document_uploaded_at, completed_at')
      .eq('id', definition.id)
      .single();

    if (data) setCurrentDefinition({ ...currentDefinition, ...data });

    if (onUpdate) onUpdate();
    setMessage({ type: 'success', text: 'Documento firmado subido exitosamente' });
  };

  const handleMarkAsCompleted = async () => {
    try {
      const { error } = await supabase
        .from('operative_goal_definitions')
        .update({ workflow_status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', definition.id);

      if (error) throw error;

      setCurrentDefinition({ ...currentDefinition, workflow_status: 'completed', completed_at: new Date().toISOString() });
      if (onUpdate) onUpdate();
      setMessage({ type: 'success', text: 'Definicion marcada como completada' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al marcar como completada' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-xl shadow-xl max-w-7xl w-full my-8">
        <div className="bg-orange-700 text-white px-6 py-4 flex items-center justify-between print:hidden rounded-t-xl">
          <h2 className="text-xl font-bold">
            Definicion de Factores Operativo - {definition.employee.first_name} {definition.employee.last_name}
          </h2>
          <div className="flex gap-2">
            {mode === 'view' && (
              <>
                {(currentDefinition.workflow_status !== 'completed' || ['superadmin', 'admin'].includes(systemUser?.role || '')) && (
                  <button onClick={() => setMode('edit')} className="p-2 hover:bg-orange-600 rounded-lg transition" title="Editar">
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                <button onClick={handleDownloadPDF} disabled={loading} className="p-2 hover:bg-orange-600 rounded-lg transition disabled:opacity-50" title="Descargar PDF">
                  <Download className="w-5 h-5" />
                </button>
              </>
            )}
            {mode === 'edit' && (
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
            <button
              onClick={() => mode === 'edit' ? setMode('view') : onClose()}
              className="p-2 hover:bg-orange-600 rounded-lg transition"
            >
              {mode === 'edit' ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {message && (
            <div className={`mb-4 p-4 rounded-lg print:hidden ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="mb-6 print:hidden space-y-4">
            <GoalWorkflowStatus
              status={(currentDefinition.workflow_status || 'draft') as 'draft' | 'pending_signature' | 'completed'}
              signedDocumentUrl={currentDefinition.signed_document_url}
              onViewDigitalPDF={handleViewPDF}
              onDownloadPDF={handleDownloadPDF}
              onDownloadSignedDocument={handleDownloadSignedDocument}
              onUploadSigned={() => setShowUploadModal(true)}
              onMarkAsCompleted={handleMarkAsCompleted}
            />

            {currentDefinition.signed_document_url && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Documento Firmado
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Nombre del archivo:</span>
                        <span className="text-sm text-slate-600 break-all">{currentDefinition.signed_document_filename || 'documento_firmado'}</span>
                      </div>
                      {currentDefinition.signed_document_uploaded_at && (
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Fecha de subida:</span>
                          <span className="text-sm text-slate-600">
                            {new Date(currentDefinition.signed_document_uploaded_at).toLocaleString('es-HN', {
                              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        const pdfUrl = await generatePdfUrl();
                        if (pdfUrl) setOriginalPdfUrl(pdfUrl);
                        setShowDocumentViewer(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Documento
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-content" ref={formRef}>
            <div className="bg-white border-b-2 border-slate-300">
              <div className="grid grid-cols-12">
                <div className="col-span-2 border-r-2 border-slate-300 p-2 flex items-center justify-center">
                  <img
                    src="https://i.imgur.com/hii0TM1.png"
                    alt="PLIHSA Logo"
                    className="w-full h-auto max-w-[120px]"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="col-span-7 border-r-2 border-slate-300 p-2 flex items-center justify-center">
                  <h1 className="text-xs font-bold text-slate-800 text-center">
                    Definición de Factores y Revisión del Desempeño Operativo
                  </h1>
                </div>
                <div className="col-span-3 flex flex-col justify-center text-[8px]">
                  <div className="border-b border-slate-300 py-1.5 text-center">
                    <span className="font-semibold">Código:</span> PL-RH-P-002-F04
                  </div>
                  <div className="border-b border-slate-300 py-1.5 text-center">
                    <span className="font-semibold">Versión:</span> 01
                  </div>
                  <div className="py-1.5 text-center">
                    <span className="font-semibold">Fecha de Revisión:</span> 09/07/2025
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-[11px]">
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Código:</span>
                    <span className="text-slate-600">{definition.employee.employee_code}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Nombre:</span>
                    <span className="text-slate-600">{definition.employee.first_name} {definition.employee.last_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Puesto:</span>
                    <span className="text-slate-600">{definition.employee.position}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Departamento:</span>
                    <span className="text-slate-600">{definition.employee.department?.name || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">Sub Depto:</span>
                    {mode === 'edit' ? (
                      <input
                        type="text"
                        value={subDepartment}
                        onChange={(e) => setSubDepartment(e.target.value)}
                        className="text-slate-600 border border-slate-300 rounded px-2 py-0.5 text-sm flex-1"
                      />
                    ) : (
                      <span className="text-slate-600">{subDepartment || ''}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Fecha de Ingreso:</span>
                    <span className="text-slate-600">{new Date(definition.employee.hire_date + 'T00:00:00').toLocaleDateString('es-HN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Jefe Inmediato:</span>
                    <span className="text-slate-600">
                      {definition.employee.manager
                        ? `${definition.employee.manager.first_name} ${definition.employee.manager.last_name}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-700 min-w-[120px]">Fecha Definición:</span>
                    {mode === 'edit' ? (
                      <input
                        type="date"
                        value={definitionDate}
                        onChange={(e) => setDefinitionDate(e.target.value)}
                        className="border border-slate-300 rounded px-1 py-0.5 text-slate-600 text-[11px]"
                      />
                    ) : (
                      <span className="text-slate-600">{new Date(definitionDate + 'T00:00:00').toLocaleDateString('es-HN')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-3 py-2 mb-3 text-[11px]">
                  DEFINICIÓN DE FACTORES FUNCIONALES
                </h3>
                <table className="w-full border-2 border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-1.5 w-10 font-bold">No.</th>
                      <th className="border border-slate-300 px-2 py-1.5 font-bold">Funciones del Puesto</th>
                      <th className="border border-slate-300 px-2 py-1.5 font-bold">Resultados Esperados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {functionalFactors.map((factor, index) => (
                      <tr key={factor.number}>
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">{factor.number}</td>
                        <td className="border border-slate-300 px-2 py-2">
                          {mode === 'edit' ? (
                            <textarea
                              value={factor.jobFunction}
                              onChange={(e) => handleFunctionalFactorChange(index, 'jobFunction', e.target.value)}
                              rows={2}
                              className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[10px]"
                              placeholder="Describa la funcion..."
                            />
                          ) : (
                            <div className="min-h-[48px] whitespace-pre-wrap">{factor.jobFunction || '-'}</div>
                          )}
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          {mode === 'edit' ? (
                            <textarea
                              value={factor.expectedResults}
                              onChange={(e) => handleFunctionalFactorChange(index, 'expectedResults', e.target.value)}
                              rows={2}
                              className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[10px]"
                              placeholder="Resultados esperados..."
                            />
                          ) : (
                            <div className="min-h-[48px] whitespace-pre-wrap">{factor.expectedResults || '-'}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold text-white bg-blue-900 px-3 py-2 mb-3 text-[11px]">
                  DEFINICIÓN DE COMPETENCIAS CONDUCTUALES Y HABILIDADES TÉCNICAS
                </h3>
                <table className="w-full border-2 border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-1.5 w-10 font-bold">No.</th>
                      <th className="border border-slate-300 px-2 py-1.5 font-bold">Conductas y Habilidades Técnicas (Definir las 5 Principales)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behavioralCompetencies.map((competency, index) => (
                      <tr key={competency.number}>
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">{competency.number}</td>
                        <td className="border border-slate-300 px-2 py-2">
                          {mode === 'edit' ? (
                            <textarea
                              value={competency.description}
                              onChange={(e) => handleCompetencyChange(index, e.target.value)}
                              rows={1}
                              className="w-full border border-slate-200 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-[10px]"
                              placeholder="Describa la competencia..."
                            />
                          ) : (
                            <div className="min-h-[32px] whitespace-pre-wrap">{competency.description || ''}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4" ref={commentsRef}>
                <div className="border-2 border-slate-300">
                  <div className="bg-blue-900 text-white px-3 py-1.5 text-[10px] font-bold">
                    Comentarios Jefe Inmediato
                  </div>
                  {mode === 'edit' ? (
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      rows={4}
                      className="w-full border-0 p-3 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[10px]"
                      placeholder="Comentarios del jefe..."
                    />
                  ) : (
                    <div className="p-3 min-h-[75px] text-[10px] whitespace-pre-wrap">
                      {managerComments || ''}
                    </div>
                  )}
                </div>
                <div className="border-2 border-slate-300">
                  <div className="bg-blue-900 text-white px-3 py-1.5 text-[10px] font-bold">
                    Comentarios del Colaborador
                  </div>
                  {mode === 'edit' ? (
                    <textarea
                      value={employeeComments}
                      onChange={(e) => setEmployeeComments(e.target.value)}
                      rows={4}
                      className="w-full border-0 p-3 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-[10px]"
                      placeholder="Comentarios del colaborador..."
                    />
                  ) : (
                    <div className="p-3 min-h-[75px] text-[10px] whitespace-pre-wrap">
                      {employeeComments || ''}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 text-[10px] mt-12 pt-8">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-24">
                    <p className="font-bold text-slate-800">Firma Colaborador</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-24">
                    <p className="font-bold text-slate-800">Firma Jefe Inmediato</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <SignedDocumentUpload
          goalDefinitionId={definition.id}
          definitionType="operative"
          evalYear={new Date(definition.definition_date).getFullYear()}
          employee={{
            id: definition.employee_id,
            employee_code: definition.employee.employee_code,
            first_name: definition.employee.first_name,
            last_name: definition.employee.last_name
          }}
          currentDocumentUrl={currentDefinition.signed_document_url}
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      {showDocumentViewer && currentDefinition.signed_document_url && (
        <SignedDocumentViewer
          documentUrl={currentDefinition.signed_document_url}
          filename={currentDefinition.signed_document_filename || 'documento_firmado'}
          mimeType={currentDefinition.signed_document_mime_type || 'application/pdf'}
          uploadedAt={currentDefinition.signed_document_uploaded_at}
          originalDocumentUrl={originalPdfUrl || undefined}
          employeeName={`${definition.employee.first_name}_${definition.employee.last_name}`}
          onClose={() => {
            setShowDocumentViewer(false);
            if (originalPdfUrl) {
              URL.revokeObjectURL(originalPdfUrl);
              setOriginalPdfUrl(null);
            }
          }}
        />
      )}
    </div>
  );
}
