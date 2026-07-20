import { useState, useEffect, useRef } from 'react';
import { Save, Download, Printer, Upload, CheckCircle, Eye, X, FileText, Target, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { buildStoragePath, storagePathToProxyUrl, BUCKET } from '../../lib/storagePaths';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../ui/Toast';
import { FinalAdministrativeEvaluationPDFTemplate } from './FinalAdministrativeEvaluationPDFTemplate';
import { generatePDF, downloadBlob } from '../../lib/pdfExport';
import { getCurrentTimestamp } from '../../lib/timezone';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IndividualGoal {
  goal_number: number;
  goal_description: string;
  numeric_score: string;
  measurement_results: string;
  manager_comments: string;
  employee_comments: string;
}

interface Competency {
  competency_number: number;
  competency_description: string;
  numeric_score: string;
  manager_comments: string;
  employee_comments: string;
}

interface EvaluationPeriod {
  id: string;
  name: string;
  form_code: string;
  form_version: string;
  start_date: string;
  end_date: string;
}

interface FinalAdministrativeEvaluationFormProps {
  editingEvaluationId?: string | null;
  onCancel?: () => void;
  periodId?: string;
}

type WorkflowStatus = 'draft' | 'pending_signature' | 'completed';

const SCORE_OPTIONS = [
  { value: '', label: 'Sin calificar' },
  { value: '10', label: '10 - Excede' },
  { value: '9', label: '9 - Cumple' },
  { value: '8', label: '8 - Cumple' },
  { value: '7', label: '7 - A Mejorar' },
  { value: '6', label: '6 - A Mejorar' },
  { value: '5', label: '5 - Debajo' },
  { value: '4', label: '4 - Debajo' },
  { value: '3', label: '3 - Debajo' },
  { value: '2', label: '2 - Debajo' },
  { value: '1', label: '1 - Debajo' },
];

export function FinalAdministrativeEvaluationForm({ editingEvaluationId, onCancel, periodId }: FinalAdministrativeEvaluationFormProps) {
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
    evaluation_date: new Date().toISOString().split('T')[0],
    time_in_position: '',
    manager_name: '',
    manager_comments: '',
    employee_comments: '',
    overall_comments: ''
  });

  const [individualGoals, setIndividualGoals] = useState<IndividualGoal[]>(
    Array.from({ length: 4 }, (_, i) => ({
      goal_number: i + 1,
      goal_description: '',
      numeric_score: '',
      measurement_results: '',
      manager_comments: '',
      employee_comments: ''
    }))
  );

  const [competencies, setCompetencies] = useState<Competency[]>(
    Array.from({ length: 5 }, (_, i) => ({
      competency_number: i + 1,
      competency_description: '',
      numeric_score: '',
      manager_comments: '',
      employee_comments: ''
    }))
  );

  useEffect(() => {
    loadData();
  }, [systemUser?.role, employee?.id]);

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
          manager_name: emp.manager_name || ''
        }));
      }
    }
  }, [selectedEmployeeId, employees]);

  const loadExistingEvaluation = async (evaluationId: string) => {
    try {
      const { data: evalData, error: evalError } = await supabase
        .from('final_administrative_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single();

      if (evalError) throw evalError;

      if (evalData) {
        setSelectedEmployeeId(evalData.employee_id);
        setFormData({
          department: evalData.department || '',
          sub_department: evalData.sub_department || '',
          evaluation_date: evalData.evaluation_date || new Date().toISOString().split('T')[0],
          time_in_position: evalData.time_in_position || '',
          manager_name: evalData.manager_name || '',
          manager_comments: evalData.manager_comments || '',
          employee_comments: evalData.employee_comments || '',
          overall_comments: evalData.overall_comments || ''
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

        const { data: goalsData } = await supabase
          .from('final_evaluation_individual_goals')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .order('goal_number');

        if (goalsData && goalsData.length > 0) {
          setIndividualGoals(goalsData.map(g => ({
            goal_number: g.goal_number,
            goal_description: g.goal_description || '',
            numeric_score: g.numeric_score != null ? String(g.numeric_score) : '',
            measurement_results: g.measurement_results || '',
            manager_comments: g.manager_comments || '',
            employee_comments: g.employee_comments || ''
          })));
        }

        const { data: compsData } = await supabase
          .from('final_evaluation_competencies')
          .select('*')
          .eq('evaluation_id', evaluationId)
          .order('competency_number');

        if (compsData && compsData.length > 0) {
          setCompetencies(compsData.map(c => ({
            competency_number: c.competency_number,
            competency_description: c.competency_description || '',
            numeric_score: c.numeric_score != null ? String(c.numeric_score) : '',
            manager_comments: c.manager_comments || '',
            employee_comments: c.employee_comments || ''
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
        .eq('employee_type', 'administrativo');

      if (periodId) {
        periodQuery = periodQuery.eq('id', periodId);
      } else {
        periodQuery = periodQuery.order('created_at', { ascending: true }).limit(1);
      }

      const { data: periodData } = await periodQuery.maybeSingle();

      if (periodData) {
        setPeriod(periodData);
      }

      let empQuery = supabase
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
        .eq('employee_type', 'administrativo')
        .eq('status', 'active')
        .order('first_name');

      if (systemUser?.role === 'jefe' && employee?.id) {
        empQuery = empQuery.eq('manager_id', employee.id);
      }

      const { data: employeesData, error: empError } = await empQuery;

      if (empError) {
        console.error('Error loading employees:', empError);
      }

      const managerIds = (employeesData || [])
        .map(e => e.manager_id)
        .filter((id): id is string => Boolean(id));

      let managersMap: Record<string, string> = {};
      if (managerIds.length > 0) {
        const uniqueManagerIds = [...new Set(managerIds)];
        const { data: managersData } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .in('id', uniqueManagerIds);
        managersMap = (managersData || []).reduce((acc, m) => {
          acc[m.id] = `${m.first_name} ${m.last_name}`;
          return acc;
        }, {} as Record<string, string>);
      }

      const formattedEmployees = (employeesData || []).map(emp => ({
        ...emp,
        department_name: emp.departments?.name || 'Sin departamento',
        manager_name: emp.manager_id ? (managersMap[emp.manager_id] || '') : ''
      }));

      setEmployees(formattedEmployees);

      if (!editingEvaluationId && employee?.id) {
        const selfInList = formattedEmployees.find(emp => emp.id === employee.id);
        if (selfInList) {
          setSelectedEmployeeId(employee.id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalChange = (index: number, field: keyof IndividualGoal, value: string) => {
    const newGoals = [...individualGoals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setIndividualGoals(newGoals);
  };

  const handleCompetencyChange = (index: number, field: keyof Competency, value: string) => {
    const newComps = [...competencies];
    newComps[index] = { ...newComps[index], [field]: value };
    setCompetencies(newComps);
  };

  const calculateGoalsAverage = () => {
    const scored = individualGoals.filter(g => g.numeric_score !== '');
    if (scored.length === 0) return 0;
    const sum = scored.reduce((acc, g) => acc + parseFloat(g.numeric_score), 0);
    return sum / scored.length;
  };

  const calculateCompetenciesAverage = () => {
    const scored = competencies.filter(c => c.numeric_score !== '');
    if (scored.length === 0) return 0;
    const sum = scored.reduce((acc, c) => acc + parseFloat(c.numeric_score), 0);
    return sum / scored.length;
  };

  const calculateFinalScore = () => {
    const goalsAvg = calculateGoalsAverage();
    const compsAvg = calculateCompetenciesAverage();
    const goalsScored = individualGoals.filter(g => g.numeric_score !== '').length > 0;
    const compsScored = competencies.filter(c => c.numeric_score !== '').length > 0;
    if (!goalsScored && !compsScored) return 0;
    if (!goalsScored) return compsAvg;
    if (!compsScored) return goalsAvg;
    return (goalsAvg * 0.6) + (compsAvg * 0.4);
  };

  const getScoreColor = (score: number) => {
    if (score >= 10) return 'text-green-600';
    if (score >= 8) return 'text-blue-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 10) return 'Excede';
    if (score >= 8) return 'Cumple';
    if (score >= 6) return 'A Mejorar';
    return 'Debajo';
  };

  const handleSave = async () => {
    if (!selectedEmployeeId || !period) {
      setToast({ message: 'Por favor seleccione un empleado', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const evaluationCode = !savedEvaluationId ?
        `FIN-${selectedEmployee?.employee_code?.replace(/-/g, '') || 'XXX'}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`
        : undefined;

      const evaluationData: any = {
        evaluation_period_id: period.id,
        employee_id: selectedEmployeeId,
        employee_position: selectedEmployee?.position,
        department: formData.department,
        sub_department: formData.sub_department,
        hire_date: selectedEmployee?.hire_date,
        evaluation_date: formData.evaluation_date || null,
        manager_id: selectedEmployee?.manager_id,
        time_in_position: formData.time_in_position || null,
        manager_name: formData.manager_name,
        manager_comments: formData.manager_comments,
        employee_comments: formData.employee_comments,
        overall_comments: formData.overall_comments,
        status: 'draft',
        ...(evaluationCode && { evaluation_code: evaluationCode })
      };

      let evaluation;

      if (savedEvaluationId) {
        const { data, error: updateError } = await supabase
          .from('final_administrative_evaluations')
          .update(evaluationData)
          .eq('id', savedEvaluationId)
          .select()
          .single();

        if (updateError) throw updateError;
        evaluation = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('final_administrative_evaluations')
          .upsert(evaluationData, { onConflict: 'evaluation_period_id,employee_id' })
          .select()
          .single();

        if (insertError) throw insertError;
        evaluation = data;
      }

      for (const goal of individualGoals) {
        await supabase
          .from('final_evaluation_individual_goals')
          .upsert({
            evaluation_id: evaluation.id,
            goal_number: goal.goal_number,
            goal_description: goal.goal_description,
            numeric_score: goal.numeric_score ? parseFloat(goal.numeric_score) : null,
            measurement_results: goal.measurement_results,
            manager_comments: goal.manager_comments,
            employee_comments: goal.employee_comments
          }, { onConflict: 'evaluation_id,goal_number' });
      }

      for (const comp of competencies) {
        await supabase
          .from('final_evaluation_competencies')
          .upsert({
            evaluation_id: evaluation.id,
            competency_number: comp.competency_number,
            competency_description: comp.competency_description,
            numeric_score: comp.numeric_score ? parseFloat(comp.numeric_score) : null,
            manager_comments: comp.manager_comments,
            employee_comments: comp.employee_comments
          }, { onConflict: 'evaluation_id,competency_number' });
      }

      setSavedEvaluationId(evaluation.id);

      if (systemUser?.id) {
        await supabase.from('evaluation_audit_logs').insert({
          action_type: savedEvaluationId ? 'updated' : 'created',
          evaluation_type: 'final_administrativa',
          evaluation_id: evaluation.id,
          evaluator_system_user_id: systemUser.id,
          evaluator_employee_id: employee?.id || null,
          evaluated_employee_id: selectedEmployeeId,
        });
      }

      setToast({ message: 'Evaluación guardada correctamente', type: 'success' });
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
        const blob = await generatePDF('pdf-content-final-admin', `evaluacion_final_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${Date.now()}.pdf`);

        if (blob) {
          const pdfUrl = URL.createObjectURL(blob);
          window.open(pdfUrl, '_blank');
          const fileName = `Evaluacion_Final_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
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
      const pdfEl = document.getElementById('pdf-content-final-admin');
      if (printWindow && pdfEl) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Evaluación Final Administrativa</title>
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

      const fileExt = selectedFile.name.split('.').pop() || 'pdf';
      const year = period ? new Date(period.start_date).getFullYear() : new Date().getFullYear();

      let filePath: string;
      if (selectedEmployee?.employee_code && selectedEmployee?.last_name) {
        filePath = buildStoragePath({
          docKind: 'evaluacion' as any,
          empType: 'administrativo',
          year,
          employee: { employee_code: selectedEmployee.employee_code, last_name: selectedEmployee.last_name },
          fileExt
        });
        const docSlug = 'evaluacion_final';
        filePath = filePath.replace('evaluacion', 'evaluacion-final');
      } else {
        filePath = `PLIHSA/evaluacion-final/administrativo/${year}/${savedEvaluationId}.${fileExt}`;
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const proxyUrl = storagePathToProxyUrl(filePath);

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('final_administrative_evaluations')
        .update({
          signed_document_url: proxyUrl,
          signed_document_filename: selectedFile.name,
          signed_document_mime_type: selectedFile.type,
          signed_document_uploaded_at: now,
          signed_document_uploaded_by: user.id
        })
        .eq('id', savedEvaluationId);

      if (updateError) throw updateError;

      setSignedDocumentUrl(proxyUrl);
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
        .from('final_administrative_evaluations')
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
          <p className="text-yellow-800">No hay períodos de evaluación activos para empleados administrativos</p>
        </div>
      </div>
    );
  }

  const isReadOnly = workflowStatus === 'completed';
  const goalsAvg = calculateGoalsAverage();
  const compsAvg = calculateCompetenciesAverage();
  const finalScore = calculateFinalScore();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {workflowStatus === 'completed' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-lg">Evaluación Completada</p>
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
              <h1 className="text-2xl font-bold">Evaluación Final del Desempeño Administrativo</h1>
              <p className="text-blue-100 mt-1">Código: {period.form_code || 'PL-RH-P-002-F02'} | Versión: {period.form_version || '01'}</p>
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
                    {emp.first_name} {emp.last_name} - {emp.position}{emp.id === employee?.id ? ' (Yo)' : ''}
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Ingreso (Antigüedad)</label>
              <input
                type="date"
                value={selectedEmployee?.hire_date || ''}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tiempo en la Posición</label>
              <input
                type="text"
                value={formData.time_in_position}
                onChange={(e) => setFormData({ ...formData, time_in_position: e.target.value })}
                disabled={isReadOnly}
                placeholder="Ej: 2 años, 6 meses"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Jefe Inmediato</label>
              <input
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Evaluación</label>
              <input
                type="date"
                value={formData.evaluation_date}
                onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">ESCALA DE CALIFICACIÓN</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-xl font-bold text-green-600">10</p>
                <p className="text-xs font-semibold text-slate-700">Excede</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-xl font-bold text-blue-600">8-9</p>
                <p className="text-xs font-semibold text-slate-700">Cumple</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-xl font-bold text-amber-600">6-7</p>
                <p className="text-xs font-semibold text-slate-700">A Mejorar</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-xl font-bold text-red-600">1-5</p>
                <p className="text-xs font-semibold text-slate-700">Debajo</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-1 flex items-center gap-2">
              <Target className="w-5 h-5" />
              <h2 className="text-lg font-bold">EVALUACIÓN DE METAS INDIVIDUALES (60%)</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">Califique cada meta del 1 al 10 según los resultados obtenidos durante el período.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700 w-10">No.</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700 w-32">Calificación</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700">Meta / Medición y Resultados</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700">Comentarios Jefe</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700">Comentarios Colaborador</th>
                  </tr>
                </thead>
                <tbody>
                  {individualGoals.map((goal, index) => (
                    <tr key={goal.goal_number}>
                      <td className="border border-slate-300 px-3 py-3 text-center font-medium">{goal.goal_number}</td>
                      <td className="border border-slate-300 p-2">
                        <select
                          value={goal.numeric_score}
                          onChange={(e) => handleGoalChange(index, 'numeric_score', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 text-sm"
                        >
                          {SCORE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={goal.goal_description}
                          onChange={(e) => handleGoalChange(index, 'goal_description', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Descripción de la meta..."
                          className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-transparent text-sm mb-2"
                          rows={2}
                        />
                        <textarea
                          value={goal.measurement_results}
                          onChange={(e) => handleGoalChange(index, 'measurement_results', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Medición y resultados obtenidos..."
                          className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-transparent text-sm"
                          rows={2}
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={goal.manager_comments}
                          onChange={(e) => handleGoalChange(index, 'manager_comments', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent text-sm"
                          rows={4}
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={goal.employee_comments}
                          onChange={(e) => handleGoalChange(index, 'employee_comments', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent text-sm"
                          rows={4}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-end gap-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Promedio Metas:</span>
              <span className={`text-2xl font-bold ${getScoreColor(goalsAvg)}`}>
                {goalsAvg > 0 ? goalsAvg.toFixed(2) : '--'}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-1 flex items-center gap-2">
              <Award className="w-5 h-5" />
              <h2 className="text-lg font-bold">EVALUACIÓN DE COMPETENCIAS CONDUCTUALES (40%)</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">Califique cada competencia del 1 al 10 según el desempeño observado.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700 w-10">No.</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700 w-32">Calificación</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700">Competencia</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700">Comentarios Jefe</th>
                    <th className="border border-slate-300 px-3 py-3 text-left text-sm font-semibold text-slate-700">Comentarios Colaborador</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((comp, index) => (
                    <tr key={comp.competency_number}>
                      <td className="border border-slate-300 px-3 py-3 text-center font-medium">{comp.competency_number}</td>
                      <td className="border border-slate-300 p-2">
                        <select
                          value={comp.numeric_score}
                          onChange={(e) => handleCompetencyChange(index, 'numeric_score', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 text-sm"
                        >
                          {SCORE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={comp.competency_description}
                          onChange={(e) => handleCompetencyChange(index, 'competency_description', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Descripción de la competencia..."
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent text-sm"
                          rows={3}
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={comp.manager_comments}
                          onChange={(e) => handleCompetencyChange(index, 'manager_comments', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent text-sm"
                          rows={3}
                        />
                      </td>
                      <td className="border border-slate-300 p-2">
                        <textarea
                          value={comp.employee_comments}
                          onChange={(e) => handleCompetencyChange(index, 'employee_comments', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 rounded resize-none disabled:bg-transparent text-sm"
                          rows={3}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-end gap-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Promedio Competencias:</span>
              <span className={`text-2xl font-bold ${getScoreColor(compsAvg)}`}>
                {compsAvg > 0 ? compsAvg.toFixed(2) : '--'}
              </span>
            </div>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">CALIFICACIÓN FINAL</h3>
                  <p className="text-sm text-slate-600">Metas (60%) + Competencias (40%)</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getScoreColor(finalScore)}`}>
                  {finalScore > 0 ? finalScore.toFixed(2) : '--'}
                </p>
                <p className={`text-sm font-semibold ${getScoreColor(finalScore)}`}>
                  {finalScore > 0 ? getScoreLabel(finalScore) : 'Pendiente'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Comentarios Generales del Jefe</label>
              <textarea
                value={formData.overall_comments}
                onChange={(e) => setFormData({ ...formData, overall_comments: e.target.value })}
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
              id="signed-doc-upload-final-admin"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="signed-doc-upload-final-admin" className="cursor-pointer flex flex-col items-center gap-3">
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
                {completing ? 'Finalizando...' : 'Finalizar Evaluación'}
              </button>
            )}
          </div>
        </div>
      )}

      {workflowStatus === 'completed' && signedDocumentUrl && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Documentos de la Evaluación
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
          <FinalAdministrativeEvaluationPDFTemplate
            id="pdf-content-final-admin"
            employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
            position={selectedEmployee.position || ''}
            department={formData.department}
            subDepartment={formData.sub_department}
            hireDate={selectedEmployee.hire_date}
            evaluationDate={formData.evaluation_date}
            timeInPosition={formData.time_in_position}
            managerName={formData.manager_name}
            periodName={period.name}
            formCode={period.form_code || 'PL-RH-P-002-F02'}
            formVersion={period.form_version || '01'}
            individualGoals={individualGoals}
            competencies={competencies}
            goalsAverage={goalsAvg}
            competenciesAverage={compsAvg}
            finalScore={finalScore}
            overallComments={formData.overall_comments}
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
