import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Building2, Calendar, CheckCircle, Clock, Eye, FileText, Plus, Search, User, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type EmployeeType = 'administrativo' | 'operativo';
type StatusFilter = 'all' | 'draft' | 'completed';

type FinalEvaluation = {
  id: string;
  evaluation_code: string | null;
  evaluation_date: string | null;
  created_at: string;
  status: string;
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  position: string | null;
  department: string | null;
};

interface FinalEvaluationsListProps {
  employeeType: EmployeeType;
  statusFilter: StatusFilter;
  onBack: () => void;
  onNew: () => void;
  onEdit: (id: string) => void;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  draft: { label: 'En proceso', className: 'bg-amber-100 text-amber-800', icon: Clock },
  pending_employee: { label: 'En proceso', className: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  pending_manager: { label: 'En proceso', className: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  pending_rrhh: { label: 'En proceso', className: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  completed: { label: 'Finalizada', className: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export function FinalEvaluationsList({ employeeType, statusFilter, onBack, onNew, onEdit }: FinalEvaluationsListProps) {
  const { systemUser } = useAuth();
  const [evaluations, setEvaluations] = useState<FinalEvaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<FinalEvaluation[]>([]);
  const [numbers, setNumbers] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const table = employeeType === 'administrativo' ? 'final_administrative_evaluations' : 'operative_evaluations';
  const accent = employeeType === 'administrativo' ? 'teal' : 'orange';

  const loadEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      let subordinateIds: string[] | null = null;
      if (systemUser?.role === 'jefe' && systemUser.employee_id) {
        const { data } = await supabase.from('employees').select('id').eq('manager_id', systemUser.employee_id);
        subordinateIds = (data || []).map((item: { id: string }) => item.id);
      }

      const dateColumn = employeeType === 'administrativo' ? 'evaluation_date' : 'review_date';
      const employeeRelation = employeeType === 'administrativo'
        ? 'final_administrative_evaluations_employee_id_fkey'
        : 'operative_evaluations_employee_id_fkey';
      let query = supabase.from(table).select(`id, evaluation_code, ${dateColumn}, created_at, status, employee_id, employee:employees!${employeeRelation}(first_name, last_name, employee_code, position, department:departments(name))`).order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (subordinateIds) query = query.in('employee_id', subordinateIds);

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        evaluation_code: row.evaluation_code,
        evaluation_date: row.evaluation_date || row.review_date,
        created_at: row.created_at,
        status: row.status || 'draft',
        employee_id: row.employee_id,
        employee_name: row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : 'Sin nombre',
        employee_code: row.employee?.employee_code || null,
        position: row.employee?.position || null,
        department: row.employee?.department?.name || null,
      })) as FinalEvaluation[];

      const ordered = [...mapped].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const nextNumbers: Record<string, number> = {};
      ordered.forEach((item, index) => { nextNumbers[item.id] = index + 1; });
      setNumbers(nextNumbers);
      setEvaluations(mapped);
      setFilteredEvaluations(mapped);
    } catch (error) {
      console.error('Error loading final evaluations:', error);
      setEvaluations([]);
      setFilteredEvaluations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, systemUser, table]);

  useEffect(() => { loadEvaluations(); }, [loadEvaluations]);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    setFilteredEvaluations(term ? evaluations.filter((item) => [item.employee_name, item.employee_code, item.position, item.department, item.evaluation_code].some((value) => value?.toLowerCase().includes(term))) : evaluations);
  }, [evaluations, search]);

  const title = statusFilter === 'all' ? 'Todas las Evaluaciones' : statusFilter === 'draft' ? 'Borradores' : 'Finalizadas';
  const typeLabel = employeeType === 'administrativo' ? 'Administrativo' : 'Operativo';
  const TypeIcon = employeeType === 'administrativo' ? Building2 : Users;
  const accentClasses = accent === 'teal' ? { header: 'from-teal-600 to-teal-700', number: 'bg-teal-600', button: 'bg-teal-50 text-teal-700 hover:bg-teal-100', focus: 'focus:ring-teal-500/20' } : { header: 'from-orange-600 to-orange-700', number: 'bg-orange-600', button: 'bg-orange-50 text-orange-700 hover:bg-orange-100', focus: 'focus:ring-orange-500/20' };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <button onClick={onBack} className="mb-6 flex items-center text-slate-600 transition-colors hover:text-slate-800"><ArrowLeft className="mr-2 h-5 w-5" />Volver</button>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className={`bg-gradient-to-r px-8 py-6 ${accentClasses.header}`}>
            <div className="flex items-center justify-between gap-4">
              <div><h1 className="flex items-center gap-3 text-2xl font-bold text-white"><FileText className="h-8 w-8" />{title} — {typeLabel}</h1><p className="mt-1 text-white/80">{filteredEvaluations.length} evaluación{filteredEvaluations.length !== 1 ? 'es' : ''} registrada{filteredEvaluations.length !== 1 ? 's' : ''}</p><p className="mt-0.5 text-sm text-white/60">3ra Evaluación — Cierre del ciclo anual</p></div>
              <button onClick={onNew} className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"><Plus className="h-4 w-4" />Nueva Evaluación</button>
            </div>
          </div>
          <div className="p-6">
            <div className="relative mb-6"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código, posición o departamento..." className={`w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-300 focus:ring-2 ${accentClasses.focus}`} /></div>
            {loading ? <div className="py-12 text-center text-slate-600">Cargando evaluaciones...</div> : filteredEvaluations.length === 0 ? <div className="rounded-lg bg-slate-50 py-12 text-center"><FileText className="mx-auto mb-4 h-16 w-16 text-slate-400" /><p className="text-lg font-medium text-slate-600">{search ? 'No se encontraron resultados' : 'No hay evaluaciones registradas'}</p><p className="mt-2 text-slate-500">Las evaluaciones aparecerán aquí una vez sean guardadas.</p></div> : <div className="space-y-4">{filteredEvaluations.map((evaluation) => <EvaluationCard key={evaluation.id} evaluation={evaluation} number={numbers[evaluation.id]} accentClasses={accentClasses} onEdit={onEdit} />)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationCard({ evaluation, number, accentClasses, onEdit }: { evaluation: FinalEvaluation; number: number; accentClasses: { number: string; button: string }; onEdit: (id: string) => void }) {
  const config = statusConfig[evaluation.status] || statusConfig.draft;
  const StatusIcon = config.icon;
  const date = evaluation.evaluation_date ? new Date(`${evaluation.evaluation_date}T00:00:00`).toLocaleDateString('es-HN') : new Date(evaluation.created_at).toLocaleDateString('es-HN');
  return <div className="rounded-lg border border-slate-200 p-6 transition hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${accentClasses.number}`}>#{number}</span><h3 className="text-lg font-bold text-slate-800">{evaluation.employee_name}</h3><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}><StatusIcon className="h-3 w-3" />{config.label}</span></div><div className="mb-3 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3"><div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" />{evaluation.position || 'N/A'}</div><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" />{evaluation.department || 'N/A'}</div><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" />{date}</div></div><div className="flex flex-wrap gap-4 text-xs text-slate-500"><span>Evaluación: {evaluation.evaluation_code || `Final-${String(number).padStart(3, '0')}`}</span><span>Emp. Código: {evaluation.employee_code || '—'}</span></div></div><button onClick={() => onEdit(evaluation.id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${accentClasses.button}`}><Eye className="h-4 w-4" />Ver</button></div></div>;
}
