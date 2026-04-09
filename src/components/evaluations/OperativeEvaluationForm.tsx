import { useState, useEffect, useRef } from 'react';
import { Save, Download, Printer, Upload, CheckCircle, Eye, X, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../ui/Toast';
import { OperativeEvaluationPDFTemplate } from './OperativeEvaluationPDFTemplate';
import { generatePDF, downloadBlob } from '../../lib/pdfExport';
import { getCurrentTimestamp } from '../../lib/timezone';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FunctionalFactor {
  factor_number: number;
  job_function: string;
  expected_results: string;
}

interface Competency {
  competency_number: number;
  competency_description: string;
}

interface EvaluationPeriod {
  id: string;
  name: string;
  form_code: string;
  form_version: string;
  start_date: string;
  end_date: string;
}

interface OperativeEvaluationFormProps {
  editingEvaluationId?: string | null;
  onCancel?: () => void;
  periodId?: string;
}

type WorkflowStatus = 'draft' | 'pending_signature' | 'completed';

export function OperativeEvaluationForm({ editingEvaluationId, onCancel, periodId }: OperativeEvaluationFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const { employee, systemUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savedEvaluationId, setSavedEvaluationId] = useState<string | null>(editingEvaluationId || null);
  const [showPDFTemplate, setShowPDFTemplate] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('draft');
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);
  const [signedDocumentFilename, setSignedDocumentFilename] = useState<string | null>(null);
  const [signedDocumentMimeType, setSignedDocumentMimeType] = useState<string | null>(null);
  const [signedDocumentUploadedAt, setSignedDocumentUploadedAt] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSignedDocViewer, setShowSignedDocViewer] = useState(false);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const [formData, setFormData] = useState({
    department: '',
    sub_department: '',
    definition_date: '',
    manager_comments: '',
    employee_comments: ''
  });

  const [functionalFactors, setFunctionalFactors] = useState<FunctionalFactor[]>(
    Array.from({ length: 5 }, (_, i) => ({
      factor_number: i + 1,
      job_function: '',
      expected_results: ''
    }))
  );

  const [competencies, setCompetencies] = useState<Competency[]>(
    Array.from({ length: 5 }, (_, i) => ({
      competency_number: i + 1,
      competency_description: ''
    }))
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingEvaluationId) {
      loadExistingEvaluation(editingEvaluationId);
    }
  }, [editingEvaluationId]);

  useEffect(() => {
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      setSelectedEmployee(emp);
      if (emp) {
        setFormData(prev => ({
          ...prev,
          department: emp.department_name || '',
          sub_department: ''
        }));
      }
    }
  }, [selectedEmployeeId, employees]);

  const loadExistingEvaluation = async (evaluationId: string) => {
    try {
      const { data: evalData, error: evalError } = await supabase
        .from('operative_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (evalError) throw evalError;

      if (evalData) {
        setSelectedEmployeeId(evalData.employee_id);
        setFormData({
          department: evalData.department || '',
          sub_department: evalData.sub_department || '',
          definition_date: evalData.definition_date || '',
          manager_comments: evalData.manager_comments || '',
          employee_comments: evalData.employee_comments || ''
        });

        if (evalData.status === 'completed') setWorkflowStatus('completed');
        else if (evalData.signed_document_url) setWorkflowStatus('pending_signature');
        else setWorkflowStatus('draft');

        if (evalData.signed_document_url) {
          setSignedDocumentUrl(evalData.signed_document_url);
          setSignedDocumentFilename(evalData.signed_document_filename);
          setSignedDocumentMimeType(evalData.signed_document_mime_type);
          setSignedDocumentUploadedAt(evalData.signed_document_uploaded_at);
        }

        const { data: factorsData } = await supabase
          .from('evaluation_functional_factors')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .order('factor_number');

        if (factorsData && factorsData.length > 0) {
          setFunctionalFactors(factorsData.map(f => ({
            factor_number: f.factor_number,
            job_function: f.job_function || '',
            expected_results: f.expected_results || ''
          })));
        }

        const { data: competenciesData } = await supabase
          .from('operative_evaluation_competencies')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .order('competency_number');

        if (competenciesData && competenciesData.length > 0) {
          setCompetencies(competenciesData.map(c => ({
            competency_number: c.competency_number,
            competency_description: c.competency_description || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error loading existing evaluation:', error);
      setToast({ message: 'Error al cargar la evaluación', type: 'error' });
    }
  };

  const loadData = async () => {
    try {
      let periodQuery = supabase
        .from('evaluation_periods')
        .select('*')
        .eq('status', 'active')
        .eq('employee_type', 'operativo');

      if (periodId) {
        periodQuery = periodQuery.eq('id', periodId);
      } else {
        periodQuery = periodQuery.order('created_at', { ascending: true }).limit(1);
      }

      const { data: periodData } = await periodQuery.maybeSingle();

      if (periodData) {
        setPeriod(periodData);
      }

      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          position,
          employee_code,
          employee_type,
          hire_date,
          department_id,
          manager_id,
          departments (
            name
          )
        `)
        .eq('employee_type', 'operativo')
        .eq('status', 'active')
        .order('first_name');

      if (empError) {
        console.error('Error loading employees:', empError);
      }

      const formattedEmployees = (employeesData || []).map(emp => ({
        ...emp,
        department_name: emp.departments?.name || 'Sin departamento'
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFactorChange = (index: number, field: keyof FunctionalFactor, value: string) => {
    const newFactors = [...functionalFactors];
    newFactors[index] = { ...newFactors[index], [field]: value };
    setFunctionalFactors(newFactors);
  };

  const handleCompetencyChange = (index: number, value: string) => {
    const newCompetencies = [...competencies];
    newCompetencies[index] = { ...newCompetencies[index], competency_description: value };
    setCompetencies(newCompetencies);
  };

  const handleSave = async () => {
    if (!selectedEmployeeId || !period) {
      setToast({ message: 'Por favor seleccione un empleado', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const evaluationCode = !savedEvaluationId ?
        `OPE-${selectedEmployee?.employee_code?.replace(/-/g, '') || 'XXX'}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`
        : undefined;

      const evaluationData = {
        evaluation_period_id: period.id,
        employee_id: selectedEmployeeId,
        employee_position: selectedEmployee?.position,
        department: formData.department,
        sub_department: formData.sub_department,
        hire_date: selectedEmployee?.hire_date,
        manager_id: selectedEmployee?.manager_id,
        definition_date: formData.definition_date || null,
        manager_comments: formData.manager_comments,
        employee_comments: formData.employee_comments,
        status: 'draft',
        ...(evaluationCode && { evaluation_code: evaluationCode })
      };

      let evaluation;

      if (savedEvaluationId) {
        const { data, error: updateError } = await supabase
          .from('operative_evaluations')
          .update(evaluationData)
          .eq('id', savedEvaluationId)
          .select()
          .single();

        if (updateError) throw updateError;
        evaluation = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('operative_evaluations')
          .upsert(evaluationData, { onConflict: 'evaluation_period_id,employee_id' })
          .select()
          .single();

        if (insertError) throw insertError;
        evaluation = data;
      }

      for (const factor of functionalFactors) {
        await supabase
          .from('evaluation_functional_factors')
          .upsert({
            evaluation_id: evaluation.id,
            factor_number: factor.factor_number,
            job_function: factor.job_function,
            expected_results: factor.expected_results
          }, { onConflict: 'evaluation_id,factor_number' });
      }

      for (const comp of competencies) {
        await supabase
          .from('operative_evaluation_competencies')
          .upsert({
            evaluation_id: evaluation.id,
            competency_number: comp.competency_number,
            competency_description: comp.competency_description
          }, { onConflict: 'evaluation_id,competency_number' });
      }

      setSavedEvaluationId(evaluation.id);
      setToast({ message: 'Formulario guardado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setToast({ message: 'Error al guardar la evaluación', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const generateOriginalPdfUrl = async (): Promise<string | null> => {
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
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'letter');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output('blob');
      return URL.createObjectURL(pdfBlob);
    } catch (error) {
      return null;
    }
  };

  const handleSavePDF = async () => {
    if (!savedEvaluationId || !selectedEmployee || !period) {
      setToast({ message: 'Primero debe guardar la evaluación', type: 'error' });
      return;
    }

    setGeneratingPDF(true);
    setShowPDFTemplate(true);

    setTimeout(async () => {
      try {
        const blob = await generatePDF('pdf-content-operative', `evaluacion_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${Date.now()}.pdf`);

        if (blob) {
          const pdfUrl = URL.createObjectURL(blob);
          window.open(pdfUrl, '_blank');
          const fileName = `Evaluacion_Operativa_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
          downloadBlob(blob, fileName);
          setToast({ message: 'PDF generado exitosamente', type: 'success' });
        } else {
          setToast({ message: 'Error al generar el PDF', type: 'error' });
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        setToast({ message: 'Error al generar el PDF', type: 'error' });
      } finally {
        setShowPDFTemplate(false);
        setGeneratingPDF(false);
      }
    }, 100);
  };

  const handlePrint = () => {
    if (!savedEvaluationId || !selectedEmployee || !period) {
      setToast({ message: 'Primero debe guardar la evaluación', type: 'error' });
      return;
    }

    setShowPDFTemplate(true);

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      const pdfEl = document.getElementById('pdf-content-operative');
      if (printWindow && pdfEl) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Evaluación Operativa</title>
              <style>body { margin: 0; padding: 20px; } @media print { body { margin: 0; padding: 0; } }</style>
            </head>
            <body>${pdfEl.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          setShowPDFTemplate(false);
        }, 500);
      } else {
        window.print();
        setTimeout(() => setShowPDFTemplate(false), 500);
      }
    }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({ message: 'El archivo no puede ser mayor a 10MB', type: 'error' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Solo se permiten archivos PDF, JPG o PNG', type: 'error' });
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSignedDocument = async () => {
    if (!selectedFile || !savedEvaluationId) return;

    setUploadingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${savedEvaluationId}_${Date.now()}.${fileExt}`;
      const filePath = `operative/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('goal-signed-documents')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('goal-signed-documents')
        .getPublicUrl(filePath);

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('operative_evaluations')
        .update({
          signed_document_url: publicUrl,
          signed_document_filename: selectedFile.name,
          signed_document_mime_type: selectedFile.type,
          signed_document_uploaded_at: now,
          signed_document_uploaded_by: user.id
        })
        .eq('id', savedEvaluationId);

      if (updateError) throw updateError;

      setSignedDocumentUrl(publicUrl);
      setSignedDocumentFilename(selectedFile.name);
      setSignedDocumentMimeType(selectedFile.type);
      setSignedDocumentUploadedAt(now);
      setSelectedFile(null);
      setWorkflowStatus('pending_signature');
      setToast({ message: 'Documento firmado subido correctamente', type: 'success' });
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setToast({ message: err.message || 'Error al subir el documento', type: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFinalize = async () => {
    if (!savedEvaluationId || !signedDocumentUrl) {
      setToast({ message: 'Debe subir el documento firmado antes de finalizar', type: 'error' });
      return;
    }

    setCompleting(true);
    try {
      const { error } = await supabase
        .from('operative_evaluations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', savedEvaluationId);

      if (error) throw error;

      setWorkflowStatus('completed');
      setToast({ message: 'Evaluación finalizada y completada exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error finalizing evaluation:', error);
      setToast({ message: 'Error al finalizar la evaluación', type: 'error' });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  if (!period) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No hay períodos de evaluación activos para empleados operativos</p>
        </div>
      </div>
    );
  }

  const isReadOnly = workflowStatus === 'completed';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {workflowStatus === 'completed' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-lg">Evaluacion Completada</p>
            <p className="text-green-700 text-sm">Esta evaluación ha sido finalizada y firmada correctamente.</p>
          </div>
        </div>
      )}

      {workflowStatus === 'pending_signature' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
          <FileText className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-lg">Documento Firmado Cargado</p>
            <p className="text-amber-700 text-sm">El documento firmado ha sido subido. Presiona "Finalizar" para completar el proceso.</p>
          </div>
        </div>
      )}

      <div ref={formRef} className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg">
              <img src="/Profile-pic-plihsa-logo-foto.jpg" alt="PLIHSA" className="h-12" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Definición de Factores y Revisión del Desempeño Operativo</h1>
              <p className="text-blue-100 mt-1">Código: {period.form_code} | Versión: {period.form_version}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Colaborador *</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={isReadOnly || !!editingEvaluationId}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              >
                <option value="">Seleccione un colaborador</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Posición del Colaborador</label>
              <input
                type="text"
                value={selectedEmployee?.position || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Departamento</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sub-departamento</label>
              <input
                type="text"
                value={formData.sub_department}
                onChange={(e) => setFormData({ ...formData, sub_department: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Ingreso</label>
              <input
                type="date"
                value={selectedEmployee?.hire_date || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de definición de factores a evaluar</label>
              <input
                type="date"
                value={formData.definition_date}
                onChange={(e) => setFormData({ ...formData, definition_date: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-4">
              <h2 className="text-lg font-bold">DEFINICIÓN DE FACTORES FUNCIONALES</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">No.</th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">Funciones del Puesto</th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">Resultados Esperados</th>
                  </tr>
                </thead>
                <tbody>
                  {functionalFactors.map((factor, index) => (
                    <tr key={factor.factor_number}>
                      <td className="border border-slate-300 px-4 py-3 text-center font-medium">{factor.factor_number}</td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={factor.job_function}
                          onChange={(e) => handleFactorChange(index, 'job_function', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent"
                          rows={3}
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={factor.expected_results}
                          onChange={(e) => handleFactorChange(index, 'expected_results', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent"
                          rows={3}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-4">
              <h2 className="text-lg font-bold">DEFINICIÓN DE COMPETENCIAS CONDUCTUALES Y HABILIDADES TÉCNICAS</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">No.</th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700">Conductas y Habilidades Técnicas (Definir las 5 Principales)</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((comp, index) => (
                    <tr key={comp.competency_number}>
                      <td className="border border-slate-300 px-4 py-3 text-center font-medium">{comp.competency_number}</td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={comp.competency_description}
                          onChange={(e) => handleCompetencyChange(index, e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent"
                          rows={2}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Comentarios Jefe Inmediato</label>
              <textarea
                value={formData.manager_comments}
                onChange={(e) => setFormData({ ...formData, manager_comments: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-slate-50"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Comentarios del Colaborador</label>
              <textarea
                value={formData.employee_comments}
                onChange={(e) => setFormData({ ...formData, employee_comments: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-slate-50"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={handleSavePDF}
              disabled={!savedEvaluationId || generatingPDF}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {generatingPDF ? 'Generando...' : 'Guardar PDF'}
            </button>
            <button
              onClick={handlePrint}
              disabled={!savedEvaluationId}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={saving || !selectedEmployeeId}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {savedEvaluationId && !isReadOnly && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Paso Final: Subir Documento Firmado
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            Imprime el PDF, fírmalo a puño y letra, luego escanéalo o tómale una foto y sube el archivo aquí para finalizar.
          </p>

          {signedDocumentUrl && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">{signedDocumentFilename || 'Documento subido'}</p>
                  {signedDocumentUploadedAt && (
                    <p className="text-xs text-green-600">
                      Subido el {new Date(signedDocumentUploadedAt).toLocaleString('es-HN')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  const pdfUrl = await generateOriginalPdfUrl();
                  setOriginalPdfUrl(pdfUrl);
                  setShowSignedDocViewer(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Ver Documentos
              </button>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition mb-5">
            <input
              type="file"
              id="signed-doc-upload-operative"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="signed-doc-upload-operative" className="cursor-pointer flex flex-col items-center gap-3">
              {selectedFile ? (
                <>
                  <FileText className="w-10 h-10 text-blue-600" />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Eliminar archivo
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-400" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium">Haz clic para seleccionar el documento firmado</p>
                    <p className="text-slate-500 mt-1">PDF, JPG o PNG (máximo 10MB)</p>
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="flex gap-3">
            {selectedFile && (
              <button
                onClick={handleUploadSignedDocument}
                disabled={uploadingDoc}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingDoc ? 'Subiendo...' : 'Subir Documento'}
              </button>
            )}

            {signedDocumentUrl && (
              <button
                onClick={handleFinalize}
                disabled={completing}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {completing ? 'Finalizando...' : 'Finalizar Evaluacion'}
              </button>
            )}
          </div>
        </div>
      )}

      {workflowStatus === 'completed' && signedDocumentUrl && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Documentos de la Evaluacion
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">{signedDocumentFilename || 'Documento firmado'}</p>
                {signedDocumentUploadedAt && (
                  <p className="text-xs text-green-600">
                    Subido el {new Date(signedDocumentUploadedAt).toLocaleString('es-HN')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                const pdfUrl = await generateOriginalPdfUrl();
                setOriginalPdfUrl(pdfUrl);
                setShowSignedDocViewer(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Ver Documentos
            </button>
          </div>
        </div>
      )}

      {showSignedDocViewer && signedDocumentUrl && (
        <SignedDocViewerModal
          documentUrl={signedDocumentUrl}
          filename={signedDocumentFilename || 'documento_firmado'}
          mimeType={signedDocumentMimeType || 'application/pdf'}
          uploadedAt={signedDocumentUploadedAt || undefined}
          originalDocumentUrl={originalPdfUrl || undefined}
          onClose={() => {
            setShowSignedDocViewer(false);
            if (originalPdfUrl) {
              URL.revokeObjectURL(originalPdfUrl);
              setOriginalPdfUrl(null);
            }
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showPDFTemplate && selectedEmployee && period && (
        <div className="fixed top-[-9999px] left-[-9999px]">
          <OperativeEvaluationPDFTemplate
            id="pdf-content-operative"
            employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
            position={selectedEmployee.position || ''}
            department={formData.department}
            subDepartment={formData.sub_department}
            hireDate={selectedEmployee.hire_date}
            definitionDate={formData.definition_date}
            periodName={period.name}
            formCode={period.form_code}
            formVersion={period.form_version}
            functionalFactors={functionalFactors}
            competencies={competencies}
            managerComments={formData.manager_comments}
            employeeComments={formData.employee_comments}
            createdAt={getCurrentTimestamp()}
          />
        </div>
      )}
    </div>
  );
}

function SignedDocViewerModal({
  documentUrl,
  filename,
  mimeType,
  uploadedAt,
  originalDocumentUrl,
  onClose
}: {
  documentUrl: string;
  filename: string;
  mimeType: string;
  uploadedAt?: string;
  originalDocumentUrl?: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'both' | 'original' | 'signed'>(originalDocumentUrl ? 'both' : 'signed');
  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.includes('image');

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Visualizador de Documentos</h2>
              <p className="text-sm text-green-100">{filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {originalDocumentUrl && (
              <button
                onClick={() => {
                  handleDownload(documentUrl, `Firmado_${filename}`);
                  setTimeout(() => {
                    if (originalDocumentUrl) handleDownload(originalDocumentUrl, `Original_${filename}`);
                  }, 500);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar Ambos
              </button>
            )}
            <button
              onClick={() => handleDownload(documentUrl, filename)}
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

        {uploadedAt && (
          <div className="px-6 py-2 bg-green-50 border-b border-green-200 text-sm text-green-800">
            <span className="font-medium">Fecha de subida:</span>{' '}
            {new Date(uploadedAt).toLocaleString('es-HN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {originalDocumentUrl && (
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-2">
              {(['both', 'original', 'signed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                    activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {tab === 'both' ? 'Ver Ambos' : tab === 'original' ? 'Original' : 'Firmado'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
          {activeTab === 'both' && originalDocumentUrl && (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Original</h3>
                <iframe src={originalDocumentUrl} className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white" title="Original" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 px-2">Documento Firmado</h3>
                {isPDF ? (
                  <iframe src={documentUrl} className="flex-1 w-full rounded-lg border-2 border-slate-300 bg-white" title="Firmado" />
                ) : isImage ? (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-slate-300">
                    <img src={documentUrl} alt="Firmado" className="max-w-full max-h-full rounded-lg" />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === 'original' && originalDocumentUrl && (
            <iframe src={originalDocumentUrl} className="w-full h-full rounded-lg border-2 border-slate-300 bg-white" title="Original" />
          )}

          {(activeTab === 'signed' || !originalDocumentUrl) && (
            isPDF ? (
              <iframe src={documentUrl} className="w-full h-full rounded-lg border-2 border-slate-300 bg-white" title="Firmado" />
            ) : isImage ? (
              <div className="flex items-center justify-center h-full">
                <img src={documentUrl} alt="Firmado" className="max-w-full max-h-full rounded-lg shadow-lg border-2 border-slate-300" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white rounded-lg p-8 shadow-md">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 mb-4">No se puede previsualizar este tipo de archivo</p>
                  <button onClick={() => handleDownload(documentUrl, filename)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium mx-auto">
                    <Download className="w-5 h-5" />
                    Descargar
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Tipo: {mimeType.includes('pdf') ? 'PDF' : 'Imagen'}</span>
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
