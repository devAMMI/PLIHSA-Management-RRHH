import { useEffect, useState } from 'react';

interface SaveNotificationProps {
  employeeName?: string;
  onClose: () => void;
}

export function SaveNotification({ employeeName, onClose }: SaveNotificationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50);
    const t2 = setTimeout(() => setPhase('exit'), 3200);
    const t3 = setTimeout(() => onClose(), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* card */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          phase === 'enter'
            ? 'scale-75 opacity-0 translate-y-8'
            : phase === 'show'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 -translate-y-4'
        }`}
        style={{ width: 420 }}
      >
        {/* top gradient banner */}
        <div className="relative h-44 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute top-4 left-6 w-16 h-16 rounded-full bg-white/10" />

          {/* main icon */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center shadow-xl">
              <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none">
                {/* document icon */}
                <rect x="10" y="6" width="28" height="36" rx="3" fill="white" opacity="0.9" />
                <rect x="15" y="14" width="18" height="2.5" rx="1.25" fill="#059669" />
                <rect x="15" y="20" width="14" height="2.5" rx="1.25" fill="#059669" opacity="0.7" />
                <rect x="15" y="26" width="10" height="2.5" rx="1.25" fill="#059669" opacity="0.5" />
                {/* checkmark badge */}
                <circle cx="36" cy="36" r="10" fill="#059669" />
                <polyline
                  points="30,36 34,40 42,32"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="save-checkmark"
                />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-wide drop-shadow">
              Guardado
            </span>
          </div>
        </div>

        {/* body */}
        <div className="px-8 py-6 text-center">
          <p className="text-slate-800 font-semibold text-lg leading-snug">
            Definición de Metas guardada exitosamente
          </p>
          {employeeName && (
            <p className="text-slate-500 text-sm mt-1">
              para <span className="font-medium text-slate-700">{employeeName}</span>
            </p>
          )}
          <p className="text-slate-400 text-xs mt-3">
            Los cambios han sido registrados en el sistema
          </p>
        </div>

        {/* progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-emerald-500 origin-left"
            style={{ animation: 'save-progress 3.2s linear forwards' }}
          />
        </div>

        <style>{`
          @keyframes save-progress {
            from { width: 100%; }
            to   { width: 0%; }
          }
          .save-checkmark {
            stroke-dasharray: 24;
            stroke-dashoffset: 24;
            animation: draw-check 0.4s ease-out 0.3s forwards;
          }
          @keyframes draw-check {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
