import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Printer, CreditCard as Edit2, X, ArrowLeft, Download, FileText, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
    goal_number: number;
    goal_description: string;
    measurement_and_expected_results: string;
  }>;
  operative_safety_standards: Array<{
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
  const formRef = useRef<HTMLDivElement>(null);
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
        number: i + 1,
        description: existing?.standard_description || ''
      };
    })
  );

  const [managerComments, setManagerComments] = useState(definition.manager_comments || '');
  const [employeeComments, setEmployeeComments] = useState(definition.employee_comments || '');
  const [definitionDate, setDefinitionDate] = useState(definition.definition_date);

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
          manager_comments: managerComments
        })
        .eq('id', definition.id);

      if (updateError) throw updateError;

      await supabase.from('operative_individual_goals').delete().eq('goal_definition_id', definition.id);
      const goalsToInsert = functionalFactors
        .filter(f => f.jobFunction.trim())
        .map(f => ({
          goal_definition_id: definition.id,
          goal_number: f.number,
          goal_description: f.jobFunction,
          measurement_and_expected_results: f.expectedResults
        }));
      if (goalsToInsert.length > 0) {
        const { error } = await supabase.from('operative_individual_goals').insert(goalsToInsert);
        if (error) throw error;
      }

      await supabase.from('operative_safety_standards').delete().eq('goal_definition_id', definition.id);
      const standardsToInsert = behavioralCompetencies
        .filter(c => c.description.trim())
        .map(c => ({
          goal_definition_id: definition.id,
          standard_number: c.number,
          standard_description: c.description
        }));
      if (standardsToInsert.length > 0) {
        const { error } = await supabase.from('operative_safety_standards').insert(standardsToInsert);
        if (error) throw error;
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

  const generatePdfUrl = async (): Promise<string | null> => {
    if (!formRef.current) return null;
    try {
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

      const imgWidth = 215.9;
      const pageHeight = 279.4;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'letter');

      if (imgHeight <= pageHeight) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let position = 0;
        let remainingHeight = imgHeight;
        let firstPage = true;

        while (remainingHeight > 0) {
          if (!firstPage) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -position, imgWidth, imgHeight);
          position += pageHeight;
          remainingHeight -= pageHeight;
          firstPage = false;
        }
      }

      const pdfBlob = pdf.output('blob');
      return URL.createObjectURL(pdfBlob);
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const pdfUrl = await generatePdfUrl();
      if (!pdfUrl) throw new Error('No se pudo generar el PDF');

      const fileName = `Definicion_Factores_Operativo_${definition.employee.first_name}_${definition.employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al generar el PDF' });
    } finally {
      setLoading(false);
    }
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
                <button onClick={() => setMode('edit')} className="p-2 hover:bg-orange-600 rounded-lg transition" title="Editar">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={handleDownloadPDF} disabled={loading} className="p-2 hover:bg-orange-600 rounded-lg transition disabled:opacity-50" title="Descargar PDF">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={handlePrint} disabled={loading} className="p-2 hover:bg-orange-600 rounded-lg transition disabled:opacity-50" title="Imprimir">
                  <Printer className="w-5 h-5" />
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
              onPrint={handlePrint}
              onDownloadPDF={handleDownloadPDF}
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 print-content" ref={formRef}>
            <div className="grid grid-cols-12 border-b-2 border-slate-300">
              <div className="col-span-3 border-r-2 border-slate-300 p-4 flex items-center justify-center bg-white">
                <img src="https://i.imgur.com/hii0TM1.png" alt="PLIHSA Logo" className="w-full h-auto max-w-[180px]" crossOrigin="anonymous" />
              </div>
              <div className="col-span-6 border-r-2 border-slate-300 p-4 flex items-center justify-center bg-white">
                <h1 className="text-base font-bold text-center text-slate-800">
                  Definicion de Factores y Revision del Desempeno Operativo
                </h1>
              </div>
              <div className="col-span-3 bg-white">
                <div className="text-xs border-b border-slate-300 px-3 py-1.5"><span className="font-normal">Codigo: PL-RH-P-002-F04</span></div>
                <div className="text-xs border-b border-slate-300 px-3 py-1.5"><span className="font-normal">Version: 01</span></div>
                <div className="text-xs px-3 py-1.5"><span className="font-normal">Fecha de Revision: 09/07/2025</span></div>
              </div>
            </div>

            <div className="p-0">
              <div className="grid grid-cols-12">
                <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Nombre del Colaborador:</div>
                <div className="col-span-12 bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                  {definition.employee.first_name} {definition.employee.last_name}
                </div>
              </div>

              <div className="grid grid-cols-12">
                <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Posicion del Colaborador:</div>
                <div className="col-span-12 bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">{definition.employee.position}</div>
              </div>

              <div className="grid grid-cols-2">
                <div className="col-span-1 border-r-2 border-slate-300">
                  <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Departamento:</div>
                  <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">{definition.employee.department?.name || 'N/A'}</div>
                </div>
                <div className="col-span-1">
                  <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Sub-departamento:</div>
                  <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">{definition.employee.sub_department?.name || ''}</div>
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div className="col-span-1 border-r-2 border-slate-300">
                  <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Fecha de Ingreso:</div>
                  <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                    {new Date(definition.employee.hire_date + 'T00:00:00').toLocaleDateString('es-HN')}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Fecha de definicion de factores a evaluar:</div>
                  <div className="bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                    {mode === 'edit' ? (
                      <input
                        type="date"
                        value={definitionDate}
                        onChange={(e) => setDefinitionDate(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-sm"
                      />
                    ) : (
                      new Date(definitionDate + 'T00:00:00').toLocaleDateString('es-HN')
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12">
                <div className="col-span-12 bg-[#1e5a96] text-white px-4 py-2 font-bold text-sm border-b-2 border-slate-300">Jefe Inmediato:</div>
                <div className="col-span-12 bg-slate-100 px-4 py-2 text-sm border-b-2 border-slate-300">
                  {definition.employee.manager
                    ? `${definition.employee.manager.first_name} ${definition.employee.manager.last_name}`
                    : 'N/A'}
                </div>
              </div>

              <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-t-2 border-slate-300">
                DEFINICION DE FACTORES FUNCIONALES
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1e5a96] text-white">
                    <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center w-16">No.</th>
                    <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">Funciones del Puesto</th>
                    <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">Resultados Esperados</th>
                  </tr>
                </thead>
                <tbody>
                  {functionalFactors.map((factor, index) => (
                    <tr key={factor.number}>
                      <td className="border-2 border-slate-300 px-3 py-3 text-center font-semibold text-sm bg-white">{factor.number}</td>
                      <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                        {mode === 'edit' ? (
                          <textarea
                            value={factor.jobFunction}
                            onChange={(e) => handleFunctionalFactorChange(index, 'jobFunction', e.target.value)}
                            className="w-full bg-transparent border-0 outline-none resize-none text-sm min-h-[60px]"
                          />
                        ) : (
                          <div className="min-h-[60px] text-sm whitespace-pre-wrap">{factor.jobFunction || ''}</div>
                        )}
                      </td>
                      <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                        {mode === 'edit' ? (
                          <textarea
                            value={factor.expectedResults}
                            onChange={(e) => handleFunctionalFactorChange(index, 'expectedResults', e.target.value)}
                            className="w-full bg-transparent border-0 outline-none resize-none text-sm min-h-[60px]"
                          />
                        ) : (
                          <div className="min-h-[60px] text-sm whitespace-pre-wrap">{factor.expectedResults || ''}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-[#1e5a96] text-white px-4 py-2.5 font-bold text-sm text-center border-b-2 border-t-2 border-slate-300">
                DEFINICION DE COMPETENCIAS CONDUCTUALES Y HABILIDADES TECNICAS
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1e5a96] text-white">
                    <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center w-16">No.</th>
                    <th className="border-2 border-slate-300 px-3 py-2 text-sm font-bold text-center">
                      Conductas y Habilidades Tecnicas (Definir las 5 Principales)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {behavioralCompetencies.map((competency, index) => (
                    <tr key={competency.number}>
                      <td className="border-2 border-slate-300 px-3 py-3 text-center font-semibold text-sm bg-white">{competency.number}</td>
                      <td className="border-2 border-slate-300 px-3 py-2 bg-white">
                        {mode === 'edit' ? (
                          <textarea
                            value={competency.description}
                            onChange={(e) => handleCompetencyChange(index, e.target.value)}
                            className="w-full bg-transparent border-0 outline-none resize-none text-sm min-h-[60px]"
                          />
                        ) : (
                          <div className="min-h-[60px] text-sm whitespace-pre-wrap">{competency.description || ''}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-2 border-slate-300 mt-4">
                <div className="bg-[#2c5282] text-white px-4 py-3 font-bold text-sm">Comentarios Jefe Inmediato</div>
                <div className="bg-white px-4 py-3">
                  {mode === 'edit' ? (
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm min-h-[80px]"
                    />
                  ) : (
                    <div className="min-h-[80px] text-sm whitespace-pre-wrap">{managerComments || ''}</div>
                  )}
                </div>
              </div>

              <div className="border-2 border-slate-300 mt-4">
                <div className="bg-[#2c5282] text-white px-4 py-3 font-bold text-sm">Comentarios del Colaborador</div>
                <div className="bg-white px-4 py-3">
                  {mode === 'edit' ? (
                    <textarea
                      value={employeeComments}
                      onChange={(e) => setEmployeeComments(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm min-h-[80px]"
                    />
                  ) : (
                    <div className="min-h-[80px] text-sm whitespace-pre-wrap">{employeeComments || ''}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-32 px-12 py-8 mt-8">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-16">
                    <p className="text-sm font-semibold text-slate-800">Firma Colaborador</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-2 mt-16">
                    <p className="text-sm font-semibold text-slate-800">Firma Jefe Inmediato</p>
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
