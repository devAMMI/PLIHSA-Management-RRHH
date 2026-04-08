import { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, Trash2, CreditCard as Edit2, Eye, EyeOff, Key, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserModal } from './UserModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SystemUser, ROLE_LABELS, ROLE_HIERARCHY, canManageUser } from '../../types/roles';
import { userService } from '../../services/userService';

export function UserList() {
  const { systemUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = systemUser?.role === 'superadmin';

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', text: string) => setToast({ type, text });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const canAct = (targetUser: SystemUser) => {
    if (!systemUser) return false;
    if (targetUser.user_id === systemUser.user_id) return false;
    return isSuperAdmin || canManageUser(systemUser.role, targetUser.role);
  };

  const handleToggleActive = async (user: SystemUser) => {
    if (!canAct(user)) return;
    setActionLoading(`toggle-${user.id}`);
    try {
      const result = await userService.toggleUserStatus(user.id, !user.is_active);
      if (result.success) {
        showToast('success', `Usuario ${!user.is_active ? 'activado' : 'desactivado'} correctamente`);
        await loadUsers();
      } else {
        showToast('error', result.error || 'Error al cambiar estado');
      }
    } catch {
      showToast('error', 'Error al cambiar estado del usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (!canAct(user)) return;
    const name = user.employee
      ? `${user.employee.first_name} ${user.employee.last_name}`
      : user.email || 'este usuario';
    if (!confirm(`¿Confirmas eliminar a ${name}? Esta accion no se puede deshacer.`)) return;

    setActionLoading(`delete-${user.id}`);
    try {
      const result = await userService.deleteUser(user.user_id);
      if (result.success) {
        showToast('success', 'Usuario eliminado correctamente');
        await loadUsers();
      } else {
        showToast('error', result.error || 'Error al eliminar usuario');
      }
    } catch {
      showToast('error', 'Error al eliminar usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleResetPassword = (user: SystemUser) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleModalSuccess = async () => {
    setShowModal(false);
    setSelectedUser(null);
    showToast('success', selectedUser ? 'Usuario actualizado' : 'Usuario creado correctamente');
    await loadUsers();
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    showToast('success', 'Contrasena actualizada correctamente');
  };

  const filteredUsers = users.filter((user) => {
    if (!isSuperAdmin && systemUser) {
      const myLevel = ROLE_HIERARCHY[systemUser.role];
      const targetLevel = ROLE_HIERARCHY[user.role];
      if (targetLevel >= myLevel && user.user_id !== systemUser.user_id) return false;
    }

    const q = searchTerm.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const name = user.employee
      ? `${user.employee.first_name} ${user.employee.last_name}`.toLowerCase()
      : '';
    const role = ROLE_LABELS[user.role]?.toLowerCase() || '';
    const company = user.company?.name?.toLowerCase() || '';

    return email.includes(q) || name.includes(q) || role.includes(q) || company.includes(q);
  });

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      superadmin: 'bg-amber-100 text-amber-800 border-amber-300',
      admin: 'bg-red-100 text-red-800 border-red-300',
      rrhh: 'bg-blue-100 text-blue-800 border-blue-300',
      manager: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      employee: 'bg-slate-100 text-slate-700 border-slate-300',
      viewer: 'bg-gray-100 text-gray-600 border-gray-300',
    };
    return map[role] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-slate-500">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Usuarios del Sistema</h1>
            <p className="text-sm text-slate-500">
              Gestiona accesos, roles y privilegios de los usuarios
            </p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{users.length}</div>
            <div className="text-xs text-slate-500">Total usuarios</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 bg-emerald-50 rounded-lg">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{activeCount}</div>
            <div className="text-xs text-slate-500">Activos</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 bg-red-50 rounded-lg">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{inactiveCount}</div>
            <div className="text-xs text-slate-500">Inactivos</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por email, nombre, rol o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            onClick={loadUsers}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isMe = user.user_id === systemUser?.user_id;
                const canEdit = canAct(user);
                const isDeleting = actionLoading === `delete-${user.id}`;
                const isToggling = actionLoading === `toggle-${user.id}`;

                return (
                  <tr key={user.id} className={`hover:bg-slate-50 transition ${isMe ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.employee?.photo_url ? (
                          <img src={user.employee.photo_url} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-800 text-sm">
                            {user.employee
                              ? `${user.employee.first_name} ${user.employee.last_name}`
                              : <span className="text-slate-400 italic">Sin empleado vinculado</span>
                            }
                          </div>
                          {isMe && (
                            <span className="text-xs text-blue-500 font-medium">Yo</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-600">{user.email || <span className="text-slate-400">—</span>}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadge(user.role)}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-600">{user.company?.name || <span className="text-slate-400">—</span>}</div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={!canEdit || isToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          user.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        } ${canEdit && !isToggling ? 'hover:opacity-80 cursor-pointer' : 'cursor-default opacity-60'}`}
                      >
                        {isToggling ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : user.is_active ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit ? (
                          <>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Cambiar contrasena"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar usuario"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isDeleting}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Eliminar usuario"
                            >
                              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </>
                        ) : (
                          !isMe && (
                            <span className="text-xs text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">Sin permisos</span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No se encontraron usuarios</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} mostrado{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={() => { setShowModal(false); setSelectedUser(null); }}
          onSuccess={handleModalSuccess}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          userId={selectedUser.user_id}
          userEmail={selectedUser.email}
          isOwnPassword={false}
          onClose={() => { setShowPasswordModal(false); setSelectedUser(null); }}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </div>
  );
}
