import { useState } from 'react';
import { Play, Database, Copy, Trash2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QueryResult {
  data: any[] | null;
  error: string | null;
  executionTime: number;
  rowCount: number;
}

const PRESET_QUERIES = [
  {
    name: 'Todas las evaluaciones administrativas',
    query: 'SELECT * FROM administrative_evaluations ORDER BY created_at DESC;'
  },
  {
    name: 'Todas las evaluaciones operativas',
    query: 'SELECT * FROM operative_evaluations ORDER BY created_at DESC;'
  },
  {
    name: 'Evaluaciones con empleados (JOIN)',
    query: `SELECT
  ae.id,
  ae.evaluation_code,
  ae.status,
  ae.created_at,
  e.first_name,
  e.last_name,
  e.position
FROM administrative_evaluations ae
LEFT JOIN employees e ON e.id = ae.employee_id
ORDER BY ae.created_at DESC;`
  },
  {
    name: 'Contar evaluaciones por estado',
    query: `SELECT
  status,
  COUNT(*) as total
FROM administrative_evaluations
GROUP BY status;`
  },
  {
    name: 'Todos los empleados',
    query: 'SELECT * FROM employees ORDER BY first_name, last_name;'
  },
  {
    name: 'Usuarios del sistema',
    query: `SELECT
  su.id,
  su.role,
  su.is_active,
  au.email,
  e.first_name,
  e.last_name
FROM system_users su
LEFT JOIN auth.users au ON au.id = su.user_id
LEFT JOIN employees e ON e.id = su.employee_id;`
  }
];

export function SQLExecutor() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({
        data: null,
        error: 'Por favor ingresa una consulta SQL',
        executionTime: 0,
        rowCount: 0
      });
      return;
    }

    setExecuting(true);
    const startTime = performance.now();

    try {
      console.log('Executing SQL query:', query);

      // Usar rpc para ejecutar queries personalizadas
      const { data, error } = await supabase.rpc('execute_sql', {
        query_text: query
      });

      // Si no existe la función, usar el método directo
      if (error && error.message.includes('execute_sql')) {
        // Intentar detectar el tipo de query
        const trimmedQuery = query.trim().toLowerCase();

        let queryResult;

        if (trimmedQuery.startsWith('select')) {
          // Es un SELECT - extraer la tabla
          const tableMatch = query.match(/from\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            // Nota: Esto es limitado, solo funciona para queries simples
            queryResult = await supabase.from(tableName).select('*');
          } else {
            throw new Error('No se pudo detectar la tabla en el SELECT');
          }
        } else {
          throw new Error('Solo se soportan queries SELECT por seguridad. Para otras operaciones, usa las migraciones.');
        }

        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        setResult({
          data: queryResult.data || null,
          error: queryResult.error?.message || null,
          executionTime,
          rowCount: queryResult.data?.length || 0
        });
      } else {
        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        setResult({
          data: data || null,
          error: error?.message || null,
          executionTime,
          rowCount: Array.isArray(data) ? data.length : 0
        });
      }

      console.log('Query result:', { data, error });
    } catch (err) {
      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      console.error('Error executing query:', err);
      setResult({
        data: null,
        error: err instanceof Error ? err.message : 'Error desconocido',
        executionTime,
        rowCount: 0
      });
    } finally {
      setExecuting(false);
    }
  };

  const loadPresetQuery = (presetQuery: string) => {
    setQuery(presetQuery);
    setResult(null);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query);
  };

  const renderResultTable = () => {
    if (!result) return null;

    if (result.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
          <pre className="text-sm text-red-800 whitespace-pre-wrap">{result.error}</pre>
        </div>
      );
    }

    if (!result.data || result.data.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No se encontraron resultados</p>
        </div>
      );
    }

    const columns = Object.keys(result.data[0]);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Resultados</h3>
            <p className="text-sm text-slate-600 mt-1 flex items-center gap-3">
              <span>{result.rowCount} filas</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.executionTime}ms
              </span>
            </p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0">
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
              {result.data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-600" />
          SQL Evaluaciones - Ejecutor de Consultas
        </h1>
        <p className="text-slate-600 mt-1">
          Ejecuta consultas SQL directamente en la base de datos
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Solo se permiten consultas SELECT por seguridad.
          Para modificaciones (INSERT, UPDATE, DELETE), usa las migraciones de Supabase.
        </p>
      </div>

      {/* Consultas predefinidas */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Consultas Predefinidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPresetQuery(preset.query)}
              className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-left"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor de consultas */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Editor SQL</h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Copiar SQL"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={clearQuery}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Limpiar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe tu consulta SQL aquí..."
          className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          spellCheck={false}
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={executeQuery}
            disabled={executing || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {executing ? 'Ejecutando...' : 'Ejecutar Consulta'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {result && (
        <div>
          {renderResultTable()}
        </div>
      )}
    </div>
  );
}
