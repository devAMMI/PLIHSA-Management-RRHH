import { useEffect, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RawEvaluation {
  id: string;
  evaluation_code: string;
  status: string;
  created_at: string;
  employee_id: string;
  evaluation_period_id: string;
  department: string;
  [key: string]: any;
}

export function RawEvaluations() {
  const [adminEvaluations, setAdminEvaluations] = useState<RawEvaluation[]>([]);
  const [operativeEvaluations, setOperativeEvaluations] = useState<RawEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRawData();
  }, []);

  const loadRawData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== RAW EVALUATIONS: Starting load ===');

      // SELECT * FROM administrative_evaluations
      const { data: adminData, error: adminError } = await supabase
        .from('administrative_evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Admin evaluations raw result:', { data: adminData, error: adminError });

      // SELECT * FROM operative_evaluations
      const { data: operativeData, error: operativeError } = await supabase
        .from('operative_evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Operative evaluations raw result:', { data: operativeData, error: operativeError });

      if (adminError) {
        console.error('Error loading admin evaluations:', adminError);
        setError(`Admin: ${adminError.message}`);
      }

      if (operativeError) {
        console.error('Error loading operative evaluations:', operativeError);
        setError(`Operative: ${operativeError.message}`);
      }

      setAdminEvaluations(adminData || []);
      setOperativeEvaluations(operativeData || []);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data: RawEvaluation[], title: string) => {
    if (data.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No hay datos en {title}</p>
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-1">{data.length} registros encontrados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis"
                      title={JSON.stringify(row[col])}
                    >
                      {typeof row[col] === 'object' && row[col] !== null
                        ? JSON.stringify(row[col])
                        : String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Cargando datos crudos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-blue-600" />
            Evaluaciones Hechas (Raw Data)
          </h1>
          <p className="text-slate-600 mt-1">
            Consulta directa: SELECT * FROM evaluaciones
          </p>
        </div>
        <button
          onClick={loadRawData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {renderTable(adminEvaluations, 'administrative_evaluations')}
        {renderTable(operativeEvaluations, 'operative_evaluations')}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Información de Debug</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Total Admin: {adminEvaluations.length}</li>
          <li>• Total Operativas: {operativeEvaluations.length}</li>
          <li>• Total General: {adminEvaluations.length + operativeEvaluations.length}</li>
        </ul>
      </div>
    </div>
  );
}
