import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronLeft, Clock, Download, FileText, Save, Search, Upload, User } from 'lucide-react';
import { FinalEvaluationSignedUpload } from './FinalEvaluationSignedUpload';
import { supabase } from '../../lib/supabase';
import { generatePDF, downloadBlob } from '../../lib/pdfExport';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { calculateWorkSeniority } from '../../lib/seniority';

type Goal = {
  number: number;
  description: string;
  result: string;
  score: string;
  managerComments: string;
  employeeComments: string;
};

type Competency = {
  number: number;
  description: string;
  score: string;
};

type DevelopmentPlan = { number: number; need: string; action: string; period: string; followup: string };
type Signatures = { manager: string; managerDate: string; employee: string; employeeDate: string; hr: string; hrDate: string };

type EmployeeType = 'administrativo' | 'operativo';

interface FinalEvaluationFormProps {
  employeeType: EmployeeType;
  evaluationId?: string | null;
  onBack: () => void;
}

const scoreOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const createGoal = (number: number): Goal => ({ number, description: '', result: '', score: '', managerComments: '', employeeComments: '' });
const createCompetency = (number: number): Competency => ({ number, description: '', score: '' });
const createDevelopmentPlan = (number: number): DevelopmentPlan => ({ number, need: '', action: '', period: '', followup: '' });

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  employee_code: string;
  hire_date: string;
  department: { name: string } | null;
  sub_department: { name: string } | null;
  manager: { first_name: string; last_name: string } | null;
}

