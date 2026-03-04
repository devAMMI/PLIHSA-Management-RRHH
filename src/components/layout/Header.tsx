import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import {
  getCurrentDateTimeHonduras,
  get12HourTimeHonduras,
  getFullDateSpanish
} from '../../utils/dateTime';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentDateTimeHonduras());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDateTimeHonduras());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistema de Recursos Humanos
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center gap-2 text-slate-700 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {getFullDateSpanish(currentTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blue-600 tabular-nums">
                  {get12HourTimeHonduras(currentTime)}
                </span>
                <span className="text-xs text-slate-500 font-medium">GMT-6</span>
              </div>
            </div>
          </div>

          <div className="h-12 w-px bg-slate-200"></div>

          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Zona Horaria
            </div>
            <div className="text-sm font-semibold text-slate-700">
              Honduras
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
