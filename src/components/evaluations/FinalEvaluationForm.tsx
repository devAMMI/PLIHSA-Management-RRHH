import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ClipboardCheck, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Goal = { number: number; description: string; result: string; score: string; comments: string };

const scaleRows = [
  ['10', 'Excede Expectativas', 'Consistentemente desempeña y cumple los requerimientos más allá de los estándares, entregando resultados de alta calidad y excelencia.'],
  ['8–9', 'Cumple Expectativas', 'Consistentemente desempeña y cumple los requerimientos, entregando calidad en los resultados.'],
  ['6–7', 'Desempeño a Mejorar', 'No es consistente en el desempeño y cumplimiento de los requerimientos o entrega de resultados, pero demuestra deseo de mejorar su desempeño.'],
  ['1–5', 'Debajo de Expectativas', 'Falla consistentemente en el desempeño y cumplimiento de los requerimientos y no entrega resultados de calidad.'],
];

const newGoal = (number: number): Goal => ({ number, description: '', result: '', score: '', comments: '' });

export function FinalEvaluationForm() {
  const { employee } = useAuth();
  const [employeeName, setEmployeeName] = useState(employee ? `${employee.first_name} ${employee.last_name}` : '');
  const [position, setPosition] = useState(employee?.position || '');
  const [department, setDepartment] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [hireDate, setHireDate] = useState(employee?.hire_date || '');
  const [manager, setManager] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [goals, setGoals] = useState<Goal[]>([newGoal(1)]);
  const [message, setMessage] = useState('');

  const tenure = useMemo(() => calculateTenure(hireDate), [hireDate]);
  const updateGoal = (index: number, key: keyof Goal, value: string) => setGoals((current) => current.map((goal, goalIndex) => goalIndex === index ? { ...goal, [key]: value } : goal));
  const addGoal = () => setGoals((current) => [...current, newGoal(current.length + 1)]);

  return (
    <div className="min-h-full bg-slate-100 px-2 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden border border-slate-400 bg-white text-slate-900 shadow-sm">
        <header className="grid min-h-[92px] grid-cols-[190px_1fr_240px] border-b border-slate-400 max-md:grid-cols-[130px_1fr]">
          <div className="flex items-center justify-center border-r border-slate-400 p-3"><div className="flex h-16 w-44 items-center justify-center rounded-full bg-[#4e8ac7] text-3xl font-bold tracking-tight text-white max-md:h-12 max-md:w-28 max-md:text-xl">PLIHSA</div></div>
          <div className="flex items-center justify-center p-4 text-center"><h1 className="text-xl font-semibold max-sm:text-base">Evaluación del Desempeño Administrativo</h1></div>
          <div className="border-l border-slate-400 text-xs max-md:col-span-2 max-md:grid max-md:grid-cols-3 max-md:border-l-0">
            <DocMeta label="Código" value="PL-RH-P-002-F02" /><DocMeta label="Versión" value="01" /><DocMeta label="Fecha de Revisión" value="09/07/2025" />
          </div>
        </header>

        <section className="text-sm font-semibold">
          <InfoRow label="Nombre del Colaborador:" value={employeeName} onChange={setEmployeeName} />
          <InfoRow label="Posición del Colaborador:" value={position} onChange={setPosition} />
          <div className="grid grid-cols-2 max-md:grid-cols-1"><InfoRow label="Departamento:" value={department} onChange={setDepartment} /><InfoRow label="Sub-departamento:" value={subDepartment} onChange={setSubDepartment} /></div>
          <div className="grid grid-cols-2 max-md:grid-cols-1"><div className="grid grid-cols-[245px_1fr] max-md:grid-cols-[175px_1fr]"><BlueLabel>Fecha de Antigüedad<br /><span className="text-xs">(Día | Mes | Año)</span></BlueLabel><input type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} className="min-h-[68px] bg-[#d9d9d9] px-3 text-sm font-normal outline-none" /></div><div className="grid grid-cols-[1fr_166px] max-md:grid-cols-[175px_1fr]"><BlueLabel>Tiempo en la posición actual:</BlueLabel><div className="grid grid-cols-2 bg-[#d9d9d9] text-center"><div className="border-l border-slate-400 p-2">Año<div className="mt-2 h-8 border-t border-slate-400" /></div><div className="border-l border-slate-400 p-2">Meses<div className="mt-2 h-8 border-t border-slate-400" /></div></div></div></div>
          <div className="grid grid-cols-2 max-md:grid-cols-1"><InfoRow label="Jefe Inmediato:" value={manager} onChange={setManager} /><div className="grid grid-cols-[1fr_166px] max-md:grid-cols-[175px_1fr]"><BlueLabel>Fecha de Evaluación<br /><span className="text-xs">(Día | Mes | Año)</span></BlueLabel><input type="date" value={evaluationDate} onChange={(event) => setEvaluationDate(event.target.value)} className="bg-[#d9d9d9] px-3 text-sm font-normal outline-none" /></div></div>
        </section>

        <section className="border-t border-slate-400">
          <SectionTitle>Escala de Calificación- Para el Proceso de Evaluación del desempeño</SectionTitle>
          <div className="space-y-1 px-2 py-3 text-sm leading-5"><p>Excede Expectativas (10): Consistentemente desempeña y cumple los requerimientos más allá de los estándares, entregando resultados de alta calidad y excelencia.</p><p>Cumple Expectativas (8-9): Consistentemente desempeña y cumple los requerimientos, entregando calidad en los resultados.</p><p>Desempeño a Mejorar (6-7): No es consistente en el desempeño y cumplimiento de los requerimientos o entrega de resultados, pero demuestra deseo de mejorar su desempeño para cumplir los requerimientos y entregar resultados de calidad.</p><p>Debajo de Expectativas (1-5): Falla consistentemente en el desempeño y cumplimiento de los requerimientos y no entrega resultados de calidad.</p></div>
        </section>

        <section className="border-t border-slate-400">
          <SectionTitle centered>EVALUACION METAS INDIVIDUALES <span className="font-normal">(Valor 60%)</span></SectionTitle>
          {goals.map((goal, index) => <GoalBlock key={goal.number} goal={goal} onChange={(key, value) => updateGoal(index, key, value)} />)}
          <div className="border-t border-slate-400 p-3"><button onClick={addGoal} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">+ Agregar meta</button></div>
        </section>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-400 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white"><ChevronLeft className="h-4 w-4" /> Volver</button>
          <div className="flex items-center gap-3"><span className="text-sm text-slate-500">Antigüedad calculada: {tenure}</span><button onClick={() => setMessage('Borrador listo para guardarse en la siguiente etapa.')} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Save className="h-4 w-4" /> Guardar borrador</button></div>
        </footer>
        {message && <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
      </div>
    </div>
  );
}

