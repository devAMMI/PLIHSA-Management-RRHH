export const TIMEZONE = 'America/Tegucigalpa';

export const getCurrentDateTimeHonduras = (): Date => {
  // Uses Intl to get the wall-clock time in Tegucigalpa, then builds a
  // plain Date whose UTC values equal those local components (no DST shift).
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0';
  const hour = get('hour') === '24' ? 0 : Number(get('hour'));
  return new Date(
    Number(get('year')), Number(get('month')) - 1, Number(get('day')),
    hour, Number(get('minute')), Number(get('second'))
  );
};

export const formatDateHonduras = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const day = String(hondurasDate.getDate()).padStart(2, '0');
  const month = String(hondurasDate.getMonth() + 1).padStart(2, '0');
  const year = hondurasDate.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateTimeHonduras = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const day = String(hondurasDate.getDate()).padStart(2, '0');
  const month = String(hondurasDate.getMonth() + 1).padStart(2, '0');
  const year = hondurasDate.getFullYear();

  const hours = String(hondurasDate.getHours()).padStart(2, '0');
  const minutes = String(hondurasDate.getMinutes()).padStart(2, '0');
  const seconds = String(hondurasDate.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatTimeHonduras = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const hours = String(hondurasDate.getHours()).padStart(2, '0');
  const minutes = String(hondurasDate.getMinutes()).padStart(2, '0');
  const seconds = String(hondurasDate.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

export const get12HourTimeHonduras = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  let hours = hondurasDate.getHours();
  const minutes = String(hondurasDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
};

export const getDateForInput = (): string => {
  const hondurasDate = getCurrentDateTimeHonduras();
  const year = hondurasDate.getFullYear();
  const month = String(hondurasDate.getMonth() + 1).padStart(2, '0');
  const day = String(hondurasDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getDayNameSpanish = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[hondurasDate.getDay()];
};

export const getMonthNameSpanish = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[hondurasDate.getMonth()];
};

export const getFullDateSpanish = (date?: Date | string): string => {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : getCurrentDateTimeHonduras();
  const hondurasDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));

  const dayName = getDayNameSpanish(hondurasDate);
  const day = hondurasDate.getDate();
  const monthName = getMonthNameSpanish(hondurasDate);
  const year = hondurasDate.getFullYear();

  return `${dayName}, ${day} de ${monthName} de ${year}`;
};