export function FinalEvaluationForm({ employeeType, evaluationId = null, onBack }: FinalEvaluationFormProps) {
  const { systemUser } = useAuth();
  const { activeCompany } = useCompany();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [manager, setManager] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [goals, setGoals] = useState<Goal[]>([1, 2, 3, 4, 5].map(createGoal));
  const [competencies, setCompetencies] = useState<Competency[]>([1, 2, 3, 4, 5].map(createCompetency));
  const [competencyManagerComments, setCompetencyManagerComments] = useState('');
  const [competencyEmployeeComments, setCompetencyEmployeeComments] = useState('');
  const [employeeSummary, setEmployeeSummary] = useState('');
  const [managerSummary, setManagerSummary] = useState('');
  const [developmentPlans, setDevelopmentPlans] = useState<DevelopmentPlan[]>([1, 2, 3].map(createDevelopmentPlan));
  const [signatures, setSignatures] = useState<Signatures>({ manager: '', managerDate: '', employee: '', employeeDate: '', hr: '', hrDate: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'pending_signature' | 'completed'>('draft');
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);
  const [signedDocumentFilename, setSignedDocumentFilename] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(evaluationId);

  useEffect(() => { loadEmployees(); }, [employeeType, activeCompany?.id, systemUser?.role]);

  useEffect(() => {
    if (!evaluationId || employees.length === 0) return;
    const loadExistingEvaluation = async () => {
      const table = employeeType === 'administrativo' ? 'final_administrative_evaluations' : 'operative_evaluations';
      const fields = employeeType === 'administrativo'
        ? 'employee_id, employee_position, department, sub_department, hire_date, evaluation_date, manager_name, employee_summary, manager_summary, development_need_1, development_action_1, development_period_1, development_followup_1, development_need_2, development_action_2, development_period_2, development_followup_2, development_need_3, development_action_3, development_period_3, development_followup_3, manager_signature, manager_signature_date, employee_signature, employee_signature_date, hr_signature, hr_signature_date, workflow_status, signed_document_url, signed_document_filename'
        : 'employee_id, employee_position, department, sub_department, hire_date, review_date, employee_summary, manager_summary, development_need_1, development_action_1, development_period_1, development_followup_1, development_need_2, development_action_2, development_period_2, development_followup_2, development_need_3, development_action_3, development_period_3, development_followup_3, manager_signature, manager_signature_date, employee_signature, employee_signature_date, hr_signature, hr_signature_date, workflow_status, signed_document_url, signed_document_filename';
      const { data, error } = await supabase.from(table).select(fields).eq('id', evaluationId).maybeSingle();
      if (error || !data) return;
      const existing = data as { employee_id: string; employee_position: string | null; department: string | null; sub_department: string | null; hire_date: string | null; evaluation_date?: string | null; review_date?: string | null; manager_name?: string | null; employee_summary?: string | null; manager_summary?: string | null; workflow_status?: string | null; signed_document_url?: string | null; signed_document_filename?: string | null; [key: string]: string | null | undefined };
      const employee = employees.find((item) => item.id === existing.employee_id);
      if (!employee) return;
      handleSelectEmployee(employee);
      setPosition(existing.employee_position || employee.position || '');
      setDepartment(existing.department || employee.department?.name || '');
      setSubDepartment(existing.sub_department || employee.sub_department?.name || '');
      setHireDate(existing.hire_date || employee.hire_date || '');
      setManager(existing.manager_name || (employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : ''));
      setEvaluationDate(existing.evaluation_date || existing.review_date || new Date().toISOString().slice(0, 10));
      setEmployeeSummary(existing.employee_summary || '');
      setManagerSummary(existing.manager_summary || '');
      setDevelopmentPlans([1, 2, 3].map((number) => ({ number, need: existing[`development_need_${number}`] || '', action: existing[`development_action_${number}`] || '', period: existing[`development_period_${number}`] || '', followup: existing[`development_followup_${number}`] || '' })));
      setSignatures({ manager: existing.manager_signature || '', managerDate: existing.manager_signature_date || '', employee: existing.employee_signature || '', employeeDate: existing.employee_signature_date || '', hr: existing.hr_signature || '', hrDate: existing.hr_signature_date || '' });
      setWorkflowStatus((existing.workflow_status as 'draft' | 'pending_signature' | 'completed') || 'draft');
      setSignedDocumentUrl(existing.signed_document_url || null);
      setSignedDocumentFilename(existing.signed_document_filename || null);

      if (employeeType === 'administrativo') {
        const { data: competencyData } = await supabase
          .from('final_evaluation_competencies')
          .select('competency_number, competency_description, numeric_score, manager_comments, employee_comments')
          .eq('evaluation_id', evaluationId)
          .order('competency_number');
        if (competencyData && competencyData.length > 0) {
          setCompetencies([1, 2, 3, 4, 5].map((number) => {
            const saved = competencyData.find((item: { competency_number: number }) => item.competency_number === number);
            return saved ? { number, description: saved.competency_description || '', score: saved.numeric_score ? String(saved.numeric_score) : '' } : createCompetency(number);
          }));
          setCompetencyManagerComments(competencyData.find((item: { manager_comments: string | null }) => item.manager_comments)?.manager_comments || '');
          setCompetencyEmployeeComments(competencyData.find((item: { employee_comments: string | null }) => item.employee_comments)?.employee_comments || '');
        }
      }
    };
    loadExistingEvaluation();
  }, [evaluationId, employeeType, employees.length]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      let query = supabase
        .from('employees')
        .select('id, first_name, last_name, position, employee_code, hire_date, department:departments(name), sub_department:sub_departments(name), manager:manager_id(first_name, last_name)')
        .eq('employee_type', employeeType)
        .eq('status', 'active')
        .order('first_name');

      if (activeCompany?.id) query = query.eq('company_id', activeCompany.id);

      if (systemUser?.role === 'jefe' && systemUser?.employee_id) {
        query = query.eq('manager_id', systemUser.employee_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEmployees((data || []) as unknown as EmployeeOption[]);
    } catch (err) {
      console.error('Error loading employees:', err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadDefinitionForEmployee = async (employeeId: string) => {
    try {
      const table = employeeType === 'administrativo' ? 'goal_definitions' : 'operative_goal_definitions';
      const goalsTable = employeeType === 'administrativo' ? 'individual_goals' : 'operative_individual_goals';

      const { data: defs } = await supabase
        .from(table)
        .select('id')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!defs || defs.length === 0) {
        setGoals([1, 2, 3, 4, 5].map(createGoal));
        return;
      }

      const defId = defs[0].id;
      const { data: goalsData } = await supabase
        .from(goalsTable)
        .select('goal_number, goal_description, measurement_and_expected_results')
        .eq('goal_definition_id', defId)
        .order('goal_number');

      if (goalsData && goalsData.length > 0) {
        setGoals([1, 2, 3, 4, 5].map((num) => {
          const found = goalsData.find((d: { goal_number: number }) => d.goal_number === num);
          return found ? { ...createGoal(num), description: found.goal_description || '' } : createGoal(num);
        }));
      } else {
        setGoals([1, 2, 3, 4, 5].map(createGoal));
      }
    } catch (err) {
      console.error('Error loading definition:', err);
    }
  };

  const handleSelectEmployee = (emp: EmployeeOption) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(`${emp.first_name} ${emp.last_name}`);
    setPosition(emp.position || '');
    setDepartment(emp.department?.name || '');
    setSubDepartment(emp.sub_department?.name || '');
    setHireDate(emp.hire_date || '');
    setManager(emp.manager ? `${emp.manager.first_name} ${emp.manager.last_name}` : '');
    setShowDropdown(false);
    loadDefinitionForEmployee(emp.id);
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    (emp.employee_code || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
    (emp.position || '').toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const scoredGoals = goals.filter((goal) => goal.score !== '');
  const totalScore = scoredGoals.reduce((sum, goal) => sum + Number(goal.score), 0);
  const averageScore = scoredGoals.length ? (totalScore / scoredGoals.length).toFixed(1) : '0';
  const scoredCompetencies = competencies.filter((competency) => competency.score !== '');
  const totalCompetencyScore = scoredCompetencies.reduce((sum, competency) => sum + Number(competency.score), 0);
  const averageCompetencyScore = scoredCompetencies.length ? (totalCompetencyScore / scoredCompetencies.length).toFixed(1) : '0';
  const finalPerformanceScore = ((Number(averageScore) * 0.6) + (Number(averageCompetencyScore) * 0.4)).toFixed(1);
  const tenure = useMemo(() => calculateWorkSeniority(hireDate), [hireDate]);

  const updateGoal = (index: number, key: keyof Goal, value: string) => {
    setGoals((current) => current.map((goal, goalIndex) => goalIndex === index ? { ...goal, [key]: value } : goal));
  };

  const updateCompetency = (index: number, key: keyof Competency, value: string) => {
    setCompetencies((current) => current.map((competency, competencyIndex) => competencyIndex === index ? { ...competency, [key]: value } : competency));
  };

  const updateDevelopmentPlan = (index: number, key: keyof Omit<DevelopmentPlan, 'number'>, value: string) => {
    setDevelopmentPlans((current) => current.map((plan, planIndex) => planIndex === index ? { ...plan, [key]: value } : plan));
  };

  const updateSignature = (key: keyof Signatures, value: string) => setSignatures((current) => ({ ...current, [key]: value }));

  const handleSaveDraft = async () => {
    if (!selectedEmployee) { setMessage('Debe seleccionar un colaborador antes de guardar.'); setMessageType('error'); return; }

    setGeneratingPdf(true);
    setMessage('Guardando evaluación y generando PDF...');
    setMessageType('success');

    try {
      const table = employeeType === 'administrativo' ? 'final_administrative_evaluations' : 'operative_evaluations';
      const { data: period, error: periodError } = await supabase
        .from('evaluation_periods')
        .select('id')
        .eq('employee_type', employeeType)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (periodError) throw periodError;
      if (employeeType === 'operativo' && !period) throw new Error('No hay un período activo para evaluaciones operativas.');

      const values = employeeType === 'administrativo'
        ? { evaluation_period_id: period?.id || null, employee_id: selectedEmployee.id, employee_position: position, department, sub_department: subDepartment, hire_date: hireDate || null, evaluation_date: evaluationDate || null, manager_name: manager, employee_summary: employeeSummary || null, manager_summary: managerSummary || null, ...developmentPlanValues(developmentPlans), ...signatureValues(signatures), status: 'draft' }
        : { evaluation_period_id: period?.id, employee_id: selectedEmployee.id, employee_position: position, department, sub_department: subDepartment, hire_date: hireDate || null, review_date: evaluationDate || null, employee_summary: employeeSummary || null, manager_summary: managerSummary || null, ...developmentPlanValues(developmentPlans), ...signatureValues(signatures), status: 'draft' };
      const result = evaluationId
        ? await supabase.from(table).update(values).eq('id', evaluationId)
        : await supabase.from(table).insert(values).select('id').maybeSingle();
      if (result.error) throw result.error;
      const savedEvaluationId = evaluationId || currentEvaluationId || result.data?.id;
      if (!savedEvaluationId) throw new Error('No se pudo identificar la evaluación guardada.');
      if (!evaluationId && !currentEvaluationId && result.data?.id) setCurrentEvaluationId(result.data.id);

      if (employeeType === 'administrativo') {
        const competencyRows = competencies.map((competency) => ({
          evaluation_id: savedEvaluationId,
          competency_number: competency.number,
          competency_description: competency.description || null,
          numeric_score: competency.score ? Number(competency.score) : null,
          manager_comments: competencyManagerComments || null,
          employee_comments: competencyEmployeeComments || null,
        }));
        const { error: competenciesError } = await supabase
          .from('final_evaluation_competencies')
          .upsert(competencyRows, { onConflict: 'evaluation_id,competency_number' });
        if (competenciesError) throw competenciesError;
      }

      const fileName = `Evaluacion_Final_${employeeType === 'administrativo' ? 'Administrativo' : 'Operativo'}.pdf`;
      const pdfBlob = await generatePDF('final-evaluation-document', fileName);
      if (!pdfBlob) throw new Error('No se pudo generar el PDF.');
      downloadBlob(pdfBlob, fileName);
      if (workflowStatus === 'draft') setWorkflowStatus('pending_signature');
      setMessage('Evaluación guardada y PDF generado correctamente.');
      setMessageType('success');
    } catch (error) {
      console.error('Error saving final evaluation:', error);
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la evaluación.');
      setMessageType('error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    const id = currentEvaluationId;
    if (!id) return;
    const table = employeeType === 'administrativo' ? 'final_administrative_evaluations' : 'operative_evaluations';
    const { error } = await supabase.from(table).update({ workflow_status: 'completed', status: 'completed' }).eq('id', id);
    if (error) { setMessage('Error al finalizar la evaluación.'); setMessageType('error'); return; }
    setWorkflowStatus('completed');
    setMessage('Evaluación finalizada exitosamente.');
    setMessageType('success');
  };

  const handleUploadSuccess = async () => {
    setShowUploadModal(false);
    const id = currentEvaluationId;
    if (!id) return;
    const table = employeeType === 'administrativo' ? 'final_administrative_evaluations' : 'operative_evaluations';
    const { data } = await supabase.from(table).select('signed_document_url, signed_document_filename, workflow_status').eq('id', id).maybeSingle();
    if (data) {
      setSignedDocumentUrl(data.signed_document_url || null);
      setSignedDocumentFilename(data.signed_document_filename || null);
      setWorkflowStatus((data.workflow_status as 'draft' | 'pending_signature' | 'completed') || 'pending_signature');
    }
    setMessage('Documento firmado subido correctamente. Ahora puedes finalizar la evaluación.');
    setMessageType('success');
  };

  const handleNewEvaluation = () => {
    setSelectedEmployee(null);
    setEmployeeSearch('');
    setPosition('');
    setDepartment('');
    setSubDepartment('');
    setHireDate('');
    setManager('');
    setGoals([1, 2, 3, 4, 5].map(createGoal));
    setCompetencies([1, 2, 3, 4, 5].map(createCompetency));
    setCompetencyManagerComments('');
    setCompetencyEmployeeComments('');
    setEmployeeSummary('');
    setManagerSummary('');
    setDevelopmentPlans([1, 2, 3].map(createDevelopmentPlan));
    setSignatures({ manager: '', managerDate: '', employee: '', employeeDate: '', hr: '', hrDate: '' });
    setMessage('');
  };

  return (
    <div className="min-h-full bg-slate-100 px-2 py-4 sm:px-5 lg:px-8">
      <div className="sticky top-3 z-20 mx-auto mb-3 max-w-[1500px]">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-md transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800">
          <ChevronLeft className="h-4 w-4" /> Volver a Evaluación Final
        </button>
      </div>
      <div id="final-evaluation-document" className="mx-auto grid max-w-[1500px] grid-cols-1 overflow-hidden border border-slate-400 bg-white text-slate-900 shadow-sm lg:grid-cols-[300px_minmax(0,1fr)]">
        <div data-pdf-page="1" className="contents">
        <div className="lg:col-span-2"><DocumentHeader employeeType={employeeType} /></div>

        <section data-html2canvas-ignore="true" className="self-start border-b border-slate-400 bg-slate-50 p-4 lg:row-span-5 lg:border-b-0 lg:border-r">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Seleccione Empleado</label><select value={selectedEmployee?.id || ''} onChange={(event) => { const employee = employees.find((item) => item.id === event.target.value); if (employee) handleSelectEmployee(employee); }} className="mb-3 w-full rounded border-2 border-blue-500 bg-white px-3 py-2 text-sm outline-none"><option value="">-- Seleccionar empleado --</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>)}</select>
          <div className="relative hidden">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={loadingEmployees ? 'Cargando empleados...' : 'Buscar por nombre, código o posición...'}
                  value={employeeSearch}
                  onChange={(event) => { setEmployeeSearch(event.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {selectedEmployee && (
                <div className="hidden items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 sm:flex">
                  <User className="h-4 w-4" />
                  {selectedEmployee.employee_code}
                </div>
              )}
            </div>
            {showDropdown && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredEmployees.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-500">{loadingEmployees ? 'Cargando...' : 'No se encontraron empleados'}</div>
                ) : filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onMouseDown={() => handleSelectEmployee(emp)}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                      <p className="truncate text-xs text-slate-500">{emp.position || 'Sin posición'} · {emp.employee_code || 'Sin código'}</p>
                    </div>
                    {emp.department && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{emp.department.name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-2">
            <button onClick={handleNewEvaluation} className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"><User className="h-4 w-4" /> Nueva</button>
            <button onClick={handleSaveDraft} disabled={!selectedEmployee || generatingPdf} className="inline-flex items-center justify-center gap-2 rounded bg-slate-300 px-3 py-2 text-sm font-semibold text-white transition enabled:bg-blue-700 enabled:hover:bg-blue-800 disabled:cursor-not-allowed"><Save className="h-4 w-4" /> {generatingPdf ? 'Generando...' : 'Guardar y PDF'}</button>
          </div>

          {/* Workflow panel — only visible once an evaluation has been saved */}
          {currentEvaluationId && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs">
              <WorkflowPanel
                status={workflowStatus}
                signedDocumentUrl={signedDocumentUrl}
                signedDocumentFilename={signedDocumentFilename}
                onDownloadPDF={handleSaveDraft}
                onUploadSigned={() => setShowUploadModal(true)}
                onMarkAsCompleted={handleMarkAsCompleted}
                generatingPdf={generatingPdf}
              />
            </div>
          )}
        </section>

        <section data-pdf-header-info="true" className="text-sm font-semibold">
          <InfoRow label="Nombre del Colaborador:" value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''} onChange={() => {}} readOnly />
          <InfoRow label="Posición del Colaborador:" value={position} onChange={setPosition} readOnly={!!selectedEmployee} />
          <div className="grid grid-cols-2 max-md:grid-cols-1"><InfoRow label="Departamento:" value={department} onChange={setDepartment} readOnly={!!selectedEmployee} /><InfoRow label="Sub-departamento:" value={subDepartment} onChange={setSubDepartment} /></div>
          <div className="grid grid-cols-2 max-md:grid-cols-1"><div className="grid grid-cols-[245px_1fr] max-md:grid-cols-[175px_1fr]"><BlueLabel>Fecha de Antigüedad<br /><span className="text-xs">(Día | Mes | Año)</span></BlueLabel><input type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} readOnly={!!selectedEmployee} className="min-h-[68px] bg-[#d9d9d9] px-3 text-sm font-normal outline-none" /></div><div className="grid grid-cols-[1fr_166px] max-md:grid-cols-[175px_1fr]"><BlueLabel>Tiempo en la posición actual:</BlueLabel><div className="grid grid-cols-2 bg-[#d9d9d9] text-center text-xs"><div className="border-l border-slate-400 p-2">Año<div className="mt-2 h-8 border-t border-slate-400">{hireDate ? tenure.years : ''}</div></div><div className="border-l border-slate-400 p-2">Meses<div className="mt-2 h-8 border-t border-slate-400">{hireDate ? tenure.months : ''}</div></div></div></div></div>
          <div className="grid grid-cols-2 max-md:grid-cols-1"><InfoRow label="Jefe Inmediato:" value={manager} onChange={setManager} readOnly={!!selectedEmployee} /><div className="grid grid-cols-[1fr_166px] max-md:grid-cols-[175px_1fr]"><BlueLabel>Fecha de Evaluación<br /><span className="text-xs">(Día | Mes | Año)</span></BlueLabel><input type="date" value={evaluationDate} onChange={(event) => setEvaluationDate(event.target.value)} className="bg-[#d9d9d9] px-3 text-sm font-normal outline-none" /></div></div>
        </section>

        <section className="border-t border-slate-400">
          <SectionTitle>Escala de Calificación- Para el Proceso de Evaluación del desempeño</SectionTitle>
          <div className="space-y-0.5 px-2 py-2 text-[11px] leading-[1.35] sm:text-xs"><p>Excede Expectativas (10): Consistentemente desempeña y cumple los requerimientos más allá de los estándares, entregando resultados de alta calidad y excelencia.</p><p>Cumple Expectativas (8-9): Consistentemente desempeña y cumple los requerimientos, entregando calidad en los resultados.</p><p>Desempeño a Mejorar (6-7): No es consistente en el desempeño y cumplimiento de los requerimientos o entrega de resultados, pero demuestra deseo de mejorar su desempeño para cumplir los requerimientos y entregar resultados de calidad.</p><p>Debajo de Expectativas (1-5): Falla consistentemente en el desempeño y cumplimiento de los requerimientos y no entrega resultados de calidad.</p></div>
        </section>

        <section className="border-t border-slate-400">
          <SectionTitle centered>EVALUACION METAS INDIVIDUALES <span className="font-normal">(Valor 60%)</span></SectionTitle>
          {goals.map((goal, index) => <GoalBlock key={goal.number} goal={goal} onChange={(key, value) => updateGoal(index, key, value)} />)}
          <div className="grid grid-cols-[1fr_95px] border-t border-slate-400 text-xs font-bold"><div className="bg-[#24557e] px-2 py-1.5 text-white">Suma de Calificación Evaluación de Metas</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{totalScore}</div><div className="bg-[#24557e] px-2 py-1.5 text-white">Promedio de Calificación Evaluación de Metas</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{averageScore}</div></div>
        </section>
        </div>

        <div data-pdf-page="2" className="contents">
        <section className="border-t border-slate-400 lg:col-span-2">
          <CompetenciesPage competencies={competencies} onChange={updateCompetency} managerComments={competencyManagerComments} employeeComments={competencyEmployeeComments} onManagerCommentsChange={setCompetencyManagerComments} onEmployeeCommentsChange={setCompetencyEmployeeComments} total={totalCompetencyScore} average={averageCompetencyScore} />
        </section>
        </div>

        <div data-pdf-page="3" className="contents">
        <section className="border-t border-slate-400 lg:col-span-2">
          <FinalSummaryPage employeeSummary={employeeSummary} managerSummary={managerSummary} onEmployeeSummaryChange={setEmployeeSummary} onManagerSummaryChange={setManagerSummary} totalGoals={totalScore} averageGoals={averageScore} totalCompetencies={totalCompetencyScore} averageCompetencies={averageCompetencyScore} finalScore={finalPerformanceScore} developmentPlans={developmentPlans} onDevelopmentChange={updateDevelopmentPlan} signatures={signatures} onSignatureChange={updateSignature} />
        </section>
        </div>

        <footer data-html2canvas-ignore="true" className="flex flex-col gap-3 border-t border-slate-400 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-3"><span className="text-sm text-slate-500">{scoredGoals.length}/5 metas calificadas</span><button onClick={handleSaveDraft} disabled={!selectedEmployee || generatingPdf} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" /> {generatingPdf ? 'Generando PDF...' : 'Guardar borrador'}</button></div>
        </footer>
        {message && <div data-html2canvas-ignore="true" className={`border-t px-4 py-3 text-sm font-medium ${messageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</div>}
      </div>

      {showUploadModal && selectedEmployee && currentEvaluationId && (
        <FinalEvaluationSignedUpload
          evaluationId={currentEvaluationId}
          evaluationType={employeeType}
          employee={{ id: selectedEmployee.id, employee_code: selectedEmployee.employee_code, first_name: selectedEmployee.first_name, last_name: selectedEmployee.last_name }}
          currentDocumentUrl={signedDocumentUrl}
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}

type WorkflowStatus = 'draft' | 'pending_signature' | 'completed';
function WorkflowPanel({ status, signedDocumentUrl, signedDocumentFilename, onDownloadPDF, onUploadSigned, onMarkAsCompleted, generatingPdf }: { status: WorkflowStatus; signedDocumentUrl: string | null; signedDocumentFilename: string | null; onDownloadPDF: () => void; onUploadSigned: () => void; onMarkAsCompleted: () => void; generatingPdf: boolean }) {
  const statusConfig = {
    draft: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700', icon: FileText },
    pending_signature: { label: 'Pendiente Firma', cls: 'bg-amber-100 text-amber-700', icon: Clock },
    completed: { label: 'Completado', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  };
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Estado del Documento</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}><Icon className="h-3 w-3" />{cfg.label}</span>
      </div>

      {status === 'draft' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[11px] text-blue-800">
          <p className="mb-2 font-semibold">Pasos siguientes:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Guarda y descarga el PDF</li>
            <li>Imprímelo y fírmalo</li>
            <li>Escanéalo y súbelo</li>
            <li>Finaliza la evaluación</li>
          </ol>
        </div>
      )}

      {status === 'pending_signature' && (
        <div className="space-y-2">
          {signedDocumentUrl ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-2.5 text-[11px] text-green-800">
              <div className="flex items-center gap-1.5 mb-2"><CheckCircle className="h-3.5 w-3.5" /><span className="font-semibold">Documento subido.</span></div>
              {signedDocumentFilename && <p className="text-slate-600 truncate mb-2">{signedDocumentFilename}</p>}
              <a href={signedDocumentUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Ver documento</a>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
              Firma el documento impreso y súbelo para finalizar.
            </div>
          )}
        </div>
      )}

      {status === 'completed' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-2.5 text-[11px] text-green-800">
          <div className="flex items-center gap-1.5 mb-1"><CheckCircle className="h-3.5 w-3.5" /><span className="font-semibold">Proceso completado.</span></div>
          {signedDocumentUrl && <a href={signedDocumentUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Ver documento firmado</a>}
        </div>
      )}

      <div className="grid gap-1.5">
        <button onClick={onDownloadPDF} disabled={generatingPdf} className="inline-flex items-center justify-center gap-1.5 rounded bg-blue-700 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
          <Download className="h-3 w-3" />{generatingPdf ? 'Generando...' : 'Guardar y PDF'}
        </button>
        {status !== 'completed' && (
          <button onClick={onUploadSigned} className="inline-flex items-center justify-center gap-1.5 rounded bg-amber-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700">
            <Upload className="h-3 w-3" />{signedDocumentUrl ? 'Reemplazar Firmado' : 'Subir Firmado'}
          </button>
        )}
        {status === 'pending_signature' && signedDocumentUrl && (
          <button onClick={onMarkAsCompleted} className="inline-flex items-center justify-center gap-1.5 rounded bg-green-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700">
            <CheckCircle className="h-3 w-3" />Finalizar Evaluación
          </button>
        )}
      </div>
    </div>
  );
}

function DocumentHeader({ employeeType }: { employeeType: EmployeeType }) {
  const title = employeeType === 'administrativo' ? 'Evaluación del Desempeño Administrativo' : 'Evaluación del Desempeño Operativo';
  return <header className="grid min-h-[92px] grid-cols-[190px_1fr_240px] border-b border-slate-400 max-md:grid-cols-[130px_1fr]"><div className="flex items-center justify-center border-r border-slate-400 p-3"><img src="/Logo_PLIHSA_BLUE.png" alt="PLIHSA" className="h-16 w-44 object-contain max-md:h-12 max-md:w-28" /></div><div className="flex items-center justify-center p-4 text-center"><h1 className="text-xl font-semibold max-sm:text-base">{title}</h1></div><div className="border-l border-slate-400 text-xs max-md:col-span-2 max-md:grid max-md:grid-cols-3 max-md:border-l-0"><DocMeta label="Código" value="PL-RH-P-002-F02" /><DocMeta label="Versión" value="01" /><DocMeta label="Fecha de Revisión" value="09/07/2025" /></div></header>;
}

function DocMeta({ label, value }: { label: string; value: string }) { return <div className="flex gap-1 border-b border-slate-300 p-2 last:border-b-0"><span className="font-semibold">{label}:</span><span>{value}</span></div>; }
function BlueLabel({ children }: { children: React.ReactNode }) { return <div className="flex items-center bg-[#24557e] px-2 py-2 text-white">{children}</div>; }
function SectionTitle({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) { return <div className={`bg-[#24557e] px-2 py-1.5 text-xs font-bold text-white ${centered ? 'text-center' : ''}`}>{children}</div>; }
function InfoRow({ label, value, onChange, readOnly = false }: { label: string; value: string; onChange: (value: string) => void; readOnly?: boolean }) { return <div className="grid grid-cols-[245px_1fr] border-b border-slate-400 max-md:grid-cols-[175px_1fr]"><BlueLabel>{label}</BlueLabel><input value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} className="bg-[#d9d9d9] px-3 py-2 text-sm font-normal outline-none focus:bg-white" /></div>; }

function GoalBlock({ goal, onChange }: { goal: Goal; onChange: (key: keyof Goal, value: string) => void }) {
  return <div className="grid grid-cols-[195px_235px_1fr] border-t border-slate-400 max-md:grid-cols-1"><div className="bg-[#24557e] text-[11px] font-bold leading-tight text-white"><div className="min-h-[32px] border-b border-white/30 p-2">Calificación Escala Numérica</div><div className="min-h-[76px] border-b border-white/30 p-2">Calificación según el criterio de la escala</div><div className="min-h-[56px] border-b border-white/30 p-2">Comentarios Jefe Inmediato</div><div className="min-h-[56px] p-2">Comentarios del Colaborador</div></div><div className="border-r border-slate-400 bg-white text-xs max-md:border-r-0"><div className="min-h-[32px] border-b border-slate-400 p-2"><label className="font-semibold">Puntaje de la meta {goal.number}<select value={goal.score} onChange={(event) => onChange('score', event.target.value)} className="ml-2 rounded border border-slate-300 px-1 py-0.5 font-semibold outline-none focus:border-blue-700"><option value="">—</option>{scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}</select></label></div><div className="min-h-[76px] border-b border-slate-400 p-2 text-slate-500">{criterionLabel(goal.score)}</div><textarea aria-label={`Comentarios del jefe para meta ${goal.number}`} rows={3} value={goal.managerComments} onChange={(event) => onChange('managerComments', event.target.value)} className="block min-h-[56px] w-full resize-none border-b border-slate-400 p-2 outline-none focus:bg-blue-50" /><textarea aria-label={`Comentarios del colaborador para meta ${goal.number}`} rows={3} value={goal.employeeComments} onChange={(event) => onChange('employeeComments', event.target.value)} className="block min-h-[56px] w-full resize-none p-2 outline-none focus:bg-blue-50" /></div><div className="min-w-0"><div className="min-h-[32px] border-b border-slate-400 bg-[#24557e] p-2 text-xs font-bold text-white">Meta <span className="block text-center">No. {goal.number}</span></div><div className="border-b border-slate-400 p-2 text-xs font-bold">Medición y Resultados:<textarea rows={4} value={goal.result} onChange={(event) => onChange('result', event.target.value)} placeholder="Describa la medición y los resultados obtenidos" className="mt-1 block min-h-[72px] w-full resize-none border border-slate-200 p-2 text-xs font-normal outline-none focus:border-blue-700" /></div><label className="block p-2 text-xs font-bold">Descripción de la meta<textarea rows={3} value={goal.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Escriba aquí la meta definida" className="mt-1 block min-h-[52px] w-full resize-none border border-slate-200 p-2 text-xs font-normal outline-none focus:border-blue-700" /></label></div></div>;
}

function developmentPlanValues(plans: DevelopmentPlan[]): Record<string, string | null> {
  return plans.reduce<Record<string, string | null>>((values, plan) => ({
    ...values,
    [`development_need_${plan.number}`]: plan.need || null,
    [`development_action_${plan.number}`]: plan.action || null,
    [`development_period_${plan.number}`]: plan.period || null,
    [`development_followup_${plan.number}`]: plan.followup || null,
  }), {});
}

function signatureValues(signatures: Signatures): Record<string, string | null> {
  return {
    manager_signature: signatures.manager || null,
    manager_signature_date: signatures.managerDate || null,
    employee_signature: signatures.employee || null,
    employee_signature_date: signatures.employeeDate || null,
    hr_signature: signatures.hr || null,
    hr_signature_date: signatures.hrDate || null,
  };
}

function FinalSummaryPage({ employeeSummary, managerSummary, onEmployeeSummaryChange, onManagerSummaryChange, totalGoals, averageGoals, totalCompetencies, averageCompetencies, finalScore, developmentPlans, onDevelopmentChange, signatures, onSignatureChange }: { employeeSummary: string; managerSummary: string; onEmployeeSummaryChange: (value: string) => void; onManagerSummaryChange: (value: string) => void; totalGoals: number; averageGoals: string; totalCompetencies: number; averageCompetencies: string; finalScore: string; developmentPlans: DevelopmentPlan[]; onDevelopmentChange: (index: number, key: keyof Omit<DevelopmentPlan, 'number'>, value: string) => void; signatures: Signatures; onSignatureChange: (key: keyof Signatures, value: string) => void }) {
  return <div className="text-sm font-semibold">
    <SectionTitle centered>RESUMEN FINAL DE DESEMPEÑO</SectionTitle>
    <div className="grid grid-cols-[195px_1fr] border-t border-slate-400 max-md:grid-cols-1"><BlueLabel>Resumen del desempeño por parte<br />del colaborador</BlueLabel><textarea value={employeeSummary} onChange={(event) => onEmployeeSummaryChange(event.target.value)} rows={3} className="min-h-[88px] resize-none p-2 text-xs font-normal outline-none focus:bg-blue-50" /></div>
    <div className="grid grid-cols-[195px_1fr] border-t border-slate-400 max-md:grid-cols-1"><BlueLabel>Resumen del desempeño por parte<br />del Jefe</BlueLabel><textarea value={managerSummary} onChange={(event) => onManagerSummaryChange(event.target.value)} rows={3} className="min-h-[88px] resize-none p-2 text-xs font-normal outline-none focus:bg-blue-50" /></div>
    <div className="grid grid-cols-[1fr_95px] border-t border-slate-400 text-xs font-bold"><div className="bg-[#24557e] px-2 py-1.5 text-white">Promedio de calificación evaluación de metas x Ponderación (60%)</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{averageGoals === '0' ? '0' : (Number(averageGoals) * 0.6).toFixed(1)}</div><div className="bg-[#24557e] px-2 py-1.5 text-white">Promedio de calificación evaluación de competencias conductuales y habilidades técnicas x Ponderación (40%)</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{averageCompetencies === '0' ? '0' : (Number(averageCompetencies) * 0.4).toFixed(1)}</div><div className="bg-[#24557e] px-2 py-1.5 text-white">Promedio de desempeño total</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{finalScore}</div><div className="bg-[#24557e] px-2 py-1.5 text-white">Criterio de la escala de cumplimiento</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{criterionLabel(finalScore)}</div></div>
    <div className="mt-3"><SectionTitle>PLAN DE DESARROLLO (Enfóquese en 2 o 3 necesidades de desarrollo)</SectionTitle>{developmentPlans.map((plan, index) => <DevelopmentPlanBlock key={plan.number} plan={plan} onChange={(key, value) => onDevelopmentChange(index, key, value)} />)}</div>
    <div className="mt-3 border-t border-slate-400"><SignatureRow label="Firma del Jefe Inmediato" value={signatures.manager} date={signatures.managerDate} onValueChange={(value) => onSignatureChange('manager', value)} onDateChange={(value) => onSignatureChange('managerDate', value)} /><SignatureRow label="Firma del Colaborador" value={signatures.employee} date={signatures.employeeDate} onValueChange={(value) => onSignatureChange('employee', value)} onDateChange={(value) => onSignatureChange('employeeDate', value)} /><SignatureRow label="Firma de Recursos Humanos" value={signatures.hr} date={signatures.hrDate} onValueChange={(value) => onSignatureChange('hr', value)} onDateChange={(value) => onSignatureChange('hrDate', value)} /></div>
  </div>;
}

function DevelopmentPlanBlock({ plan, onChange }: { plan: DevelopmentPlan; onChange: (key: keyof Omit<DevelopmentPlan, 'number'>, value: string) => void }) {
  return <div className="grid grid-cols-[195px_1fr] border-t border-slate-400 max-md:grid-cols-1"><div className="text-[11px] font-bold leading-tight"><div className="min-h-[64px] bg-[#24557e] p-2 text-white">{plan.number}. ¿Cuál es la necesidad de Desarrollo? (Habilidad/Conocimiento/Conducta)</div><div className="border-b border-slate-400 bg-[#d9d9d9] p-2 font-normal">¿Cómo abordará su Desarrollo?</div><div className="border-b border-slate-400 bg-[#d9d9d9] p-2 font-normal">Periodo de Tiempo</div><div className="bg-[#d9d9d9] p-2 font-normal">¿Cómo va a dar seguimiento a sus avances?</div></div><div className="grid grid-rows-[64px_40px_40px_40px]"><textarea value={plan.need} onChange={(event) => onChange('need', event.target.value)} className="resize-none border-b border-slate-400 p-2 text-xs font-normal outline-none focus:bg-blue-50" /><textarea value={plan.action} onChange={(event) => onChange('action', event.target.value)} className="resize-none border-b border-slate-400 p-2 text-xs font-normal outline-none focus:bg-blue-50" /><input value={plan.period} onChange={(event) => onChange('period', event.target.value)} className="border-b border-slate-400 p-2 text-xs font-normal outline-none focus:bg-blue-50" /><textarea value={plan.followup} onChange={(event) => onChange('followup', event.target.value)} className="resize-none p-2 text-xs font-normal outline-none focus:bg-blue-50" /></div></div>;
}

function SignatureRow({ label, value, date, onValueChange, onDateChange }: { label: string; value: string; date: string; onValueChange: (value: string) => void; onDateChange: (value: string) => void }) {
  return <div className="grid grid-cols-[195px_1fr_125px_135px] border-b border-slate-400 max-md:grid-cols-[145px_1fr] text-xs"><div className="bg-[#24557e] p-2 text-white">{label}</div><input value={value} onChange={(event) => onValueChange(event.target.value)} className="min-h-[32px] border-r border-slate-400 p-2 font-normal outline-none focus:bg-blue-50" /><div className="bg-[#24557e] p-2 text-center text-white">Fecha</div><input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="p-2 font-normal outline-none focus:bg-blue-50" />
  </div>;
}

function CompetenciesPage({ competencies, onChange, managerComments, employeeComments, onManagerCommentsChange, onEmployeeCommentsChange, total, average }: { competencies: Competency[]; onChange: (index: number, key: keyof Competency, value: string) => void; managerComments: string; employeeComments: string; onManagerCommentsChange: (value: string) => void; onEmployeeCommentsChange: (value: string) => void; total: number; average: string }) {
  return <div className="text-sm font-semibold">
    <SectionTitle centered>EVALUACION COMPETENCIAS CONDUCTUALES Y HABILIDADES TECNICAS <span className="font-normal">(40%)</span></SectionTitle>
    {competencies.map((competency, index) => <CompetencyBlock key={competency.number} competency={competency} onChange={(key, value) => onChange(index, key, value)} />)}
    <div className="border-t border-slate-400">
      <div className="bg-[#24557e] px-2 py-1.5 text-center text-xs font-bold text-white">Comentarios de la sección de Evaluación de Competencias Conductuales y Habilidades Técnicas</div>
      <div className="grid grid-cols-[195px_1fr] border-b border-slate-400 max-md:grid-cols-1"><BlueLabel>Comentarios Jefe Inmediato</BlueLabel><textarea value={managerComments} onChange={(event) => onManagerCommentsChange(event.target.value)} rows={3} className="min-h-[72px] resize-none bg-white p-2 text-xs font-normal outline-none focus:bg-blue-50" /></div>
      <div className="grid grid-cols-[195px_1fr] border-b border-slate-400 max-md:grid-cols-1"><BlueLabel>Comentarios del Colaborador</BlueLabel><textarea value={employeeComments} onChange={(event) => onEmployeeCommentsChange(event.target.value)} rows={3} className="min-h-[72px] resize-none bg-white p-2 text-xs font-normal outline-none focus:bg-blue-50" /></div>
      <div className="grid grid-cols-[1fr_95px] text-xs font-bold"><div className="bg-[#24557e] px-2 py-1.5 text-white">Suma de Calificación Evaluación de Competencias Conductuales y Habilidades Técnicas</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{total}</div><div className="bg-[#24557e] px-2 py-1.5 text-white">Promedio de Calificación evaluación de Competencias Conductuales y Habilidades Técnicas</div><div className="bg-[#d9d9d9] px-2 py-1.5 text-center">{average}</div></div>
    </div>
  </div>;
}

function CompetencyBlock({ competency, onChange }: { competency: Competency; onChange: (key: keyof Competency, value: string) => void }) {
  return <div className="grid grid-cols-[195px_235px_1fr] border-t border-slate-400 max-md:grid-cols-1">
    <div className="bg-[#24557e] text-[11px] font-bold leading-tight text-white"><div className="min-h-[32px] border-b border-white/30 p-2">Calificación Escala Numérica</div><div className="min-h-[76px] p-2">Calificación según el criterio de la escala</div></div>
    <div className="border-r border-slate-400 bg-white text-xs"><div className="min-h-[32px] border-b border-slate-400 p-2"><label className="font-semibold">Puntaje de competencia {competency.number}<select value={competency.score} onChange={(event) => onChange('score', event.target.value)} className="ml-2 rounded border border-slate-300 px-1 py-0.5 font-semibold outline-none focus:border-blue-700"><option value="">—</option>{scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}</select></label></div><div className="min-h-[76px] p-2 text-slate-500">{criterionLabel(competency.score)}</div></div>
    <div className="min-w-0"><div className="min-h-[32px] border-b border-slate-400 bg-[#24557e] p-2 text-center text-xs font-bold text-white">Competencia Conductual/Habilidad<br />No. {competency.number}</div><label className="block p-2 text-xs font-bold">Explicación de la competencia conductual/habilidad:<textarea rows={4} value={competency.description} onChange={(event) => onChange('description', event.target.value)} className="mt-1 block min-h-[76px] w-full resize-none border border-slate-200 p-2 text-xs font-normal outline-none focus:border-blue-700" /></label></div>
  </div>;
}

function criterionLabel(score: string): string { const value = Number(score); if (!value) return 'Seleccione una calificación para mostrar el criterio.'; if (value === 10) return 'Excede Expectativas'; if (value >= 8) return 'Cumple Expectativas'; if (value >= 6) return 'Desempeño a Mejorar'; return 'Debajo de Expectativas'; }
