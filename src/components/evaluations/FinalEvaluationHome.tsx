import { Building2, ClipboardCheck, Users } from 'lucide-react';

type EmployeeType = 'administrativo' | 'operativo';

interface FinalEvaluationHomeProps {
  onSelectType: (type: EmployeeType) => void;
}

export function FinalEvaluationHome({ onSelectType }: FinalEvaluationHomeProps) {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20"><ClipboardCheck className="h-8 w-8" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Cierre del ciclo anual</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Evaluación Final</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">Seleccione el tipo de colaborador que desea evaluar para continuar con el formulario correspondiente.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TypeCard type="administrativo" title="Administrativo" subtitle="Evaluación del Desempeño Administrativo" description="Evalúe metas individuales, resultados y comentarios del personal administrativo." icon={<Building2 className="h-7 w-7" />} color="blue" onSelect={onSelectType} />
          <TypeCard type="operativo" title="Operativo" subtitle="Evaluación del Desempeño Operativo" description="Evalúe metas, resultados y comentarios del personal operativo." icon={<Users className="h-7 w-7" />} color="orange" onSelect={onSelectType} />
        </div>
      </div>
    </div>
  );
}

function TypeCard({ type, title, subtitle, description, icon, color, onSelect }: { type: EmployeeType; title: string; subtitle: string; description: string; icon: React.ReactNode; color: 'blue' | 'orange'; onSelect: (type: EmployeeType) => void }) {
  const styles = color === 'blue' ? { panel: 'border-blue-200 bg-blue-50/70', icon: 'bg-blue-700', button: 'bg-blue-700 hover:bg-blue-800', accent: 'text-blue-700' } : { panel: 'border-orange-200 bg-orange-50/70', icon: 'bg-orange-600', button: 'bg-orange-600 hover:bg-orange-700', accent: 'text-orange-700' };
  return <div className={`group flex flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${styles.panel}`}><div className="flex items-start gap-4"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${styles.icon}`}>{icon}</div><div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className={`mt-1 text-sm font-semibold ${styles.accent}`}>{subtitle}</p></div></div><p className="mt-6 flex-1 text-sm leading-6 text-slate-600">{description}</p><button onClick={() => onSelect(type)} className={`mt-6 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors ${styles.button}`}>Iniciar evaluación</button></div>;
}
