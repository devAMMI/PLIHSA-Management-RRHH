import { useEffect, useState } from 'react';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function DigitalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const dayName = days[now.getDay()];
  const dayNum = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();

  return (
    <div className="bg-slate-900 text-white rounded-xl px-6 py-4 shadow-lg border border-slate-700 min-w-[240px]">
      <div className="text-center">
        <div className="flex items-end justify-center gap-1 font-mono leading-none">
          <span className="text-4xl font-bold tracking-wider text-white">{hours}</span>
          <span className="text-3xl font-bold text-slate-400 mb-0.5">:</span>
          <span className="text-4xl font-bold tracking-wider text-white">{minutes}</span>
          <span className="text-3xl font-bold text-slate-400 mb-0.5">:</span>
          <span className="text-2xl font-semibold tracking-wider text-blue-400 mb-0.5">{seconds}</span>
        </div>
        <div className="mt-2 text-slate-400 text-sm font-medium tracking-wide">
          {dayName}, {dayNum} de {monthName} de {year}
        </div>
        <div className="mt-1 text-slate-600 text-xs">
          GMT -6 · América Central
        </div>
      </div>
    </div>
  );
}
