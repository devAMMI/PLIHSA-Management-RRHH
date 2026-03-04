export function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return new Intl.DateTimeFormat('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Tegucigalpa'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return new Intl.DateTimeFormat('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Tegucigalpa'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
