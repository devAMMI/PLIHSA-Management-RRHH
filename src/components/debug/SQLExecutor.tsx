import { useState } from 'react';
import { Play, Database, Copy, Trash2, Clock, Users, Key, UserMinus, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QueryResult {
  data: any[] | null;
  error: string | null;
  executionTime: number;
  rowCount: number;
  message?: string;
}

interface PresetGroup {
  label: string;
  icon: React.ReactNode;
  queries: { name: string; query: string; isAction?: boolean; actionType?: string }[];
}

const EXEC_SQL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-sql`;

const PRESET_GROUPS: PresetGroup[] = [
  {
    label: 'Consultas de Usuarios',
    icon: <Users className="w-4 h-4" />,
    queries: [
      {
        name: 'Listar todos los usuarios del sistema',
        query: `SELECT
  su.id,
  su.user_id,
  su.role,
  su.is_active,
  su.email,
  su.created_at,
  e.first_name,
  e.last_name,
  c.name AS company
FROM system_users su
LEFT JOIN employees e ON e.id = su.employee_id
LEFT JOIN companies c ON c.id = su.company_id
ORDER BY su.created_at DESC;`,
      },
      {
        name: 'Listar usuarios auth (con last_sign_in)',
        query: '__ACTION__list_auth_users',
        isAction: true,
        actionType: 'list_auth_users',
      },
      {
        name: 'Usuarios activos por rol',
        query: `SELECT
  role,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active = true) AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS inactivos
FROM system_users
GROUP BY role
ORDER BY total DESC;`,
      },
      {
        name: 'Buscar usuario por email',
        query: `SELECT
  su.id,
  su.user_id,
  su.role,
  su.is_active,
  su.email,
  e.first_name,
  e.last_name
FROM system_users su
LEFT JOIN employees e ON e.id = su.employee_id
WHERE su.email ILIKE '%@plihsa.com%'
ORDER BY su.created_at DESC;`,
      },
    ],
  },
  {
    label: 'Gestión de Contraseñas',
    icon: <Key className="w-4 h-4" />,
    queries: [
      {
        name: 'Reset password de usuario',
        query: `-- Para resetear la contrasena de un usuario, usa el panel de Usuarios (icono llave).
-- O ejecuta esta accion con los parametros correctos:
-- ACTION: reset_password
-- userId: <UUID del usuario en auth.users>
-- newPassword: <nueva contrasena minimo 6 caracteres>

-- Ejemplo de como obtener el user_id:
SELECT su.user_id, su.email, su.role
FROM system_users su
WHERE su.email = 'email@ejemplo.com';`,
      },
    ],
  },
  {
    label: 'Eliminar Usuarios',
    icon: <UserMinus className="w-4 h-4" />,
    queries: [
      {
        name: 'Ver usuario antes de eliminar',
        query: `SELECT
  su.id,
  su.user_id,
  su.role,
  su.is_active,
  su.email,
  e.first_name,
  e.last_name
FROM system_users su
LEFT JOIN employees e ON e.id = su.employee_id
WHERE su.email = 'email@ejemplo.com';`,
      },
    ],
  },
  {
    label: 'Evaluaciones',
    icon: <Database className="w-4 h-4" />,
    queries: [
      {
        name: 'Todas las evaluaciones administrativas',
        query: 'SELECT * FROM administrative_evaluations ORDER BY created_at DESC;',
      },
      {
        name: 'Todas las evaluaciones operativas',
        query: 'SELECT * FROM operative_evaluations ORDER BY created_at DESC;',
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
ORDER BY ae.created_at DESC;`,
      },
      {
        name: 'Contar evaluaciones por estado',
        query: `SELECT
  status,
  COUNT(*) AS total
FROM administrative_evaluations
GROUP BY status;`,
      },
    ],
  },
  {
    label: 'Empleados',
    icon: <Database className="w-4 h-4" />,
    queries: [
      {
        name: 'Todos los empleados',
        query: 'SELECT id, first_name, last_name, position, department, status FROM employees ORDER BY first_name, last_name;',
      },
    ],
  },
];

