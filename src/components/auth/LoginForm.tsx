import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, CheckCircle, Users, BarChart3, Shield } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('Credenciales inválidas. Por favor intente nuevamente.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-12 animate-fade-in">
            <img
              src="https://i.imgur.com/yaTqvUS.png"
              alt="AMMI Group"
              className="h-16 mb-8 brightness-0 invert"
            />
          </div>

          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold text-white mb-4">
              Sistema de Gestión
              <span className="block text-blue-400 mt-2">de Recursos Humanos</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Gestión integral de empleados, evaluaciones de desempeño y administración
              de personal para todas las empresas del grupo AMMI.
            </p>
          </div>

          <div className="mt-12 space-y-6 animate-fade-in-delayed">
            <div className="flex items-start gap-4 group">
              <div className="bg-blue-500/20 p-3 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Gestión de Personal</h3>
                <p className="text-slate-400 text-sm">Control completo de empleados y estructura organizacional</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="bg-blue-500/20 p-3 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Evaluaciones de Desempeño</h3>
                <p className="text-slate-400 text-sm">Seguimiento y evaluación continua del rendimiento</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="bg-blue-500/20 p-3 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Control de Accesos</h3>
                <p className="text-slate-400 text-sm">Sistema de permisos y roles personalizados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="pt-8 border-t border-slate-700">
            <p className="text-slate-400 text-sm mb-4">Empresas del grupo:</p>
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <img
                src="https://i.imgur.com/yaTqvUS.png"
                alt="AMMI"
                className="h-10 brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
              />
              <img
                src="https://i.imgur.com/HqBOuOw.png"
                alt="PLIHSA"
                className="h-10 brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
              />
              <img
                src="https://i.imgur.com/6Q0kLnl.png"
                alt="Millfoods"
                className="h-10 brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
              />
              <img
                src="https://i.imgur.com/QX5salf.png"
                alt="PTM"
                className="h-10 brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <img
              src="https://i.imgur.com/yaTqvUS.png"
              alt="AMMI Group"
              className="h-12 mx-auto mb-4"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10 animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Iniciar Sesión</h2>
              <p className="text-slate-600">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-shake">
                  <div className="text-red-500 mt-0.5">⚠</div>
                  <div>{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-slate-400"
                    placeholder="tu.email@plihsa.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-slate-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    Recordarme
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {onSwitchToRegister && (
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-slate-600 text-sm">
                  ¿Necesitas ayuda?{' '}
                  <button
                    onClick={onSwitchToRegister}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Contacta a IT
                  </button>
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            © 2026 AMMI Group. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.4s both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
