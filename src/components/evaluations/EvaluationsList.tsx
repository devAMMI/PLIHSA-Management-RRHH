import { useState, useEffect } from 'react';
import { FileText, Eye, Calendar, User, Briefcase, Filter, Download, CreditCard as Edit, Building2, X, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EvaluationDetailModal } from './EvaluationDetailModal';

interface Evaluation {
  id: string;
  status: string;
  created_at: string;
  employee_name: string;
  employee_id: string;
  position: string;
  employee_type: string;
  period_name: string;
  department: string;
  company_name: string;
  company_id: string;
  plant_name: string;
}

interface Company {
  id: string;
  name: string;
}

interface EvaluationsListProps {
  evaluationType?: 'administrative' | 'operative';
  onBack?: () => void;
  onNewEvaluation?: () => void;
}

export function EvaluationsList({ evaluationType, onBack, onNewEvaluation }: EvaluationsListProps = {}) {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const initialFilter = evaluationType === 'administrative' ? 'administrativo' : evaluationType === 'operative' ? 'operativo' : 'all';
  const [filter, setFilter] = useState<'all' | 'administrativo' | 'operativo'>(initialFilter);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    loadCompanies();
    loadEvaluations();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadEvaluations = async () => {
    try {
      const [adminResult, operativeResult] = await Promise.all([
        supabase
          .from('administrative_evaluations')
          .select(`
            id,
            status,
            created_at,
            department,
            employee_id,
            evaluation_period_id,
            employees!inner (
              id,
              first_name,
              last_name,
              position,
              employee_type,
              company_id,
              department_id,
              plant_id
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('operative_evaluations')
          .select(`
            id,
            status,
            created_at,
            department,
            employee_id,
            evaluation_period_id,
            employees!inner (
              id,
              first_name,
              last_name,
              position,
              employee_type,
              company_id,
              department_id,
              plant_id
            )
          `)
          .order('created_at', { ascending: false })
      ]);

      if (adminResult.error) {
        console.error('Error loading administrative evaluations:', adminResult.error);
      }

      if (operativeResult.error) {
        console.error('Error loading operative evaluations:', operativeResult.error);
      }

      const [companiesResult, departmentsResult, plantsResult, periodsResult] = await Promise.all([
        supabase.from('companies').select('id, name'),
        supabase.from('departments').select('id, name'),
        supabase.from('plants').select('id, name'),
        supabase.from('evaluation_periods').select('id, name')
      ]);

      const companiesMap = new Map((companiesResult.data || []).map(c => [c.id, c.name]));
      const departmentsMap = new Map((departmentsResult.data || []).map(d => [d.id, d.name]));
      const plantsMap = new Map((plantsResult.data || []).map(p => [p.id, p.name]));
      const periodsMap = new Map((periodsResult.data || []).map(p => [p.id, p.name]));

      const adminEvals = (adminResult.data || []).map(item => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        employee_id: item.employees?.id || '',
        employee_name: `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`.trim(),
        position: item.employees?.position || '',
        employee_type: item.employees?.employee_type || 'administrativo',
        period_name: periodsMap.get(item.evaluation_period_id) || '',
        department: departmentsMap.get(item.employees?.department_id) || item.department || 'Sin departamento',
        company_name: companiesMap.get(item.employees?.company_id) || '',
        company_id: item.employees?.company_id || '',
        plant_name: plantsMap.get(item.employees?.plant_id) || ''
      }));

      const operativeEvals = (operativeResult.data || []).map(item => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        employee_id: item.employees?.id || '',
        employee_name: `${item.employees?.first_name || ''} ${item.employees?.last_name || ''}`.trim(),
        position: item.employees?.position || '',
        employee_type: item.employees?.employee_type || 'operativo',
        period_name: periodsMap.get(item.evaluation_period_id) || '',
        department: departmentsMap.get(item.employees?.department_id) || item.department || 'Sin departamento',
        company_name: companiesMap.get(item.employees?.company_id) || '',
        company_id: item.employees?.company_id || '',
        plant_name: plantsMap.get(item.employees?.plant_id) || ''
      }));

      setEvaluations([...adminEvals, ...operativeEvals].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700',
      pending_employee: 'bg-yellow-100 text-yellow-700',
      pending_manager: 'bg-orange-100 text-orange-700',
      pending_rrhh: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      submitted: 'bg-indigo-100 text-indigo-700',
      approved: 'bg-emerald-100 text-emerald-700'
    };

    const labels = {
      draft: 'Borrador',
      pending_employee: 'Pendiente Empleado',
      pending_manager: 'Pendiente Manager',
      pending_rrhh: 'Pendiente RRHH',
      completed: 'Completada',
      submitted: 'Enviada',
      approved: 'Aprobada'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const clearFilters = () => {
    setCompanyFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    const headers = ['Empleado', 'Posición', 'Tipo', 'Empresa', 'Departamento', 'Planta', 'Estado', 'Período', 'Fecha'];
    const rows = filteredEvaluations.map(e => [
      e.employee_name,
      e.position,
      e.employee_type,
      e.company_name,
      e.department,
      e.plant_name || 'N/A',
      e.status,
      e.period_name,
      new Date(e.created_at).toLocaleDateString('es-HN')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `evaluaciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (filter !== 'all' && evaluation.employee_type !== filter) return false;
    if (companyFilter !== 'all' && evaluation.company_id !== companyFilter) return false;
    if (statusFilter !== 'all' && evaluation.status !== statusFilter) return false;

    if (startDate) {
      const evalDate = new Date(evaluation.created_at);
      const start = new Date(startDate);
      if (evalDate < start) return false;
    }

    if (endDate) {
      const evalDate = new Date(evaluation.created_at);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (evalDate > end) return false;
    }

    return true;
  });

  if (loading) {
    return <div className="p-8">Cargando evaluaciones...</div>;
  }

  const getTitle = () => {
    if (evaluationType === 'administrative') return 'Evaluaciones de Empleados Administrativos';
    if (evaluationType === 'operative') return 'Evaluaciones de Empleados Operativos';
    return 'Evaluaciones Guardadas';
  };

  const getDescription = () => {
    if (evaluationType === 'administrative') return 'Visualiza y gestiona las evaluaciones de empleados administrativos';
    if (evaluationType === 'operative') return 'Visualiza y gestiona las evaluaciones de empleados operativos';
    return 'Visualiza y gestiona todas las evaluaciones del sistema';
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Volver"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{getTitle()}</h1>
            <p className="text-slate-600">{getDescription()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onNewEvaluation && (
            <button
              onClick={onNewEvaluation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredEvaluations.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filtros Avanzados</h3>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
              Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Empresa
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="submitted">Enviada</option>
                <option value="pending_employee">Pendiente Empleado</option>
                <option value="pending_manager">Pendiente Manager</option>
                <option value="pending_rrhh">Pendiente RRHH</option>
                <option value="completed">Completada</option>
                <option value="approved">Aprobada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {!evaluationType && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas ({evaluations.length})
          </button>
          <button
            onClick={() => setFilter('administrativo')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'administrativo'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Administrativas ({evaluations.filter(e => e.employee_type === 'administrativo').length})
          </button>
          <button
            onClick={() => setFilter('operativo')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'operativo'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Operativas ({evaluations.filter(e => e.employee_type === 'operativo').length})
          </button>
        </div>
      )}

      {filteredEvaluations.length > 0 && (
        <div className="mb-4 text-sm text-slate-600">
          Mostrando {filteredEvaluations.length} de {evaluations.length} evaluaciones
        </div>
      )}

      {filteredEvaluations.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay evaluaciones</h3>
          <p className="text-slate-600">No se encontraron evaluaciones con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{evaluation.employee_name}</h3>
                      <p className="text-sm text-slate-600">{evaluation.position}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{evaluation.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{evaluation.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span className="capitalize">{evaluation.employee_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(evaluation.created_at).toLocaleDateString('es-HN')}</span>
                    </div>
                  </div>

                  {evaluation.plant_name && (
                    <div className="mb-3 text-sm text-slate-500">
                      Planta: {evaluation.plant_name}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {getStatusBadge(evaluation.status)}
                    <span className="text-sm text-slate-500">{evaluation.period_name}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {evaluation.status === 'draft' && (
                    <button
                      onClick={() => setSelectedEvaluation(evaluation)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedEvaluation(evaluation)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvaluation && (
        <EvaluationDetailModal
          evaluationId={selectedEvaluation.id}
          evaluationType={selectedEvaluation.employee_type as 'administrativo' | 'operativo'}
          onClose={() => setSelectedEvaluation(null)}
        />
      )}
    </div>
  );
}