export function SQLExecutor() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({ 0: true });
  const [activeTab, setActiveTab] = useState<'sql' | 'reset_password' | 'delete_user'>('sql');
  const [resetUserId, setResetUserId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [deleteUserId, setDeleteUserId] = useState('');

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No hay sesion activa');
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  };

  const runAction = async (actionType: string) => {
    setExecuting(true);
    const startTime = performance.now();
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(EXEC_SQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: actionType }),
      });
      const json = await response.json();
      const executionTime = Math.round(performance.now() - startTime);
      if (!response.ok || json.error) {
        setResult({ data: null, error: json.error || 'Error desconocido', executionTime, rowCount: 0 });
      } else {
        setResult({ data: json.data || null, error: null, executionTime, rowCount: json.rowCount || 0 });
      }
    } catch (err: any) {
      setResult({ data: null, error: err.message, executionTime: Math.round(performance.now() - startTime), rowCount: 0 });
    } finally {
      setExecuting(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({ data: null, error: 'Por favor ingresa una consulta SQL', executionTime: 0, rowCount: 0 });
      return;
    }

    setExecuting(true);
    const startTime = performance.now();

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(EXEC_SQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql: query }),
      });
      const json = await response.json();
      const executionTime = Math.round(performance.now() - startTime);

      if (!response.ok || json.error) {
        setResult({ data: null, error: json.error || 'Error al ejecutar la consulta', executionTime, rowCount: 0 });
      } else {
        setResult({ data: json.data || null, error: null, executionTime, rowCount: json.rowCount || 0 });
      }
    } catch (err: any) {
      setResult({
        data: null,
        error: err.message || 'Error desconocido',
        executionTime: Math.round(performance.now() - startTime),
        rowCount: 0,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId.trim() || !resetPassword.trim()) {
      setResult({ data: null, error: 'Debes ingresar el user_id y la nueva contrasena', executionTime: 0, rowCount: 0 });
      return;
    }
    setExecuting(true);
    const startTime = performance.now();
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(EXEC_SQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reset_password', userId: resetUserId.trim(), newPassword: resetPassword.trim() }),
      });
      const json = await response.json();
      const executionTime = Math.round(performance.now() - startTime);
      if (!response.ok || json.error) {
        setResult({ data: null, error: json.error || 'Error al resetear contrasena', executionTime, rowCount: 0 });
      } else {
        setResult({ data: null, error: null, executionTime, rowCount: 0, message: json.message || 'Contrasena actualizada correctamente' });
        setResetPassword('');
      }
    } catch (err: any) {
      setResult({ data: null, error: err.message, executionTime: Math.round(performance.now() - startTime), rowCount: 0 });
    } finally {
      setExecuting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId.trim()) {
      setResult({ data: null, error: 'Debes ingresar el user_id del usuario a eliminar', executionTime: 0, rowCount: 0 });
      return;
    }
    if (!confirm(`ATENCION: Esto eliminara PERMANENTEMENTE al usuario con ID:\n${deleteUserId}\n\nEsta accion NO se puede deshacer. ¿Continuar?`)) return;

    setExecuting(true);
    const startTime = performance.now();
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(EXEC_SQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete_user', userId: deleteUserId.trim() }),
      });
      const json = await response.json();
      const executionTime = Math.round(performance.now() - startTime);
      if (!response.ok || json.error) {
        setResult({ data: null, error: json.error || 'Error al eliminar usuario', executionTime, rowCount: 0 });
      } else {
        setResult({ data: null, error: null, executionTime, rowCount: 0, message: json.message || 'Usuario eliminado correctamente' });
        setDeleteUserId('');
      }
    } catch (err: any) {
      setResult({ data: null, error: err.message, executionTime: Math.round(performance.now() - startTime), rowCount: 0 });
    } finally {
      setExecuting(false);
    }
  };

  const loadPreset = (preset: { query: string; isAction?: boolean; actionType?: string }) => {
    if (preset.isAction && preset.actionType) {
      runAction(preset.actionType);
      return;
    }
    setQuery(preset.query);
    setResult(null);
    setActiveTab('sql');
  };

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.message && !result.error) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Operacion exitosa</p>
            <p className="text-emerald-700 text-sm mt-0.5">{result.message}</p>
            <p className="text-emerald-500 text-xs mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {result.executionTime}ms
            </p>
          </div>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-semibold text-red-900 mb-1">Error:</p>
          <pre className="text-sm text-red-800 whitespace-pre-wrap">{result.error}</pre>
        </div>
      );
    }

    if (!result.data || result.data.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">No se encontraron resultados</p>
          <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {result.executionTime}ms
          </p>
        </div>
      );
    }

    const columns = Object.keys(result.data[0]);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">Resultados</p>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-3">
              <span>{result.rowCount} filas</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.executionTime}ms</span>
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(result.data, null, 2))}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar JSON
          </button>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={JSON.stringify(row[col])}>
                      {typeof row[col] === 'boolean'
                        ? (row[col] ? 'true' : 'false')
                        : typeof row[col] === 'object' && row[col] !== null
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
          SQL Evaluaciones
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Ejecuta consultas y gestiona usuarios directamente desde aqui</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Consultas rapidas</p>
          {PRESET_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleGroup(gIdx)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <span className="flex items-center gap-2">
                  {group.icon}
                  {group.label}
                </span>
                {expandedGroups[gIdx] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedGroups[gIdx] && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {group.queries.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => loadPreset(preset)}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200">
              {[
                { key: 'sql', label: 'Editor SQL' },
                { key: 'reset_password', label: 'Reset Password' },
                { key: 'delete_user', label: 'Eliminar Usuario' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key as any); setResult(null); }}
                  className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'sql' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Soporta SELECT, INSERT, UPDATE, DELETE. Prohibido DROP/TRUNCATE.</p>
                    <div className="flex gap-1">
                      <button onClick={() => navigator.clipboard.writeText(query)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition" title="Copiar">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setQuery(''); setResult(null); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition" title="Limpiar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SELECT * FROM system_users ORDER BY created_at DESC;"
                    className="w-full h-52 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                    spellCheck={false}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') executeQuery();
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">Ctrl+Enter para ejecutar</p>
                    <button
                      onClick={executeQuery}
                      disabled={executing || !query.trim()}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      {executing ? 'Ejecutando...' : 'Ejecutar'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'reset_password' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Ingresa el <strong>user_id</strong> del usuario (UUID de auth.users). Puedes obtenerlo ejecutando la consulta "Listar usuarios auth" en el panel izquierdo.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">User ID (UUID)</label>
                    <input
                      type="text"
                      value={resetUserId}
                      onChange={(e) => setResetUserId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva Contraseña (min. 6 caracteres)</label>
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Nueva contrasena..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleResetPassword}
                      disabled={executing || !resetUserId.trim() || !resetPassword.trim()}
                      className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Key className="w-4 h-4" />
                      {executing ? 'Procesando...' : 'Cambiar Contrasena'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'delete_user' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800">
                      <strong>Accion irreversible.</strong> Eliminara el usuario de <code>system_users</code> y de <code>auth.users</code> permanentemente. Usa la consulta "Listar usuarios auth" para obtener el user_id correcto.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">User ID (UUID de auth.users)</label>
                    <input
                      type="text"
                      value={deleteUserId}
                      onChange={(e) => setDeleteUserId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleDeleteUser}
                      disabled={executing || !deleteUserId.trim()}
                      className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <UserMinus className="w-4 h-4" />
                      {executing ? 'Eliminando...' : 'Eliminar Usuario'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {result && renderResult()}
        </div>
      </div>
    </div>
  );
}
