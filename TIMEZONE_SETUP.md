# Configuración de Zona Horaria GMT-6 (Honduras)

## Archivos Creados

### 1. `src/utils/dateTime.ts`
Utilidad completa para manejo de fechas y horas en zona horaria de Honduras (GMT-6 / America/Tegucigalpa).

#### Funciones Disponibles:

```typescript
// Obtener fecha y hora actual de Honduras
getCurrentDateTimeHonduras(): Date

// Formatear fecha: 04/03/2026
formatDateHonduras(date: Date | string | null): string

// Formatear fecha y hora: 04/03/2026 09:00:00
formatDateTimeHonduras(date: Date | string | null): string

// Formatear hora 24h: 09:00:00
formatTimeHonduras(date: Date | string | null): string

// Formatear hora 12h: 9:00 AM
get12HourTimeHonduras(date: Date | string | null): string

// Obtener fecha para input date: 2026-03-04
getDateForInput(): string

// Obtener nombre del día en español: "Martes"
getDayNameSpanish(date: Date | string): string

// Obtener nombre del mes en español: "Marzo"
getMonthNameSpanish(date: Date | string): string

// Fecha completa en español: "Martes, 4 de Marzo de 2026"
getFullDateSpanish(date?: Date | string): string
```

### 2. `src/components/layout/Header.tsx`
Componente de header con reloj en tiempo real.

#### Características:
- ⏰ Reloj que se actualiza cada segundo
- 📅 Fecha completa en español
- 🌍 Indicador de zona horaria GMT-6
- 🇭🇳 Identificación de país (Honduras)
- 🎨 Diseño profesional y responsive

### 3. `src/components/layout/Sidebar.tsx`
Sidebar actualizado con soporte para timezone.

## Cómo Integrar en App.tsx Existente

### Opción 1: Reemplazar Header Existente

```typescript
// En tu App.tsx existente
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, systemUser, employee, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const getViewTitle = () => {
    // Tu lógica existente de títulos
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        systemUser={systemUser}
        employee={employee}
        user={user}
        onSignOut={signOut}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getViewTitle()} />
        <main className="flex-1 overflow-y-auto p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
```

### Opción 2: Agregar Solo el Reloj

Si ya tienes un Header, puedes agregar solo el componente de reloj:

```typescript
import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import {
  getCurrentDateTimeHonduras,
  get12HourTimeHonduras,
  getFullDateSpanish
} from '../utils/dateTime';

function YourExistingHeader() {
  const [currentTime, setCurrentTime] = useState(getCurrentDateTimeHonduras());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDateTimeHonduras());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header>
      {/* Tu contenido existente */}

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        <span>{getFullDateSpanish(currentTime)}</span>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="text-2xl font-bold">
          {get12HourTimeHonduras(currentTime)}
        </span>
        <span className="text-xs">GMT-6</span>
      </div>
    </header>
  );
}
```

## Actualizar Componentes de Evaluación

Para usar las nuevas funciones de fecha en tus componentes de evaluación:

### EvaluacionAdministrativa.tsx

```typescript
import {
  formatDateHonduras,
  getDateForInput,
  getCurrentDateTimeHonduras
} from '../../utils/dateTime';

// Reemplazar la función formatDate existente
const formatDate = (date: string) => formatDateHonduras(date);

// Para obtener la fecha actual del sistema
const today = getDateForInput(); // Retorna formato YYYY-MM-DD para inputs

// Para timestamps
const now = getCurrentDateTimeHonduras();
```

### EvaluacionesPLIHSA.tsx

```typescript
import { formatDateHonduras } from '../../utils/dateTime';

// En el componente
const formatDate = (date: string) => formatDateHonduras(date);
```

## Ejemplo Visual del Header

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Sistema de Gestión                     📅 Martes, 4 de Marzo  │
│                                         🕐 9:00 AM GMT-6        │
│  Dashboard                              │ Honduras              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Verificación

Para verificar que todo está funcionando correctamente:

1. El reloj debe actualizarse cada segundo
2. La hora debe corresponder a GMT-6 (6 horas menos que UTC)
3. La fecha debe estar en español
4. A las 9:00 AM en Honduras debe mostrar "9:00 AM"

## Notas Importantes

- ✓ Todas las fechas se convierten automáticamente a zona horaria de Honduras
- ✓ El reloj se actualiza en tiempo real sin necesidad de recargar
- ✓ Compatible con React 18+
- ✓ No requiere librerías adicionales (usa API nativa de JavaScript)
- ✓ Formatos en español para mejor UX local

## Zona Horaria

- **País**: Honduras
- **Zona**: America/Tegucigalpa
- **UTC Offset**: GMT-6 (todo el año, sin DST)
- **Hora actual de referencia**: 9:00 AM
