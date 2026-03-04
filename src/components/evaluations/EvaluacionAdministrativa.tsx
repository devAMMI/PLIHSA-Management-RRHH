import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Calendar, Briefcase, Building2, MapPin, FileText, Target, Award, MessageSquare, Save, Printer } from 'lucide-react';

const PLIHSA_ID = 'ef0cbe1b-06be-4587-a9a3-6233c14795f5';

type Rating = 'below_expectations' | 'needs_improvement' | 'meets_expectations' | 'exceeds_expectations' | '';

interface Goal {
  description: string;
  measurement: string;
}

interface Skill {
  name: string;
}

interface GoalReview {
  result: string;
  rating: Rating;
}

interface SkillReview {
  result: string;
  rating: Rating;
}

interface FormData {
  period_id: string;
  employee_id: string;
  manager_id: string;
  definition_date: string;
  review_date: string;
  status: string;
  goals: Goal[];
  skills: Skill[];
  goal_reviews: GoalReview[];
  skill_reviews: SkillReview[];
  manager_comments: string;
  employee_comments: string;
}

interface Toast {
  msg: string;
  type: 'success' | 'error' | 'info';
}

export default function EvaluacionAdministrativa({ evaluationId }: { evaluationId?: string }) {
  const [activeTab, setActiveTab] = useState(1);
  const [savedEvaluationId, setSavedEvaluationId] = useState<string | undefined>(evaluationId);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  const [periods, setPeriods] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

  const [form, setForm] = useState<FormData>({
    period_id: '',
    employee_id: '',
    manager_id: '',
    definition_date: '',
    review_date: '',
    status: 'draft',
    goals: Array(5).fill(null).map(() => ({ description: '', measurement: '' })),
    skills: Array(5).fill(null).map(() => ({ name: '' })),
    goal_reviews: Array(5).fill(null).map(() => ({ result: '', rating: '' as Rating })),
    skill_reviews: Array(5).fill(null).map(() => ({ result: '', rating: '' as Rating })),
    manager_comments: '',
    employee_comments: '',
  });

  useEffect(() => {
    loadPeriods();
    loadEmployees();
    loadManagers();
    if (evaluationId) {
      loadEvaluation(evaluationId);
    }
  }, [evaluationId]);

  const loadPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_periods')
        .select('*')
        .eq('company_id', PLIHSA_ID)
        .eq('employee_type', 'administrativo')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error('Error loading periods:', error);
      showToast('Error al cargar períodos', 'error');
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, first_name, last_name, employee_code,
          position, hire_date,
          departments(name),
          sub_departments(name),
          work_locations(name)
        `)
        .eq('company_id', PLIHSA_ID)
        .eq('employee_type', 'administrativo')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      showToast('Error al cargar empleados', 'error');
    }
  };

  const loadManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position')
        .eq('company_id', PLIHSA_ID)
        .eq('employee_type', 'administrativo')
        .order('first_name');

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error loading managers:', error);
      showToast('Error al cargar jefes inmediatos', 'error');
    }
  };

  const loadEvaluation = async (evalId: string) => {
    try {
      setLoading(true);
      const { data: ev, error } = await supabase
        .from('administrative_evaluations')
        .select(`
          *,
          evaluation_individual_goals(*),
          evaluation_competencies(*),
          evaluation_goal_reviews(*),
          evaluation_competency_reviews(*)
        `)
        .eq('id', evalId)
        .single();

      if (error) throw error;

      const goals = ev.evaluation_individual_goals
        .sort((a: any, b: any) => a.goal_number - b.goal_number)
        .map((g: any) => ({ description: g.goal_description || '', measurement: g.measurement_and_expected_results || '' }));

      const skills = ev.evaluation_competencies
        .sort((a: any, b: any) => a.competency_number - b.competency_number)
        .map((s: any) => ({ name: s.competency_description || '' }));

      setForm({
        period_id: ev.evaluation_period_id,
        employee_id: ev.employee_id,
        manager_id: ev.manager_id || '',
        definition_date: ev.definition_date || '',
        review_date: ev.review_date || '',
        status: ev.status,
        goals: [...goals, ...Array(5 - goals.length).fill(null).map(() => ({ description: '', measurement: '' }))].slice(0, 5),
        skills: [...skills, ...Array(5 - skills.length).fill(null).map(() => ({ name: '' }))].slice(0, 5),
        goal_reviews: Array(5).fill(null).map(() => ({ result: '', rating: '' as Rating })),
        skill_reviews: Array(5).fill(null).map(() => ({ result: '', rating: '' as Rating })),
        manager_comments: ev.manager_comments || '',
        employee_comments: ev.employee_comments || '',
      });

      setSavedEvaluationId(evalId);

      if (ev.employee_id) {
        const emp = employees.find(e => e.id === ev.employee_id);
        if (emp) setSelectedEmployee(emp);
      }
      if (ev.manager_id) {
        const mgr = managers.find(m => m.id === ev.manager_id);
        if (mgr) setSelectedManager(mgr);
      }
      if (ev.evaluation_period_id) {
        const per = periods.find(p => p.id === ev.evaluation_period_id);
        if (per) setSelectedPeriod(per);
      }
    } catch (error) {
      console.error('Error loading evaluation:', error);
      showToast('Error al cargar evaluación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setSelectedEmployee(employee);
    setForm({ ...form, employee_id: employeeId });
  };

  const handleManagerSelect = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    setSelectedManager(manager);
    setForm({ ...form, manager_id: managerId });
  };

  const handlePeriodSelect = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    setSelectedPeriod(period);
    setForm({ ...form, period_id: periodId });
  };

  const handleSave = async () => {
    if (!form.employee_id) { showToast('Selecciona un colaborador', 'error'); return; }
    if (!form.manager_id) { showToast('Selecciona un jefe inmediato', 'error'); return; }
    if (!form.period_id) { showToast('Selecciona un período', 'error'); return; }
    if (!form.definition_date) { showToast('Ingresa la fecha de definición', 'error'); return; }

    try {
      setLoading(true);

      const { data: evaluation, error } = await supabase
        .from('administrative_evaluations')
        .upsert({
          id: savedEvaluationId || undefined,
          evaluation_period_id: form.period_id,
          employee_id: form.employee_id,
          manager_id: form.manager_id,
          employee_position: selectedEmployee?.position || '',
          department: selectedEmployee?.departments?.name || '',
          sub_department: selectedEmployee?.sub_departments?.name || '',
          hire_date: selectedEmployee?.hire_date || null,
          status: form.status,
          definition_date: form.definition_date || null,
          review_date: form.review_date || null,
          manager_comments: form.manager_comments || '',
          employee_comments: form.employee_comments || '',
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      const evalId = evaluation.id;
      setSavedEvaluationId(evalId);

      await supabase
        .from('evaluation_individual_goals')
        .delete()
        .eq('evaluation_id', evalId);

      const goalsToSave = form.goals
        .map((g, i) => ({ ...g, index: i }))
        .filter(g => g.description?.trim())
        .map((g) => ({
          evaluation_id: evalId,
          goal_number: g.index + 1,
          goal_description: g.description,
          measurement_and_expected_results: g.measurement || '',
        }));

      if (goalsToSave.length > 0) {
        await supabase.from('evaluation_individual_goals').insert(goalsToSave);
      }

      await supabase
        .from('evaluation_competencies')
        .delete()
        .eq('evaluation_id', evalId);

      const skillsToSave = form.skills
        .map((s, i) => ({ ...s, index: i }))
        .filter(s => s.name?.trim())
        .map((s) => ({
          evaluation_id: evalId,
          competency_number: s.index + 1,
          competency_description: s.name,
        }));

      if (skillsToSave.length > 0) {
        await supabase.from('evaluation_competencies').insert(skillsToSave);
      }

      const { data: savedGoals } = await supabase
        .from('evaluation_individual_goals')
        .select('id, goal_number')
        .eq('evaluation_id', evalId)
        .order('goal_number');

      if (savedGoals && form.goal_reviews.some(r => r.rating)) {
        for (const goal of savedGoals) {
          const review = form.goal_reviews[goal.goal_number - 1];
          if (review?.rating) {
            await supabase.from('evaluation_goal_reviews').upsert({
              goal_id: goal.id,
              results_description: review.result || '',
              rating: review.rating,
            }, { onConflict: 'goal_id' });
          }
        }
      }

      const { data: savedSkills } = await supabase
        .from('evaluation_competencies')
        .select('id, competency_number')
        .eq('evaluation_id', evalId)
        .order('competency_number');

      if (savedSkills && form.skill_reviews.some(r => r.rating)) {
        for (const skill of savedSkills) {
          const review = form.skill_reviews[skill.competency_number - 1];
          if (review?.rating) {
            await supabase.from('evaluation_competency_reviews').upsert({
              competency_id: skill.id,
              results_description: review.result || '',
              rating: review.rating,
            }, { onConflict: 'competency_id' });
          }
        }
      }

      showToast('Evaluación guardada correctamente', 'success');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      showToast('Error al guardar la evaluación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!savedEvaluationId) {
      showToast('Guarda la evaluación antes de exportar PDF', 'error');
      return;
    }

    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(buildPDFHTML());
    w.document.close();
    setTimeout(() => {
      w.print();
      showToast('PDF generado', 'success');
    }, 500);
  };

  const buildPDFHTML = () => {
    const empName = selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : '';
    const empPosition = selectedEmployee?.position || '';
    const empDept = selectedEmployee?.departments?.name || '';
    const empSubDept = selectedEmployee?.sub_departments?.name || '';
    const empHireDate = selectedEmployee?.hire_date ? formatDate(selectedEmployee.hire_date) : '';
    const mgrName = selectedManager ? `${selectedManager.first_name} ${selectedManager.last_name}` : '';
    const periodName = selectedPeriod?.name || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Evaluación - ${empName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; }
    @page { margin: 15mm; size: A4; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
    td, th { border: 1px solid #000; padding: 5px 8px; vertical-align: top; }
    .navy { background: #1a3f6f !important; color: #fff !important; font-weight: bold;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .center { text-align: center; }
    .large { font-size: 14px; }
    .bold { font-weight: bold; }
    .score-1 { background: #fce4ec !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .score-2 { background: #fff3e0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .score-3 { background: #e8f5e9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .score-4 { background: #e3f2fd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .num { font-size: 13px; font-weight: bold; color: #1a3f6f; text-align: center; width: 40px; }
    .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin: 20px 0 5px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <table>
    <tr>
      <td class="navy center large" style="width: 20%;">PLIHSA</td>
      <td class="navy center" style="width: 60%;">Definición de Factores y Revisión del Desempeño Administrativo</td>
      <td class="center" style="width: 20%; font-size: 9px;">
        <strong>Código:</strong> PL-RH-P-002-F01<br>
        <strong>Versión:</strong> 01<br>
        <strong>Fecha:</strong> 09/07/2025
      </td>
    </tr>
  </table>

  <table>
    <tr>
      <td class="navy" style="width: 25%;">Período</td>
      <td colspan="3">${periodName}</td>
    </tr>
    <tr>
      <td class="navy">Nombre del Colaborador</td>
      <td style="width: 25%;">${empName}</td>
      <td class="navy" style="width: 25%;">Posición</td>
      <td style="width: 25%;">${empPosition}</td>
    </tr>
    <tr>
      <td class="navy">Departamento</td>
      <td>${empDept}</td>
      <td class="navy">Sub-departamento</td>
      <td>${empSubDept}</td>
    </tr>
    <tr>
      <td class="navy">Fecha de Ingreso</td>
      <td>${empHireDate}</td>
      <td class="navy">Fecha Definición Factores</td>
      <td>${form.definition_date ? formatDate(form.definition_date) : ''}</td>
    </tr>
    <tr>
      <td class="navy">Jefe Inmediato</td>
      <td colspan="3">${mgrName}</td>
    </tr>
  </table>

  <table>
    <tr>
      <td class="navy center" colspan="3">DEFINICIÓN METAS INDIVIDUALES</td>
    </tr>
    <tr class="navy center">
      <td style="width: 40px;">No.</td>
      <td>Metas Individuales</td>
      <td>Medición y Resultados Esperados</td>
    </tr>
    ${form.goals.map((g, i) => `
    <tr style="height: 50px;">
      <td class="num">${i + 1}</td>
      <td>${g.description || ''}</td>
      <td>${g.measurement || ''}</td>
    </tr>
    `).join('')}
  </table>

  <table>
    <tr>
      <td class="navy center" colspan="2">DEFINICIÓN DE COMPETENCIAS CONDUCTUALES Y HABILIDADES TÉCNICAS</td>
    </tr>
    <tr class="navy center">
      <td style="width: 40px;">No.</td>
      <td>Conductas/Habilidades - Definir las 5 Principales</td>
    </tr>
    ${form.skills.map((s, i) => `
    <tr style="height: 40px;">
      <td class="num">${i + 1}</td>
      <td>${s.name || ''}</td>
    </tr>
    `).join('')}
  </table>

  <table>
    <tr>
      <td class="navy" style="width: 30%;">Comentarios del Jefe Inmediato</td>
      <td>${form.manager_comments || ''}</td>
    </tr>
    <tr>
      <td class="navy">Comentarios del Colaborador</td>
      <td>${form.employee_comments || ''}</td>
    </tr>
  </table>

  <div style="margin: 20px 0; display: flex; justify-content: space-between;">
    <div style="width: 45%; text-align: center;">
      <div class="signature-line"></div>
      <div style="margin-top: 5px; font-size: 10px;">Firma del Colaborador</div>
    </div>
    <div style="width: 45%; text-align: center;">
      <div class="signature-line"></div>
      <div style="margin-top: 5px; font-size: 10px;">Firma del Jefe Inmediato</div>
    </div>
  </div>

  ${form.review_date ? `
  <table style="page-break-before: always;">
    <tr>
      <td class="navy center" colspan="6">REVISIÓN DE METAS INDIVIDUALES</td>
    </tr>
    <tr>
      <td colspan="6"><strong>Fecha de Revisión:</strong> ${formatDate(form.review_date)}</td>
    </tr>
    <tr class="navy center" style="font-size: 9px;">
      <td style="width: 40px;">No.</td>
      <td>Metas/Resultados</td>
      <td style="width: 80px;">Debajo de Expectativas</td>
      <td style="width: 80px;">Desempeño a Mejorar</td>
      <td style="width: 80px;">Cumple Expectativas</td>
      <td style="width: 80px;">Supera Expectativas</td>
    </tr>
    ${form.goal_reviews.map((r, i) => {
      const ratingCol = r.rating === 'below_expectations' ? 2 : r.rating === 'needs_improvement' ? 3 : r.rating === 'meets_expectations' ? 4 : r.rating === 'exceeds_expectations' ? 5 : 0;
      return `
    <tr style="height: 50px;">
      <td class="num">${i + 1}</td>
      <td>${r.result || form.goals[i]?.description || ''}</td>
      <td class="center ${ratingCol === 2 ? 'score-1' : ''}">${ratingCol === 2 ? '✕' : ''}</td>
      <td class="center ${ratingCol === 3 ? 'score-2' : ''}">${ratingCol === 3 ? '✕' : ''}</td>
      <td class="center ${ratingCol === 4 ? 'score-3' : ''}">${ratingCol === 4 ? '✕' : ''}</td>
      <td class="center ${ratingCol === 5 ? 'score-4' : ''}">${ratingCol === 5 ? '✕' : ''}</td>
    </tr>
      `;
    }).join('')}
  </table>

  <table>
    <tr>
      <td class="navy center" colspan="6">REVISIÓN DE FACTORES CONDUCTUALES Y HABILIDADES TÉCNICAS</td>
    </tr>
    <tr class="navy center" style="font-size: 9px;">
      <td style="width: 40px;">No.</td>
      <td>Conductas/Habilidades</td>
      <td style="width: 80px;">Debajo de Expectativas</td>
      <td style="width: 80px;">Desempeño a Mejorar</td>
      <td style="width: 80px;">Cumple Expectativas</td>
      <td style="width: 80px;">Supera Expectativas</td>
    </tr>
    ${form.skill_reviews.map((r, i) => {
      const ratingCol = r.rating === 'below_expectations' ? 2 : r.rating === 'needs_improvement' ? 3 : r.rating === 'meets_expectations' ? 4 : r.rating === 'exceeds_expectations' ? 5 : 0;
      return `
    <tr style="height: 50px;">
      <td class="num">${i + 1}</td>
      <td>${r.result || form.skills[i]?.name || ''}</td>
      <td class="center ${ratingCol === 2 ? 'score-1' : ''}">${ratingCol === 2 ? '✕' : ''}</td>
      <td class="center ${ratingCol === 3 ? 'score-2' : ''}">${ratingCol === 3 ? '✕' : ''}</td>
      <td class="center ${ratingCol === 4 ? 'score-3' : ''}">${ratingCol === 4 ? '✕' : ''}</td>
      <td class="center ${ratingCol === 5 ? 'score-4' : ''}">${ratingCol === 5 ? '✕' : ''}</td>
    </tr>
      `;
    }).join('')}
  </table>

  <div style="margin: 30px 0; display: flex; justify-content: space-between;">
    <div style="width: 30%; text-align: center;">
      <div class="signature-line"></div>
      <div style="margin-top: 5px; font-size: 10px;">Firma del Colaborador</div>
    </div>
    <div style="width: 30%; text-align: center;">
      <div class="signature-line"></div>
      <div style="margin-top: 5px; font-size: 10px;">Firma del Jefe Inmediato</div>
    </div>
    <div style="width: 30%; text-align: center;">
      <div class="signature-line"></div>
      <div style="margin-top: 5px; font-size: 10px;">Firma RRHH</div>
    </div>
  </div>
  ` : ''}
</body>
</html>
    `;
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      draft: { label: 'BORRADOR', color: '#616161', bg: '#f5f5f5' },
      pending_employee: { label: 'PEND. EMPLEADO', color: '#1565c0', bg: '#e3f2fd' },
      pending_manager: { label: 'PEND. JEFE', color: '#6a1b9a', bg: '#f3e5f5' },
      pending_rrhh: { label: 'PEND. RRHH', color: '#e65100', bg: '#fff3e0' },
      completed: { label: 'COMPLETADA', color: '#1b5e20', bg: '#e8f5e9' },
    };

    const status = statusConfig[form.status] || statusConfig.draft;
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        color: status.color,
        background: status.bg,
        letterSpacing: '0.5px',
      }}>
        {status.label}
      </span>
    );
  };

  const getRatingLabel = (rating: Rating) => {
    const labels: Record<string, { label: string; color: string; bg: string }> = {
      below_expectations: { label: 'Debajo de Expectativas', color: '#b71c1c', bg: '#fce4ec' },
      needs_improvement: { label: 'Desempeño a Mejorar', color: '#e65100', bg: '#fff3e0' },
      meets_expectations: { label: 'Cumple Expectativas', color: '#1b5e20', bg: '#e8f5e9' },
      exceeds_expectations: { label: 'Supera Expectativas', color: '#0d47a1', bg: '#e3f2fd' },
    };
    return labels[rating] || null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#1a3f6f',
        color: '#fff',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>PLIHSA</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            Definición de Factores y Revisión del Desempeño Administrativo
          </div>
          <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>
            Código: PL-RH-P-002-F01 · V01
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {getStatusBadge()}
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f57c00',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fff',
              color: '#1a3f6f',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <Printer size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e0e0e0',
            overflowX: 'auto',
          }}>
            {[
              { num: 1, icon: FileText, label: 'Datos Generales' },
              { num: 2, icon: Target, label: 'Metas Individuales' },
              { num: 3, icon: Award, label: 'Competencias' },
              { num: 4, icon: FileText, label: 'Revisión' },
              { num: 5, icon: MessageSquare, label: 'Comentarios' },
            ].map(({ num, icon: Icon, label }) => (
              <button
                key={num}
                onClick={() => setActiveTab(num)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px 20px',
                  background: activeTab === num ? '#1a3f6f' : 'transparent',
                  color: activeTab === num ? '#fff' : '#616161',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === num ? '3px solid #f57c00' : 'none',
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '32px' }}>
            {activeTab === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                      <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Período de Evaluación *
                    </label>
                    <select
                      value={form.period_id}
                      onChange={(e) => handlePeriodSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <option value="">Seleccionar período...</option>
                      {periods.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                      <Users size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Nombre del Colaborador *
                    </label>
                    <select
                      value={form.employee_id}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <option value="">Seleccionar colaborador...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.first_name} {e.last_name} - {e.position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedEmployee && (
                  <div style={{
                    background: '#e8f5e9',
                    border: '1px solid #81c784',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#1a3f6f',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '700',
                    }}>
                      {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a3f6f' }}>
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#616161', marginTop: '2px' }}>
                        {selectedEmployee.employee_code} · {selectedEmployee.position}
                      </div>
                      <div style={{ fontSize: '12px', color: '#616161', marginTop: '2px' }}>
                        {selectedEmployee.departments?.name} · {selectedEmployee.work_locations?.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#616161' }}>
                      Fecha de ingreso:<br />
                      <strong>{selectedEmployee.hire_date ? formatDate(selectedEmployee.hire_date) : 'N/A'}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                      <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Fecha Definición de Factores *
                    </label>
                    <input
                      type="date"
                      value={form.definition_date}
                      onChange={(e) => setForm({ ...form, definition_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                      <Users size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Jefe Inmediato *
                    </label>
                    <select
                      value={form.manager_id}
                      onChange={(e) => handleManagerSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <option value="">Seleccionar jefe inmediato...</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name} - {m.position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3f6f', marginBottom: '20px' }}>
                  Metas Individuales
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3f6f', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>No.</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Metas Individuales</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Medición y Resultados Esperados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.goals.map((goal, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '15px', color: '#1a3f6f' }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <textarea
                            value={goal.description}
                            onChange={(e) => {
                              const newGoals = [...form.goals];
                              newGoals[i].description = e.target.value;
                              setForm({ ...form, goals: newGoals });
                            }}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d0d0d0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              resize: 'vertical',
                            }}
                            placeholder="Describir la meta..."
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <textarea
                            value={goal.measurement}
                            onChange={(e) => {
                              const newGoals = [...form.goals];
                              newGoals[i].measurement = e.target.value;
                              setForm({ ...form, goals: newGoals });
                            }}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d0d0d0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              resize: 'vertical',
                            }}
                            placeholder="Cómo se medirá..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 3 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3f6f', marginBottom: '20px' }}>
                  Competencias Conductuales y Habilidades Técnicas
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3f6f', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>No.</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Conductas/Habilidades - Definir las 5 Principales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.skills.map((skill, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '15px', color: '#1a3f6f' }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => {
                              const newSkills = [...form.skills];
                              newSkills[i].name = e.target.value;
                              setForm({ ...form, skills: newSkills });
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #d0d0d0',
                              borderRadius: '4px',
                              fontSize: '13px',
                            }}
                            placeholder="Nombre de la competencia/habilidad..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 4 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Fecha de Revisión
                  </label>
                  <input
                    type="date"
                    value={form.review_date}
                    onChange={(e) => setForm({ ...form, review_date: e.target.value })}
                    style={{
                      width: '300px',
                      padding: '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3f6f', marginBottom: '16px' }}>
                  Revisión de Metas Individuales
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                  <thead>
                    <tr style={{ background: '#1a3f6f', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>No.</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Metas/Resultados</th>
                      <th style={{ padding: '12px', textAlign: 'left', width: '200px' }}>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.goal_reviews.map((review, i) => {
                      const ratingLabel = review.rating ? getRatingLabel(review.rating) : null;
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid #e0e0e0',
                          background: ratingLabel?.bg || 'transparent',
                        }}>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '15px', color: '#1a3f6f' }}>
                            {i + 1}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {form.goals[i]?.description && (
                              <div style={{ fontSize: '11px', color: '#757575', marginBottom: '6px', fontStyle: 'italic' }}>
                                Meta: {form.goals[i].description}
                              </div>
                            )}
                            <textarea
                              value={review.result}
                              onChange={(e) => {
                                const newReviews = [...form.goal_reviews];
                                newReviews[i].result = e.target.value;
                                setForm({ ...form, goal_reviews: newReviews });
                              }}
                              rows={2}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #d0d0d0',
                                borderRadius: '4px',
                                fontSize: '13px',
                                resize: 'vertical',
                              }}
                              placeholder="Resultados alcanzados..."
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select
                              value={review.rating}
                              onChange={(e) => {
                                const newReviews = [...form.goal_reviews];
                                newReviews[i].rating = e.target.value as Rating;
                                setForm({ ...form, goal_reviews: newReviews });
                              }}
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #d0d0d0',
                                borderRadius: '4px',
                                fontSize: '13px',
                              }}
                            >
                              <option value="">Seleccionar...</option>
                              <option value="below_expectations">Debajo de Expectativas</option>
                              <option value="needs_improvement">Desempeño a Mejorar</option>
                              <option value="meets_expectations">Cumple Expectativas</option>
                              <option value="exceeds_expectations">Supera Expectativas</option>
                            </select>
                            {ratingLabel && (
                              <div style={{
                                marginTop: '6px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: ratingLabel.color,
                                textAlign: 'center',
                              }}>
                                {ratingLabel.label}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3f6f', marginBottom: '16px' }}>
                  Revisión de Factores Conductuales y Habilidades Técnicas
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3f6f', color: '#fff' }}>
                      <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>No.</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Conductas/Habilidades</th>
                      <th style={{ padding: '12px', textAlign: 'left', width: '200px' }}>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.skill_reviews.map((review, i) => {
                      const ratingLabel = review.rating ? getRatingLabel(review.rating) : null;
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid #e0e0e0',
                          background: ratingLabel?.bg || 'transparent',
                        }}>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '15px', color: '#1a3f6f' }}>
                            {i + 1}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {form.skills[i]?.name && (
                              <div style={{ fontSize: '11px', color: '#757575', marginBottom: '6px', fontStyle: 'italic' }}>
                                Habilidad: {form.skills[i].name}
                              </div>
                            )}
                            <textarea
                              value={review.result}
                              onChange={(e) => {
                                const newReviews = [...form.skill_reviews];
                                newReviews[i].result = e.target.value;
                                setForm({ ...form, skill_reviews: newReviews });
                              }}
                              rows={2}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #d0d0d0',
                                borderRadius: '4px',
                                fontSize: '13px',
                                resize: 'vertical',
                              }}
                              placeholder="Evaluación de la habilidad..."
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select
                              value={review.rating}
                              onChange={(e) => {
                                const newReviews = [...form.skill_reviews];
                                newReviews[i].rating = e.target.value as Rating;
                                setForm({ ...form, skill_reviews: newReviews });
                              }}
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #d0d0d0',
                                borderRadius: '4px',
                                fontSize: '13px',
                              }}
                            >
                              <option value="">Seleccionar...</option>
                              <option value="below_expectations">Debajo de Expectativas</option>
                              <option value="needs_improvement">Desempeño a Mejorar</option>
                              <option value="meets_expectations">Cumple Expectativas</option>
                              <option value="exceeds_expectations">Supera Expectativas</option>
                            </select>
                            {ratingLabel && (
                              <div style={{
                                marginTop: '6px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: ratingLabel.color,
                                textAlign: 'center',
                              }}>
                                {ratingLabel.label}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 5 && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a3f6f', marginBottom: '20px' }}>
                  Comentarios y Firmas
                </h3>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                    Comentarios del Jefe Inmediato
                  </label>
                  <textarea
                    value={form.manager_comments}
                    onChange={(e) => setForm({ ...form, manager_comments: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                    placeholder="Comentarios generales del jefe inmediato sobre el desempeño..."
                  />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#424242', marginBottom: '8px' }}>
                    Comentarios del Colaborador
                  </label>
                  <textarea
                    value={form.employee_comments}
                    onChange={(e) => setForm({ ...form, employee_comments: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                    placeholder="Comentarios del colaborador sobre su desempeño y desarrollo..."
                  />
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#424242', marginBottom: '16px' }}>
                  Estado de Firmas
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#424242' }}>Firma Colaborador</div>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '4px' }}>Pendiente</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#424242' }}>Firma Jefe Inmediato</div>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '4px' }}>Pendiente</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#424242' }}>Firma RRHH</div>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '4px' }}>Pendiente</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          background: toast.type === 'error' ? '#c62828' : toast.type === 'info' ? '#1565c0' : '#2e7d32',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
