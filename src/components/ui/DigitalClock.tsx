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
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        padding: '14px 22px',
        minWidth: '220px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', fontFamily: 'monospace', lineHeight: 1 }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.92)' }}>{hours}</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>:</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.92)' }}>{minutes}</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>:</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(96,165,250,0.85)', marginBottom: '2px' }}>{seconds}</span>
        </div>
        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.03em' }}>
          {dayName}, {dayNum} de {monthName} de {year}
        </div>
        <div style={{ marginTop: '2px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
          GMT -6 · América Central
        </div>
      </div>
    </div>
  );
}