function DocMeta({ label, value }: { label: string; value: string }) { return <div className="flex gap-1 border-b border-slate-300 p-2 last:border-b-0"><span className="font-semibold">{label}:</span><span>{value}</span></div>; }
function BlueLabel({ children }: { children: React.ReactNode }) { return <div className="flex items-center bg-[#24557e] px-2 py-2 text-white">{children}</div>; }
function SectionTitle({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) { return <div className={`bg-[#24557e] px-2 py-2 text-sm font-bold text-white ${centered ? 'text-center' : ''}`}>{children}</div>; }
function InfoRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="grid grid-cols-[245px_1fr] border-b border-slate-400 max-md:grid-cols-[175px_1fr]"><BlueLabel>{label}</BlueLabel><input value={value} onChange={(event) => onChange(event.target.value)} className="bg-[#d9d9d9] px-3 py-2 text-sm font-normal outline-none focus:bg-white" /></div>; }
function GoalBlock({ goal, onChange }: { goal: Goal; onChange: (key: keyof Goal, value: string) => void }) {
  return <div className="grid grid-cols-[195px_235px_1fr] border-t border-slate-400 max-md:grid-cols-1"><div className="bg-[#24557e] text-sm font-bold text-white"><div className="border-b border-white/30 p-2">Calificación Escala Numérica</div><div className="min-h-[107px] border-b border-white/30 p-2">Calificación según el criterio de la escala</div><div className="min-h-[105px] p-2">Comentarios Jefe Inmediato</div></div><div className="border-r border-slate-400 bg-white p-2 max-md:border-r-0"><label className="text-xs font-bold text-slate-600">Puntaje de la meta {goal.number}<select value={goal.score} onChange={(event) => onChange('score', event.target.value)} className="mt-2 h-10 w-full rounded border border-slate-400 px-2 text-sm font-semibold outline-none focus:border-blue-700"><option value="">Seleccionar</option>{Array.from({ length: 10 }, (_, score) => <option key={score + 1} value={String(score + 1)}>{score + 1}</option>)}</select></label><textarea rows={3} value={goal.comments} onChange={(event) => onChange('comments', event.target.value)} placeholder="Escriba el comentario" className="mt-7 w-full resize-none border border-slate-300 p-2 text-sm outline-none focus:border-blue-700" /></div><div className="min-w-0"><div className="border-b border-slate-400 bg-[#24557e] p-2 text-sm font-bold text-white">Meta No. {goal.number}</div><label className="block border-b border-slate-400 p-2 text-sm font-semibold">Descripción de la meta<textarea rows={3} value={goal.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Escriba aquí la meta definida" className="mt-1 w-full resize-none border border-slate-300 p-2 text-sm font-normal outline-none focus:border-blue-700" /></label><label className="block p-2 text-sm font-bold">Medición y Resultados:<textarea rows={4} value={goal.result} onChange={(event) => onChange('result', event.target.value)} placeholder="Describa la medición y los resultados obtenidos" className="mt-1 w-full resize-none border border-slate-300 p-2 text-sm font-normal outline-none focus:border-blue-700" /></label></div></div>;
}
function calculateTenure(value: string): string { if (!value) return 'Sin registrar'; const start = new Date(`${value}T00:00:00`); const now = new Date(); let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth(); if (now.getDate() < start.getDate()) months -= 1; if (months < 0) return 'Sin registrar'; const years = Math.floor(months / 12); const remainder = months % 12; return years ? `${years} año${years === 1 ? '' : 's'}${remainder ? ` y ${remainder} mes${remainder === 1 ? '' : 'es'}` : ''}` : `${remainder} mes${remainder === 1 ? '' : 'es'}`; }
