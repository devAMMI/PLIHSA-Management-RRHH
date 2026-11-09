import { Building2, ClipboardCheck, FileCheck, FileEdit, List, Plus, Users } from 'lucide-react';

type EmployeeType = 'administrativo' | 'operativo';
type CardColor = 'teal' | 'orange';

interface FinalEvaluationHomeProps {
  onSelectType: (type: EmployeeType) => void;
}

const actionItems = [
  { label: 'Nueva Evaluación', icon: Plus },
  { label: 'Ver Evaluaciones', icon: List },
  { label: 'Borradores', icon: FileEdit },
  { label: 'Finalizadas', icon: FileCheck },
] as const;

export function FinalEvaluationHome({ onSelectType }: FinalEvaluationHomeProps) {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-center">
            <img src="/Logo_PLIHSA_BLUE.png" alt="PLIHSA" className="h-16 w-16 object-contain" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Cierre del ciclo anual</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Evaluación Final</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">Tercera etapa del ciclo anual. Seleccione el tipo de colaborador y la acción que desea realizar.</p>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col justify-center gap-8 md:flex-row">
          <EvaluationTypeCard
            type="administrativo"
            title="Administrativo"
            subtitle="Evaluación del Desempeño Administrativo"
            icon={<Building2 className="h-6 w-6" />}
            color="teal"
            onSelect={onSelectType}
          />
          <EvaluationTypeCard
            type="operativo"
            title="Operativo"
            subtitle="Evaluación del Desempeño Operativo"
            icon={<Users className="h-6 w-6" />}
            color="orange"
            onSelect={onSelectType}
          />
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-start gap-4">
            <ClipboardCheck className="mt-1 h-6 w-6 shrink-0 text-slate-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Ciclo de Evaluaciones Anual</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600"><span className="font-medium">1. Definición de Metas</span> → Establecimiento de objetivos. <span className="font-medium">2. Revisión</span> → Calificación del avance semestral. <span className="font-semibold text-slate-800">3. Evaluación Final</span> → Cierre y evaluación del año.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationTypeCard({ type, title, subtitle, icon, color, onSelect }: { type: EmployeeType; title: string; subtitle: string; icon: React.ReactNode; color: CardColor; onSelect: (type: EmployeeType) => void }) {
  const styles = color === 'teal'
    ? { panel: 'border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100', icon: 'bg-teal-600', action: 'hover:border-teal-500', actionIcon: 'from-teal-400 to-teal-600' }
    : { panel: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100', icon: 'bg-orange-600', action: 'hover:border-orange-500', actionIcon: 'from-orange-400 to-orange-600' };

  return (
    <div className={`w-full max-w-md rounded-3xl border p-6 shadow-lg ${styles.panel}`}>
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${styles.icon}`}>{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className={`text-sm ${color === 'teal' ? 'text-teal-700' : 'text-orange-700'}`}>{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actionItems.map(({ label, icon: ActionIcon }) => (
          <button key={label} onClick={() => onSelect(type)} className={`group flex flex-col items-center rounded-xl border-2 border-transparent bg-white p-5 text-center shadow-sm transition-all duration-300 hover:shadow-md ${styles.action}`}>
            <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${styles.actionIcon} text-white transition-transform group-hover:scale-110`}><ActionIcon className="h-7 w-7" /></div>
            <span className="text-xs font-bold text-slate-800">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
