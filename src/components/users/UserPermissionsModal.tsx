import { useState, useEffect } from 'react';
import { X, Shield, Save, RefreshCw, Lock, Unlock, Info, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SystemUser, ROLE_LABELS } from '../../types/roles';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  group: string;
  defaultRoles: string[];
  description?: string;
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'General', defaultRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe', 'employee', 'viewer'], description: 'Pantalla principal con indicadores' },
  { id: 'employees', label: 'Empleados', group: 'General', defaultRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe', 'employee', 'viewer'], description: 'Directorio y gestión de colaboradores' },
  { id: 'goal-definition-enero', label: 'Definición de Metas (Fase 1)', group: 'Evaluaciones', defaultRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'], description: 'Crear y gestionar definición de metas' },
  { id: 'evaluacion-junio', label: 'Revisión de Metas (Fase 2)', group: 'Evaluaciones', defaultRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'], description: 'Revisión de metas a mitad de año' },
  { id: 'evaluacion-final', label: 'Evaluación Final (Fase 3)', group: 'Evaluaciones', defaultRoles: ['superadmin', 'admin', 'rrhh', 'manager', 'jefe'], description: 'Evaluación de desempeño final' },
  { id: 'evaluacion-administrativa-nueva', label: 'Nueva Evaluación Administrativa', group: 'Evaluaciones', defaultRoles: ['superadmin', 'rrhh'], description: 'Crear evaluación administrativa' },
  { id: 'evaluations-list', label: 'Ver Evaluaciones', group: 'Evaluaciones', defaultRoles: ['superadmin', 'rrhh'], description: 'Listar todas las evaluaciones' },
  { id: 'nueva-evaluacion-administrativa', label: 'Nueva Evaluación Completa', group: 'Evaluaciones', defaultRoles: ['superadmin', 'rrhh'], description: 'Formulario completo de evaluación' },
  { id: 'system-users', label: 'Usuarios del Sistema', group: 'Administración', defaultRoles: ['superadmin', 'admin'], description: 'Gestionar usuarios y accesos' },
  { id: 'reportes', label: 'Reportes', group: 'Administración', defaultRoles: ['superadmin'], description: 'Reportes y estadísticas' },
  { id: 'settings', label: 'Configuración', group: 'Administración', defaultRoles: ['superadmin'], description: 'Configuración del sistema' },
  { id: 'audit-log', label: 'Registro de Actividad', group: 'Administración', defaultRoles: ['superadmin', 'rrhh'], description: 'Log de acciones del sistema' },
  { id: 'raw-evaluations', label: 'Evaluaciones Hechas', group: 'Superadmin', defaultRoles: ['superadmin'], description: 'Datos crudos de evaluaciones' },
  { id: 'sql-executor', label: 'SQL Evaluaciones', group: 'Superadmin', defaultRoles: ['superadmin'], description: 'Ejecutar consultas SQL' },
];

type PermissionState = 'default' | 'granted' | 'denied';

interface UserPermissionsModalProps {
  targetUser: SystemUser;
  onClose: () => void;
  onSaved: () => void;
}

export function UserPermissionsModal({ targetUser, onClose, onSaved }: UserPermissionsModalProps) {
  const { systemUser } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, PermissionState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userName = targetUser.employee
    ? `${targetUser.employee.first_name} ${targetUser.employee.last_name}`
    : targetUser.email || 'Usuario';

  const roleLabel = ROLE_LABELS[targetUser.role] || targetUser.role;

  const roleDefaultItems = new Set(
    ALL_MENU_ITEMS
      .filter(item => item.defaultRoles.includes(targetUser.role))
      .map(item => item.id)
  );

  useEffect(() => {
    loadPermissions();
  }, [targetUser.id]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sidebar_permissions' as any)
        .select('menu_item_id, granted')
        .eq('system_user_id', targetUser.id);

      if (error) throw error;

      const map: Record<string, PermissionState> = {};
      (data as any[] || []).forEach((row: any) => {
        map[row.menu_item_id] = row.granted ? 'granted' : 'denied';
      });

      setPermissions(map);
    } catch (err) {
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveAccess = (itemId: string): boolean => {
    const perm = permissions[itemId];
    if (perm === 'granted') return true;
    if (perm === 'denied') return false;
    return roleDefaultItems.has(itemId);
  };

  const cyclePermission = (itemId: string) => {
    setPermissions(prev => {
      const current = prev[itemId] || 'default';
      const hasRoleDefault = roleDefaultItems.has(itemId);

      if (current === 'default') {
        return { ...prev, [itemId]: hasRoleDefault ? 'denied' : 'granted' };
      } else if (current === 'granted') {
        return { ...prev, [itemId]: 'denied' };
      } else {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
    });
  };

  const handleReset = () => {
    setPermissions({});
    setMessage({ type: 'success', text: 'Permisos restablecidos a los valores del rol. Guarda para confirmar.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: delError } = await supabase
        .from('user_sidebar_permissions' as any)
        .delete()
        .eq('system_user_id', targetUser.id);

      if (delError) throw delError;

      const rows = Object.entries(permissions)
        .filter(([, state]) => state !== 'default')
        .map(([menu_item_id, state]) => ({
          system_user_id: targetUser.id,
          menu_item_id,
          granted: state === 'granted',
          granted_by: systemUser?.user_id,
        }));

      if (rows.length > 0) {
        const { error: insError } = await supabase
          .from('user_sidebar_permissions' as any)
          .insert(rows);

        if (insError) throw insError;
      }

      setMessage({ type: 'success', text: 'Permisos guardados correctamente' });
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving permissions:', err);
      setMessage({ type: 'error', text: err.message || 'Error al guardar permisos' });
    } finally {
      setSaving(false);
    }
  };

  const groups = Array.from(new Set(ALL_MENU_ITEMS.map(i => i.group)));

  const customCount = Object.keys(permissions).filter(k => permissions[k] !== 'default').length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Permisos del Menú</h2>
              <p className="text-xs text-slate-300">
                {userName} — <span className="text-blue-300 font-medium">{roleLabel}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Configura qué secciones del menú lateral puede ver este usuario.
            Los permisos aquí sobreescriben lo que el rol daría por defecto.
            Usa <strong>Restablecer</strong> para volver a los permisos del rol.
            {customCount > 0 && <span className="ml-1 font-semibold text-blue-800">({customCount} personalización{customCount !== 1 ? 'es' : ''} activa{customCount !== 1 ? 's' : ''})</span>}
          </p>
        </div>

        {message && (
          <div className={`mx-6 mt-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Cargando permisos...
            </div>
          ) : (
            groups.map(group => {
              const items = ALL_MENU_ITEMS.filter(i => i.group === group);
              return (
                <div key={group}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</h3>
                  <div className="space-y-1.5">
                    {items.map(item => {
                      const state = permissions[item.id] || 'default';
                      const effective = getEffectiveAccess(item.id);
                      const hasRoleDefault = roleDefaultItems.has(item.id);
                      const isOverride = state !== 'default';

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isOverride
                              ? effective
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-red-50 border-red-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{item.label}</span>
                              {isOverride && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  effective
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {effective ? 'EXTRA' : 'BLOQUEADO'}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                            )}
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Por defecto en rol: {hasRoleDefault ? (
                                <span className="text-emerald-600 font-medium">Visible</span>
                              ) : (
                                <span className="text-slate-400">No visible</span>
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() => cyclePermission(item.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all min-w-[100px] justify-center ${
                              state === 'granted'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : state === 'denied'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                            title="Clic para cambiar: Por defecto → Extra → Bloqueado → Por defecto"
                          >
                            {state === 'granted' ? (
                              <><Unlock className="w-3.5 h-3.5" />Otorgado</>
                            ) : state === 'denied' ? (
                              <><Lock className="w-3.5 h-3.5" />Bloqueado</>
                            ) : effective ? (
                              <><Eye className="w-3.5 h-3.5" />Por defecto</>
                            ) : (
                              <><EyeOff className="w-3.5 h-3.5" />Por defecto</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleReset}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Restablecer al rol
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar permisos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
