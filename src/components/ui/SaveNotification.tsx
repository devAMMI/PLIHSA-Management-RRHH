import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SaveNotificationProps {
  employeeName?: string;
  onClose: () => void;
}

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    label: 'Ve a "Ver las definiciones"',
    desc: 'Desde el menu lateral abre la seccion de Ver Definiciones de Metas',
    color: 'bg-blue-100 text-blue-600',
    num: '1',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    label: 'Selecciona la definicion del empleado',
    desc: 'Busca y abre la definicion de metas del colaborador que acabas de guardar',
    color: 'bg-sky-100 text-sky-600',
    num: '2',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414A2 2 0 018.586 12.5z" />
      </svg>
    ),
    label: 'Firma la definicion',
    desc: 'El documento debe ser firmado por el colaborador y el jefe inmediato',
    color: 'bg-amber-100 text-amber-600',
    num: '3',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
        <path d="M12 12V4m0 0L8 8m4-4l4 4" />
      </svg>
    ),
    label: 'Sube el documento firmado',
    desc: 'Carga el PDF firmado y guarda la definicion de metas para completar el proceso',
    color: 'bg-emerald-100 text-emerald-600',
    num: '4',
  },
];

export function SaveNotification({ employeeName, onClose }: SaveNotificationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'closable'>('enter');

  useEffect(() => {
    // card animates in
    const t1 = setTimeout(() => setPhase('show'), 50);
    // after 6s progress bar finishes → show X button
    const t2 = setTimeout(() => setPhase('closable'), 6050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* card */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          phase === 'enter'
            ? 'scale-75 opacity-0 translate-y-8'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
        style={{ width: 480 }}
      >
        {/* close button — only visible after progress finishes */}
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
        <div className="relative h-36 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center overflow-hidden px-6">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute top-3 left-5 w-14 h-14 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/50 flex items-center justify-center shadow-xl flex-shrink-0">
              <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                <polyline
                  points="10,24 20,34 38,14"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="save-checkmark"
                />
              </svg>
            </div>

            <div className="text-white">
              <p className="font-bold text-xl leading-tight">Guardado exitosamente</p>
              {employeeName && (
                <p className="text-white/80 text-sm mt-0.5">{employeeName}</p>
              )}
            </div>
          </div>
        </div>

        {/* next steps body */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
              Pasos siguientes
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
              : 'Lee los pasos siguientes antes de continuar'}
          </p>
        </div>

        {/* progress bar — runs once for 6s */}
        <div className="h-1.5 bg-slate-100">
          {phase !== 'enter' && (
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ animation: 'save-progress 6s linear forwards' }}
            />
          )}
        </div>

        <style>{`
          @keyframes save-progress {
            from { width: 100%; }
            to   { width: 0%; }
          }
          .save-checkmark {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: draw-check 0.5s ease-out 0.2s forwards;
          }
          @keyframes draw-check {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
