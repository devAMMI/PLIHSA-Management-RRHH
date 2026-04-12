import { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, ChevronDown, User, Calendar, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface AuditLogEntry {
  id: string;
  action_type: 'created' | 'updated';
  evaluation_type: string;
  evaluation_id: string;
  performed_at: string;
  evaluator: {
    first_name: string;
    last_name: string;
    role: string;
  } | null;
  evaluator_employee: {
    first_name: string;
    last_name: string;
    position: string;
  } | null;
  evaluated_employee: {
    first_name: string;
    last_name: string;
    position: string;
    departments: { name: string } | null;
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  administrativa: 'Definicion de Metas — Administrativo',
  operativa: 'Definicion de Metas — Operativo',
  revision_junio_administrativa: 'Revision de Metas — Administrativo',
  revision_junio_operativa: 'Revision de Metas — Operativo',
};

const TYPE_COLORS: Record<string, string> = {
  administrativa: 'bg-blue-100 text-blue-700 border-blue-200',
  operativa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  revision_junio_administrativa: 'bg-amber-100 text-amber-700 border-amber-200',
  revision_junio_operativa: 'bg-orange-100 text-orange-700 border-orange-200',
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700 border-green-200',
  updated: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Creado',
  updated: 'Actualizado',
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  rrhh: 'RRHH',
  manager: 'Gerente',
  jefe: 'Jefe',
  employee: 'Empleado',
  viewer: 'Visor',
};

export function EvaluationAuditLog() {
  const { activeCompany } = useCompany();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [activeCompany]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluation_audit_logs')
        .select(`
          id,
          action_type,
          evaluation_type,
          evaluation_id,
          performed_at,
          evaluator:evaluator_system_user_id (
            first_name,
            last_name,
            role
          ),
          evaluator_employee:evaluator_employee_id (
            first_name,
            last_name,
            position
          ),
          evaluated_employee:evaluated_employee_id (
            first_name,
            last_name,
            position,
            departments (
              name
            )
          )
        `)
        .order('performed_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter(log => {
    const evaluatorName = log.evaluator
      ? `${log.evaluator.first_name} ${log.evaluator.last_name}`.toLowerCase()
      : '';
    const evaluatedName = log.evaluated_employee
      ? `${log.evaluated_employee.first_name} ${log.evaluated_employee.last_name}`.toLowerCase()
      : '';
    const searchLower = search.toLowerCase();

    const matchesSearch =
      !search ||
      evaluatorName.includes(searchLower) ||
      evaluatedName.includes(searchLower);

    const matchesType = filterType === 'all' || log.evaluation_type === filterType;
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;

    return matchesSearch && matchesType && matchesAction;
  });

  const groupedByDate = filteredLogs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const date = formatDate(log.performed_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Registro de Actividad</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Historial de quien evaluo a quien y en que momento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{filteredLogs.length} registros</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre del evaluador o evaluado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-slate-50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">Tipo de evaluacion</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todos los tipos</option>
                <option value="administrativa">Definicion de Metas — Admin</option>
                <option value="operativa">Definicion de Metas — Operativo</option>
                <option value="revision_junio_administrativa">Revision de Metas — Admin</option>
                <option value="revision_junio_operativa">Revision de Metas — Operativo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">Accion</label>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">Todas las acciones</option>
                <option value="created">Creado</option>
                <option value="updated">Actualizado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No hay registros de actividad</p>
            <p className="text-slate-400 text-sm mt-1">
              Los registros apareceran cuando se guarden evaluaciones
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDate).map(([date, entries]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-600">{date}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">{entries.length} {entries.length === 1 ? 'registro' : 'registros'}</span>
                </div>

                <div className="space-y-3">
                  {entries.map(log => {
                    const evaluatorName = log.evaluator
                      ? `${log.evaluator.first_name} ${log.evaluator.last_name}`
                      : 'Usuario desconocido';
                    const evaluatorRole = log.evaluator
                      ? ROLE_LABELS[log.evaluator.role] || log.evaluator.role
                      : '';
                    const evaluatorEmployee = log.evaluator_employee
                      ? `${log.evaluator_employee.first_name} ${log.evaluator_employee.last_name}`
                      : null;
                    const evaluatedName = log.evaluated_employee
                      ? `${log.evaluated_employee.first_name} ${log.evaluated_employee.last_name}`
                      : 'Empleado desconocido';
                    const evaluatedPosition = log.evaluated_employee?.position || '';
                    const evaluatedDept = log.evaluated_employee?.departments?.name || '';

                    return (
                      <div
                        key={log.id}
                        className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${ACTION_COLORS[log.action_type]}`}>
                                  {ACTION_LABELS[log.action_type]}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[log.evaluation_type]}`}>
                                  <Tag className="w-3 h-3" />
                                  {TYPE_LABELS[log.evaluation_type] || log.evaluation_type}
                                </span>
                              </div>

                              <p className="text-sm text-slate-800 leading-relaxed">
                                <span className="font-semibold text-blue-700">{evaluatorEmployee || evaluatorName}</span>
                                {' '}
                                <span className="text-slate-500">({evaluatorRole})</span>
                                {' '}
                                <span className="text-slate-600">
                                  {log.action_type === 'created' ? 'creo la evaluacion de' : 'actualizo la evaluacion de'}
                                </span>
                                {' '}
                                <span className="font-semibold text-slate-800">{evaluatedName}</span>
                              </p>

                              {(evaluatedPosition || evaluatedDept) && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {evaluatedPosition}{evaluatedPosition && evaluatedDept ? ' — ' : ''}{evaluatedDept}
                                </p>
                              )}

                              {evaluatorEmployee && evaluatorEmployee !== evaluatorName && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Usuario del sistema: {evaluatorName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-slate-600">{formatTime(log.performed_at)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">hrs</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
