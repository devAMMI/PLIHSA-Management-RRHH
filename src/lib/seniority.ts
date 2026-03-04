export interface Seniority {
  years: number;
  months: number;
  days: number;
}

export function calculateWorkSeniority(hireDate: string | null | undefined): Seniority {
  if (!hireDate) {
    return { years: 0, months: 0, days: 0 };
  }

  const hire = new Date(hireDate);
  const today = new Date();

  if (hire > today) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = today.getFullYear() - hire.getFullYear();
  let months = today.getMonth() - hire.getMonth();
  let days = today.getDate() - hire.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

export function formatSeniority(seniority: Seniority | null | undefined): string {
  if (!seniority) {
    return 'N/A';
  }

  const { years, months, days } = seniority;

  if (years === 0 && months === 0 && days === 0) {
    return 'Nuevo ingreso';
  }

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  }

  return parts.join(', ');
}

export function formatSeniorityShort(seniority: Seniority | null | undefined): string {
  if (!seniority) {
    return 'N/A';
  }

  const { years, months } = seniority;

  if (years === 0 && months === 0) {
    return 'Nuevo';
  }

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years}a`);
  }

  if (months > 0) {
    parts.push(`${months}m`);
  }

  return parts.join(' ') || 'Nuevo';
}

export function formatSeniorityFromDate(hireDate: string | null | undefined): string {
  const seniority = calculateWorkSeniority(hireDate);
  return formatSeniority(seniority);
}

export function formatSeniorityShortFromDate(hireDate: string | null | undefined): string {
  const seniority = calculateWorkSeniority(hireDate);
  return formatSeniorityShort(seniority);
}
