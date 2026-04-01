import { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, Trash2, CreditCard as Edit2, Eye, EyeOff, Lock, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserModal } from './UserModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SystemUser, ROLE_LABELS, canManageUser } from '../../types/roles';
import { userService } from '../../services/userService';
import { permissionService } from '../../services/permissionService';

export function UserList() {
  const { systemUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [canManageUsers, setCanManageUsers] = useState(false);

  useEffect(() => {
    loadUsers();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const canCreate = await permissionService.canPerform('users.create');
    setCanManageUsers(canCreate);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers(systemUser?.company_id);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: SystemUser) => {
    if (!canManageUsers || !systemUser || !canManageUser(systemUser.role, user.role)) return;

    try {
      const result = await userService.toggleUserStatus(user.user_id, !user.is_active);
      if (result.success) {
        await loadUsers();
      } else {
        alert(result.error || 'Error al cambiar el estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error al cambiar el estado del usuario');
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (!canManageUsers) return;

    const userName = user.employee
      ? `${user.employee.first_name} ${user.employee.last_name}`
      : user.email || 'este usuario';

    if (!confirm(`¿Estás seguro de eliminar a ${userName}?`)) {
      return;
    }

    try {
      const result = await userService.deleteUser(user.user_id);
      if (result.success) {
        await loadUsers();
      } else {
        alert(result.error || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario');
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
    await loadUsers();
    setShowModal(false);
    setSelectedUser(null);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter((user) => {
    // Filter out users that the current user cannot manage (hide higher-level users)
    if (systemUser && !canManageUser(systemUser.role, user.role) && user.role !== systemUser.role) {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const employeeName = user.employee
      ? `${user.employee.first_name} ${user.employee.last_name}`.toLowerCase()
      : '';
    const role = ROLE_LABELS[user.role].toLowerCase();

    return email.includes(searchLower) || employeeName.includes(searchLower) || role.includes(searchLower);
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: 'bg-purple-100 text-purple-800 border-purple-300',
      admin: 'bg-red-100 text-red-800 border-red-300',
      rrhh: 'bg-blue-100 text-blue-800 border-blue-300',
      manager: 'bg-green-100 text-green-800 border-green-300',
      employee: 'bg-gray-100 text-gray-800 border-gray-300',
      viewer: 'bg-slate-100 text-slate-800 border-slate-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Usuarios del Sistema</h1>
            <p className="text-sm text-slate-600">
              Gestiona los usuarios y sus permisos de acceso
            </p>
          </div>
        </div>

        {canManageUsers && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.employee?.photo_url ? (
                        <img
                          src={user.employee.photo_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">
                          {user.employee
                            ? `${user.employee.first_name} ${user.employee.last_name}`
                            : 'Sin empleado vinculado'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{user.email || 'No disponible'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{user.company?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={!canManageUsers || !systemUser || !canManageUser(systemUser.role, user.role)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      } ${canManageUsers && systemUser && canManageUser(systemUser.role, user.role) ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    >
                      {user.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Activo
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {canManageUsers && systemUser && canManageUser(systemUser.role, user.role) && (
                        <>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Restablecer contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {canManageUsers && systemUser && !canManageUser(systemUser.role, user.role) && user.role !== systemUser.role && (
                        <span className="text-xs text-slate-400 px-3 py-1 bg-slate-50 rounded-lg">
                          Sin permisos
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          userId={selectedUser.user_id}
          userEmail={selectedUser.email}
          isOwnPassword={false}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </div>
  );
}
