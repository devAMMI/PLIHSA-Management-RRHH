import { useEffect, useState } from 'react';
import { Users, ClipboardCheck, Building2, TrendingUp, Search, FileText, Briefcase, MapPin, Calendar, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { DigitalClock } from '../ui/DigitalClock';
import EvaluacionAdministrativa from '../evaluations/EvaluacionAdministrativa';

interface Stats {
  totalEmployees: number;
  activeEvaluations: number;
  companies: number;
  completionRate: number;
}

interface Evaluation {
  id: string;
  status: string;
  created_at: string;
  definition_date: string;
  employee_id: string;
  evaluation_period_id: string;
  employees: {
    first_name: string;
    last_name: string;
    employee_code: string;
    position: string;
    departments: { name: string };
    work_locations: { name: string };
  };
  evaluation_periods: {
    name: string;
    period_number: number;
    year: number;
  };
}

interface EvalStats {
  total: number;
  completed: number;
  drafts: number;
  pending: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:            { label: 'Borrador',       color: 'text-slate-600',  bg: 'bg-slate-100',   dot: 'bg-slate-400' },
  pending_employee: { label: 'Pend. Empleado', color: 'text-blue-700',   bg: 'bg-blue-50',     dot: 'bg-blue-500' },
  pending_manager:  { label: 'Pend. Jefe',     color: 'text-amber-700',  bg: 'bg-amber-50',    dot: 'bg-amber-500' },
  pending_rrhh:     { label: 'Pend. RRHH',     color: 'text-orange-700', bg: 'bg-orange-50',   dot: 'bg-orange-500' },
  completed:        { label: 'Completada',      color: 'text-green-700',  bg: 'bg-green-50',    dot: 'bg-green-500' },
};

export function Dashboard() {
  const { activeCompany } = useCompany();
  const { systemUser } = useAuth();

  const [stats, setStats] = useState<Stats>({ totalEmployees: 0, activeEvaluations: 0, companies: 4, completionRate: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [evalStats, setEvalStats] = useState<EvalStats>({ total: 0, completed: 0, drafts: 0, pending: 0 });
  const [evalsLoading, setEvalsLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const canSeeEvaluations = systemUser && ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'].includes(systemUser.role);

  useEffect(() => {
    if (activeCompany) {
      loadStats();
      if (canSeeEvaluations) {
        loadEvaluations();
        loadPeriods();
      }
    }
  }, [activeCompany]);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, searchTerm, statusFilter, periodFilter]);

  const loadStats = async () => {
    try {
      if (!activeCompany) return;
      const { count: employeeCount } = await supabase
        .from('employees').select('*', { count: 'exact', head: true })
        .eq('company_id', activeCompany.id).eq('status', 'active');

      const [adminActive, operativeActive] = await Promise.all([
        supabase.from('administrative_evaluations')
          .select('employee:employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', activeCompany.id)
          .in('status', ['draft', 'pending_employee', 'pending_manager', 'pending_rrhh']),
        supabase.from('operative_evaluations')
          .select('employee:employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', activeCompany.id)
          .in('status', ['draft', 'pending_employee', 'pending_manager', 'pending_rrhh']),
      ]);

      const [adminCompleted, operativeCompleted, adminTotal, operativeTotal] = await Promise.all([
        supabase.from('administrative_evaluations')
          .select('employee:employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', activeCompany.id).eq('status', 'completed'),
        supabase.from('operative_evaluations')
          .select('employee:employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', activeCompany.id).eq('status', 'completed'),
        supabase.from('administrative_evaluations')
          .select('employee:employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', activeCompany.id),
        supabase.from('operative_evaluations')
          .select('employee:employees!inner(company_id)', { count: 'exact', head: true })
          .eq('employees.company_id', activeCompany.id),
      ]);

      const totalEvals = (adminTotal.count || 0) + (operativeTotal.count || 0);
      const completedCount = (adminCompleted.count || 0) + (operativeCompleted.count || 0);

      setStats({
        totalEmployees: employeeCount || 0,
        activeEvaluations: (adminActive.count || 0) + (operativeActive.count || 0),
        companies: 4,
        completionRate: totalEvals ? Math.round((completedCount / totalEvals) * 100) : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPeriods = async () => {
    if (!activeCompany) return;
    try {
      const { data } = await supabase
        .from('evaluation_periods').select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false });
      setPeriods(data || []);
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const loadEvaluations = async () => {
    try {
      setEvalsLoading(true);
      const { data, error } = await supabase
        .from('administrative_evaluations')
        .select(`
          id, status, created_at, definition_date,
          employee_id, evaluation_period_id,
          employees!administrative_evaluations_employee_id_fkey (
            first_name, last_name, employee_code, position,
            departments(name),
            work_locations(name)
          ),
          evaluation_periods(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = data || [];
      setEvaluations(list);

      setEvalStats({
        total: list.length,
        completed: list.filter(e => e.status === 'completed').length,
        drafts: list.filter(e => e.status === 'draft').length,
        pending: list.filter(e => ['pending_employee', 'pending_manager', 'pending_rrhh'].includes(e.status)).length,
      });
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setEvalsLoading(false);
    }
  };

  const filterEvaluations = () => {
    let filtered = [...evaluations];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.employees?.first_name?.toLowerCase().includes(term) ||
        e.employees?.last_name?.toLowerCase().includes(term) ||
        e.employees?.employee_code?.toLowerCase().includes(term) ||
        e.employees?.position?.toLowerCase().includes(term)
      );
    }
    if (statusFilter) filtered = filtered.filter(e => e.status === statusFilter);
    if (periodFilter) filtered = filtered.filter(e => e.evaluation_period_id === periodFilter);
    setFilteredEvaluations(filtered);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPeriodFilter('');
  };

  const hasFilters = searchTerm || statusFilter || periodFilter;

  if (editingId) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { setEditingId(null); loadEvaluations(); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            ← Volver al Dashboard
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <EvaluacionAdministrativa evaluationId={editingId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-lg mb-4" />
              <div className="h-3 bg-slate-200 rounded w-24 mb-2" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          ))
        ) : (
          [
            { title: 'Total Empleados',     value: stats.totalEmployees,          icon: Users,          color: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-600' },
            { title: 'Evaluaciones Activas', value: stats.activeEvaluations,       icon: ClipboardCheck, color: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-600' },
            { title: 'Empresas',            value: stats.companies,               icon: Building2,      color: 'bg-sky-500',    light: 'bg-sky-50',    text: 'text-sky-600' },
            { title: 'Tasa de Completitud', value: `${stats.completionRate}%`,    icon: TrendingUp,     color: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className={`${card.light} w-11 h-11 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-slate-800">{card.value}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Empresas del Grupo AMMI</h3>
          <div className="space-y-3">
            {[
              { name: 'AMMI',      logo: 'https://i.imgur.com/F0RKq8C.png' },
              { name: 'PLIHSA',   logo: 'https://plihsa.com/wp-content/uploads/2023/02/Plihsa_Logo_Azul.svg' },
              { name: 'PTM',       logo: 'https://i.imgur.com/FpiAvCx.png' },
              { name: 'MillFoods', logo: 'https://i.imgur.com/kAzFS5n.png' },
            ].map((company) => (
              <div key={company.name} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain" />
                <span className="font-medium text-slate-700">{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Ciclo de Evaluaciones {new Date().getFullYear()}</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Definición de Metas</h4>
                <p className="text-xs text-slate-500 mt-0.5">Enero — Febrero</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Fase 1</span>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Revisión de Metas</h4>
                <p className="text-xs text-slate-500 mt-0.5">Junio — Julio</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Fase 2</span>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-orange-50 border border-orange-100">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Evaluación Final</h4>
                <p className="text-xs text-slate-500 mt-0.5">Diciembre</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Fase 3</span>
            </div>
          </div>
        </div>
      </div>

      {canSeeEvaluations && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Evaluaciones Administrativas</h3>
            <p className="text-sm text-slate-500 mt-0.5">Gestión de evaluaciones de desempeño para personal administrativo</p>
          </div>

          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
            {[
              { label: 'Total',        value: evalStats.total,     color: 'text-slate-800' },
              { label: 'Completadas',  value: evalStats.completed, color: 'text-green-600' },
              { label: 'Borradores',   value: evalStats.drafts,    color: 'text-slate-500' },
              { label: 'Pendientes',   value: evalStats.pending,   color: 'text-orange-600' },
            ].map((s) => (
              <div key={s.label} className="px-6 py-4 text-center">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{evalsLoading ? '—' : s.value}</p>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[160px]"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="pending_employee">Pend. Empleado</option>
                <option value="pending_manager">Pend. Jefe</option>
                <option value="pending_rrhh">Pend. RRHH</option>
                <option value="completed">Completada</option>
              </select>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white min-w-[200px]"
              >
                <option value="">Todos los períodos</option>
                {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {evalsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-slate-200 rounded w-20" />
                      </div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No se encontraron evaluaciones</p>
                <p className="text-slate-400 text-sm">
                  {hasFilters ? 'Intenta cambiar los filtros de búsqueda' : 'Aún no hay evaluaciones registradas'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEvaluations.map(evaluation => {
                  const sc = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.draft;
                  const emp = evaluation.employees;
                  const initials = `${emp?.first_name?.[0] || ''}${emp?.last_name?.[0] || ''}`;

                  return (
                    <div
                      key={evaluation.id}
                      className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {emp?.first_name} {emp?.last_name}
                          </p>
                          <p className="text-xs text-slate-400">{emp?.employee_code}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium">{emp?.position || 'Sin posición'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{emp?.departments?.name} · {emp?.work_locations?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{evaluation.evaluation_periods?.name || 'Sin período'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <button
                          onClick={() => setEditingId(evaluation.id)}
                          className="px-3 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <DigitalClock />
    </div>
  );
}
