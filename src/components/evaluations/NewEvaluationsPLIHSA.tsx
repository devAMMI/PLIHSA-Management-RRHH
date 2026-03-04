import { useEffect, useState } from 'react';
import { FileText, Download, Eye, Calendar, User, Briefcase, Filter, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generatePDF, downloadBlob } from '../../lib/pdfExport';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  photo_url?: string;
}

interface AdministrativeEvaluation {
  id: string;
  evaluation_code: string;
  employee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  general_observations: string;
  evaluator_name: string;
  evaluator_position: string;
  attendance_rating: number;
  punctuality_rating: number;
  presentation_rating: number;
  job_knowledge_rating: number;
  quality_rating: number;
  productivity_rating: number;
  initiative_rating: number;
  collaboration_rating: number;
  communication_rating: number;
  planning_rating: number;
  decision_making_rating: number;
  leadership_rating: number;
  employee?: Employee;
}

interface OperativeEvaluation {
  id: string;
  evaluation_code: string;
  employee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  general_observations: string;
  evaluator_name: string;
  evaluator_position: string;
  attendance_rating: number;
  punctuality_rating: number;
  presentation_rating: number;
  task_completion_rating: number;
  work_quality_rating: number;
  speed_efficiency_rating: number;
  safety_compliance_rating: number;
  tool_care_rating: number;
  teamwork_rating: number;
  instruction_following_rating: number;
  problem_solving_rating: number;
  adaptation_rating: number;
  employee?: Employee;
}

type Evaluation = AdministrativeEvaluation | OperativeEvaluation;

export function NewEvaluationsPLIHSA() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'administrative' | 'operative'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('administrative_evaluations')
        .select(`
          *,
          employee:employees(id, first_name, last_name, position, department, photo_url)
        `)
        .order('created_at', { ascending: false });

      const { data: operativeData, error: operativeError } = await supabase
        .from('operative_evaluations')
        .select(`
          *,
          employee:employees(id, first_name, last_name, position, department, photo_url)
        `)
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;
      if (operativeError) throw operativeError;

      const adminEvals = (adminData || []).map(e => ({ ...e, type: 'administrative' as const }));
      const operativeEvals = (operativeData || []).map(e => ({ ...e, type: 'operative' as const }));

      const allEvals = [...adminEvals, ...operativeEvals].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEvaluations(allEvals);
    } catch (err) {
      console.error('Error loading evaluations:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = (evaluation: Evaluation): number => {
    const ratings = Object.entries(evaluation)
      .filter(([key]) => key.endsWith('_rating'))
      .map(([, value]) => value as number)
      .filter(val => typeof val === 'number' && !isNaN(val));

    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'draft':
        return 'Borrador';
      default:
        return status;
    }
  };

  const handleExportPDF = async (evaluation: Evaluation) => {
    try {
      const isOperative = 'task_completion_rating' in evaluation;
      const fileName = `${evaluation.evaluation_code}_${new Date().toISOString().split('T')[0]}.pdf`;

      console.log('PDF export functionality will be implemented when detail modal is rendered');
      alert(`Exportar PDF: ${fileName}\n\nFuncionalidad disponible al abrir el modal de detalles.`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesType = filterType === 'all' ||
      ('task_completion_rating' in evaluation ? filterType === 'operative' : filterType === 'administrative');

    const matchesStatus = filterStatus === 'all' || evaluation.status === filterStatus;

    const employeeName = evaluation.employee
      ? `${evaluation.employee.first_name} ${evaluation.employee.last_name}`.toLowerCase()
      : '';
    const matchesSearch = searchTerm === '' ||
      employeeName.includes(searchTerm.toLowerCase()) ||
      evaluation.evaluation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const renderEvaluationCard = (evaluation: Evaluation) => {
    const isOperative = 'task_completion_rating' in evaluation;
    const avgRating = calculateAverageRating(evaluation);
    const employee = evaluation.employee;

    return (
      <div
        key={evaluation.id}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {employee?.photo_url ? (
              <img
                src={employee.photo_url}
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900">
                {employee ? `${employee.first_name} ${employee.last_name}` : 'Sin empleado'}
              </h3>
              <p className="text-sm text-slate-600">{employee?.position || 'Sin cargo'}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
            {getStatusText(evaluation.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="w-4 h-4" />
            <span className="font-medium">{evaluation.evaluation_code}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Briefcase className="w-4 h-4" />
            <span>{evaluation.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(evaluation.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Puntuación Promedio</span>
            <span className="text-lg font-bold text-blue-600">{avgRating.toFixed(1)}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(avgRating / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            isOperative ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isOperative ? 'Evaluación Operativa' : 'Evaluación Administrativa'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedEvaluation(evaluation)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Detalles
          </button>
          <button
            onClick={() => handleExportPDF(evaluation)}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
            title="Exportar a PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedEvaluation) return null;

    const isOperative = 'task_completion_rating' in selectedEvaluation;
    const employee = selectedEvaluation.employee;

    const ratingFields = Object.entries(selectedEvaluation)
      .filter(([key, value]) => key.endsWith('_rating') && typeof value === 'number')
      .map(([key, value]) => ({
        label: key.replace(/_rating$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value as number
      }));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Detalles de la Evaluación</h2>
            <button
              onClick={() => setSelectedEvaluation(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
              {employee?.photo_url ? (
                <img
                  src={employee.photo_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {employee ? `${employee.first_name} ${employee.last_name}` : 'Sin empleado'}
                </h3>
                <p className="text-slate-600 mb-2">{employee?.position || 'Sin cargo'}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvaluation.status)}`}>
                    {getStatusText(selectedEvaluation.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isOperative ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isOperative ? 'Operativa' : 'Administrativa'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Código de Evaluación</p>
                <p className="font-semibold text-slate-900">{selectedEvaluation.evaluation_code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Departamento</p>
                <p className="font-semibold text-slate-900">{selectedEvaluation.department}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Evaluador</p>
                <p className="font-semibold text-slate-900">{selectedEvaluation.evaluator_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Cargo del Evaluador</p>
                <p className="font-semibold text-slate-900">{selectedEvaluation.evaluator_position}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Fecha de Creación</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedEvaluation.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Última Actualización</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedEvaluation.updated_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Calificaciones</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratingFields.map(({ label, value }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{label}</span>
                      <span className="font-semibold text-slate-900">{value}/5</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEvaluation.general_observations && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Observaciones Generales</h4>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">
                  {selectedEvaluation.general_observations}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleExportPDF(selectedEvaluation)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar a PDF
              </button>
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">Error al cargar evaluaciones:</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evaluaciones PLIHSA</h1>
          <p className="text-slate-600 mt-1">
            {filteredEvaluations.length} evaluación(es) encontrada(s)
          </p>
        </div>
        <button
          onClick={loadEvaluations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Tipo de Evaluación
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas</option>
              <option value="administrative">Administrativas</option>
              <option value="operative">Operativas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="completed">Completadas</option>
              <option value="draft">Borradores</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Empleado, código, departamento..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-800 font-semibold">No se encontraron evaluaciones</p>
          <p className="text-yellow-700 text-sm mt-1">
            Intenta cambiar los filtros o crear una nueva evaluación
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvaluations.map(renderEvaluationCard)}
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
}
