export function todayIsoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatAED(value: number): string {
  return `AED ${value.toLocaleString('en-US')}`;
}
