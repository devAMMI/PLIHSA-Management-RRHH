import { useState, useEffect } from 'react';
import { User, Lock, Mail, Camera, Save, X, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function UserProfile() {
  const { user, systemUser, employee } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    photoUrl: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.first_name || '',
        lastName: employee.last_name || '',
        email: employee.email || user?.email || '',
        position: employee.position || '',
        photoUrl: employee.photo_url || '',
      });
    } else if (user) {
      setFormData({
        firstName: '',
        lastName: '',
        email: user.email || '',
        position: '',
        photoUrl: '',
      });
    }
  }, [employee, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!employee) {
        setMessage({ type: 'error', text: 'No se encontró información del empleado' });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          position: formData.position,
          photo_url: formData.photoUrl || null,
        })
        .eq('id', employee.id)
        .select();

      if (error) {
        console.error('Error details:', error);
        throw new Error(error.message || 'Error al actualizar el perfil');
      }

      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar el perfil. Verifica tus permisos.');
      }

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setIsEditing(false);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.message || 'Error desconocido al actualizar el perfil';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      superadmin: 'Super Administrador',
      admin: 'Administrador',
      rrhh: 'Recursos Humanos',
      manager: 'Gerente',
      jefe: 'Jefe',
      employee: 'Empleado',
      viewer: 'Visor',
    };
    return roles[role] || role;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div
          className="h-56 bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/Banner-PLIHSA_4.jpeg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-white"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="flex items-end gap-6 -mt-24 mb-6 relative">
            <div className="relative z-10">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-6 border-white shadow-xl ring-4 ring-slate-100"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-slate-200 border-6 border-white shadow-xl ring-4 ring-slate-100 flex items-center justify-center">
                  <User className="w-20 h-20 text-slate-400" />
                </div>
              )}
              {isEditing && (
                <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 pb-4 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {employee ? `${employee.first_name} ${employee.last_name}` : user?.email?.split('@')[0] || 'Usuario'}
                  </h1>
                  <p className="text-slate-600 mt-1 text-lg">{formData.position || 'Sin cargo asignado'}</p>
                  <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {systemUser?.role && getRoleName(systemUser.role)}
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6"></div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL de Foto de Perfil
                  </label>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage(null);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2 text-slate-800">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{formData.email || 'No especificado'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    Cargo
                  </label>
                  <div className="text-slate-800">
                    {formData.position || 'Sin cargo asignado'}
                  </div>
                </div>

                {employee?.work_location && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Ubicación Física
                    </label>
                    <div className="flex items-start gap-2 text-slate-800 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">{employee.work_location.name}</p>
                        {employee.work_location.city && (
                          <p className="text-sm text-slate-600">{employee.work_location.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Seguridad</h3>

                {!isChangingPassword ? (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                  >
                    <Lock className="w-4 h-4" />
                    Cambiar Contraseña
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setMessage(null);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
