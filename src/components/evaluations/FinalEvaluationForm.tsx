import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Save, Search, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

type Goal = {
  number: number;
  description: string;
  result: string;
  score: string;
  managerComments: string;
  employeeComments: string;
};

type EmployeeType = 'administrativo' | 'operativo';

interface FinalEvaluationFormProps {
  employeeType: EmployeeType;
  onBack: () => void;
}

const scoreOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
const createGoal = (number: number): Goal => ({ number, description: '', result: '', score: '', managerComments: '', employeeComments: '' });

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

export function FinalEvaluationForm({ employeeType, onBack }: FinalEvaluationFormProps) {
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
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => { loadEmployees(); }, [employeeType, activeCompany?.id, systemUser?.role]);

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
  const tenure = useMemo(() => calculateTenure(hireDate), [hireDate]);

  const updateGoal = (index: number, key: keyof Goal, value: string) => {
    setGoals((current) => current.map((goal, goalIndex) => goalIndex === index ? { ...goal, [key]: value } : goal));
  };

  const handleSaveDraft = () => {
    if (!selectedEmployee) { setMessage('Debe seleccionar un colaborador antes de guardar.'); setMessageType('error'); return; }
    setMessage('Borrador listo. La conexión con la base de datos se completará en la siguiente etapa.');
    setMessageType('success');
  };

  return (
    <div className="min-h-full bg-slate-100 px-2 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden border border-slate-400 bg-white text-slate-900 shadow-sm">
        <DocumentHeader employeeType={employeeType} />

        <section className="border-b border-slate-400 bg-slate-50 p-4">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Seleccionar colaborador</label>
          <div className="relative">
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
        </section>

        <section className="text-sm font-semibold">
          <InfoRow label="Nombre del Colaborador:" value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''} onChange={() => {}} readOnly />
          <InfoRow label="Posición del Colaborador:" value={position} onChange={setPosition} readOnly={!!selectedEmployee} />
          <div className="grid grid-cols-2 max-md:grid-cols-1"><InfoRow label="Departamento:" value={department} onChange={setDepartment} readOnly={!!selectedEmployee} /><InfoRow label="Sub-departamento:" value={subDepartment} onChange={setSubDepartment} readOnly={!!selectedEmployee} /></div>
          <div className="grid grid-cols-2 max-md:grid-cols-1"><div className="grid grid-cols-[245px_1fr] max-md:grid-cols-[175px_1fr]"><BlueLabel>Fecha de Antigüedad<br /><span className="text-xs">(Día | Mes | Año)</span></BlueLabel><input type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} readOnly={!!selectedEmployee} className="min-h-[68px] bg-[#d9d9d9] px-3 text-sm font-normal outline-none" /></div><div className="grid grid-cols-[1fr_166px] max-md:grid-cols-[175px_1fr]"><BlueLabel>Tiempo en la posición actual:</BlueLabel><div className="grid grid-cols-2 bg-[#d9d9d9] text-center text-xs"><div className="border-l border-slate-400 p-2">Año<div className="mt-2 h-8 border-t border-slate-400">{tenure.split(' ')[0] !== 'Sin' ? tenure.split(' ')[0] : ''}</div></div><div className="border-l border-slate-400 p-2">Meses<div className="mt-2 h-8 border-t border-slate-400">{tenure.includes('mes') ? tenure.split(' ').at(-2) : ''}</div></div></div></div></div>
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

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-400 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white"><ChevronLeft className="h-4 w-4" /> Volver</button>
          <div className="flex items-center gap-3"><span className="text-sm text-slate-500">{scoredGoals.length}/5 metas calificadas</span><button onClick={handleSaveDraft} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Save className="h-4 w-4" /> Guardar borrador</button></div>
        </footer>
        {message && <div className={`border-t px-4 py-3 text-sm font-medium ${messageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</div>}
      </div>
    </div>
  );
}

function DocumentHeader({ employeeType }: { employeeType: EmployeeType }) {
  const title = employeeType === 'administrativo' ? 'Evaluación del Desempeño Administrativo' : 'Evaluación del Desempeño Operativo';
  return <header className="grid min-h-[92px] grid-cols-[190px_1fr_240px] border-b border-slate-400 max-md:grid-cols-[130px_1fr]"><div className="flex items-center justify-center border-r border-slate-400 p-3"><div className="flex h-16 w-44 items-center justify-center rounded-full bg-[#4e8ac7] text-3xl font-bold tracking-tight text-white max-md:h-12 max-md:w-28 max-md:text-xl">PLIHSA</div></div><div className="flex items-center justify-center p-4 text-center"><h1 className="text-xl font-semibold max-sm:text-base">{title}</h1></div><div className="border-l border-slate-400 text-xs max-md:col-span-2 max-md:grid max-md:grid-cols-3 max-md:border-l-0"><DocMeta label="Código" value="PL-RH-P-002-F02" /><DocMeta label="Versión" value="01" /><DocMeta label="Fecha de Revisión" value="09/07/2025" /></div></header>;
}

function DocMeta({ label, value }: { label: string; value: string }) { return <div className="flex gap-1 border-b border-slate-300 p-2 last:border-b-0"><span className="font-semibold">{label}:</span><span>{value}</span></div>; }
function BlueLabel({ children }: { children: React.ReactNode }) { return <div className="flex items-center bg-[#24557e] px-2 py-2 text-white">{children}</div>; }
function SectionTitle({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) { return <div className={`bg-[#24557e] px-2 py-1.5 text-xs font-bold text-white ${centered ? 'text-center' : ''}`}>{children}</div>; }
function InfoRow({ label, value, onChange, readOnly = false }: { label: string; value: string; onChange: (value: string) => void; readOnly?: boolean }) { return <div className="grid grid-cols-[245px_1fr] border-b border-slate-400 max-md:grid-cols-[175px_1fr]"><BlueLabel>{label}</BlueLabel><input value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} className="bg-[#d9d9d9] px-3 py-2 text-sm font-normal outline-none focus:bg-white" /></div>; }

function GoalBlock({ goal, onChange }: { goal: Goal; onChange: (key: keyof Goal, value: string) => void }) {
  return <div className="grid grid-cols-[195px_235px_1fr] border-t border-slate-400 max-md:grid-cols-1"><div className="bg-[#24557e] text-[11px] font-bold leading-tight text-white"><div className="min-h-[32px] border-b border-white/30 p-2">Calificación Escala Numérica</div><div className="min-h-[76px] border-b border-white/30 p-2">Calificación según el criterio de la escala</div><div className="min-h-[56px] border-b border-white/30 p-2">Comentarios Jefe Inmediato</div><div className="min-h-[56px] p-2">Comentarios del Colaborador</div></div><div className="border-r border-slate-400 bg-white text-xs max-md:border-r-0"><div className="min-h-[32px] border-b border-slate-400 p-2"><label className="font-semibold">Puntaje de la meta {goal.number}<select value={goal.score} onChange={(event) => onChange('score', event.target.value)} className="ml-2 rounded border border-slate-300 px-1 py-0.5 font-semibold outline-none focus:border-blue-700"><option value="">—</option>{scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}</select></label></div><div className="min-h-[76px] border-b border-slate-400 p-2 text-slate-500">{criterionLabel(goal.score)}</div><textarea aria-label={`Comentarios del jefe para meta ${goal.number}`} rows={3} value={goal.managerComments} onChange={(event) => onChange('managerComments', event.target.value)} className="block min-h-[56px] w-full resize-none border-b border-slate-400 p-2 outline-none focus:bg-blue-50" /><textarea aria-label={`Comentarios del colaborador para meta ${goal.number}`} rows={3} value={goal.employeeComments} onChange={(event) => onChange('employeeComments', event.target.value)} className="block min-h-[56px] w-full resize-none p-2 outline-none focus:bg-blue-50" /></div><div className="min-w-0"><div className="min-h-[32px] border-b border-slate-400 bg-[#24557e] p-2 text-xs font-bold text-white">Meta <span className="block text-center">No. {goal.number}</span></div><div className="border-b border-slate-400 p-2 text-xs font-bold">Medición y Resultados:<textarea rows={4} value={goal.result} onChange={(event) => onChange('result', event.target.value)} placeholder="Describa la medición y los resultados obtenidos" className="mt-1 block min-h-[72px] w-full resize-none border border-slate-200 p-2 text-xs font-normal outline-none focus:border-blue-700" /></div><label className="block p-2 text-xs font-bold">Descripción de la meta<textarea rows={3} value={goal.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Escriba aquí la meta definida" className="mt-1 block min-h-[52px] w-full resize-none border border-slate-200 p-2 text-xs font-normal outline-none focus:border-blue-700" /></label></div></div>;
}

function criterionLabel(score: string): string { const value = Number(score); if (!value) return 'Seleccione una calificación para mostrar el criterio.'; if (value === 10) return 'Excede Expectativas'; if (value >= 8) return 'Cumple Expectativas'; if (value >= 6) return 'Desempeño a Mejorar'; return 'Debajo de Expectativas'; }
function calculateTenure(value: string): string { if (!value) return 'Sin registrar'; const start = new Date(`${value}T00:00:00`); const now = new Date(); let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth(); if (now.getDate() < start.getDate()) months -= 1; if (months < 0) return 'Sin registrar'; const years = Math.floor(months / 12); const remainder = months % 12; return years ? `${years} año${years === 1 ? '' : 's'}${remainder ? ` y ${remainder} mes${remainder === 1 ? '' : 'es'}` : ''}` : `${remainder} mes${remainder === 1 ? '' : 'es'}`; }
