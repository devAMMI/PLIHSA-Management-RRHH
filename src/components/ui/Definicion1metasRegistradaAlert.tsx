import { useEffect, useState } from 'react';
import { X, AlertTriangle, Phone, Mail } from 'lucide-react';

interface Definicion1metasRegistradaAlertProps {
  employeeName: string;
  year: number;
  status: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_signature: 'Pendiente de Firma',
  completed: 'Finalizado',
};

const STEPS = [
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Revisa el estado de la definicion',
    desc: 'Ve a "Ver Definiciones de Metas" y localiza la definicion existente del colaborador para confirmar su estado actual.',
    color: 'bg-amber-100 text-amber-600',
    num: '1',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    label: 'Si encontraste un error en la evaluacion',
    desc: 'Contacta al departamento de Recursos Humanos para solicitar la correccion o eliminacion de la definicion incorrecta.',
    color: 'bg-red-100 text-red-600',
    num: '2',
  },
  {
    icon: <Phone className="w-5 h-5" />,
    label: 'Contacta a RRHH',
    desc: 'Presenta el codigo del empleado y el motivo de la solicitud. Solo RRHH tiene autorización para eliminar o modificar una definicion registrada.',
    color: 'bg-blue-100 text-blue-600',
    num: '3',
  },
  {
    icon: <Mail className="w-5 h-5" />,
    label: 'Espera confirmacion',
    desc: 'Una vez que RRHH realice los cambios necesarios, podras crear una nueva definicion de metas para este colaborador.',
    color: 'bg-emerald-100 text-emerald-600',
    num: '4',
  },
];

export function Definicion1metasRegistradaAlert({ employeeName, year, status, onClose }: Definicion1metasRegistradaAlertProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'closable'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50);
    const t2 = setTimeout(() => setPhase('closable'), 4050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          phase === 'enter'
            ? 'scale-75 opacity-0 translate-y-8'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
        style={{ width: 480 }}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all duration-300 ${
            phase === 'closable' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        {/* top banner */}
        <div className="relative h-40 bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center overflow-hidden px-6">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute top-3 left-5 w-14 h-14 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/50 flex items-center justify-center shadow-xl flex-shrink-0">
              <AlertTriangle className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>

            <div className="text-white">
              <p className="font-bold text-xl leading-tight">Definicion ya registrada</p>
              <p className="text-white/90 text-sm mt-0.5 font-medium">{employeeName}</p>
              <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                <span className="bg-white/20 rounded-full px-2.5 py-0.5">
                  {year}
                </span>
                <span className="bg-white/20 rounded-full px-2.5 py-0.5 font-semibold">
                  Estado: {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="px-6 pt-5 pb-2">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 leading-snug">
            Solo se permite <strong>una definicion de metas por empleado por año</strong>.
            Este colaborador ya cuenta con una definicion activa para {year}.
            En caso de haber cometido un error, favor contactar a <strong>RRHH</strong>.
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
              Pasos a seguir
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Paso {step.num}</span>
                    <span className="text-sm font-semibold text-slate-800">{step.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="px-6 pb-5 pt-3">
          <p className={`text-xs text-center transition-all duration-500 ${
            phase === 'closable' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {phase === 'closable'
              ? 'Puedes cerrar esta notificacion cuando estes listo'
              : 'Lee los pasos a seguir antes de continuar'}
          </p>
        </div>

        {/* progress bar — 4s */}
        <div className="h-1.5 bg-slate-100">
          {phase !== 'enter' && (
            <div
              className="h-full bg-amber-600 rounded-full"
              style={{ animation: 'dup-progress 4s linear forwards' }}
            />
          )}
        </div>

        <style>{`
          @keyframes dup-progress {
            from { width: 100%; }
            to   { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
