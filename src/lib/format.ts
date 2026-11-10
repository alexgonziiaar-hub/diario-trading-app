export const pad = (v: number) => String(v).padStart(2, '0');

export const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '');

const thousands = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** +$1.204,50 */
export function money(v: number): string {
  const a = Math.round(Math.abs(v) * 100) / 100;
  const [int, dec] = (a % 1 ? a.toFixed(2) : String(a)).split('.');
  return sign(v) + '$' + thousands(int) + (dec ? ',' + dec : '');
}

/** 18,5 (sin signo) */
export function decimal(v: number): string {
  return String(Math.round(Math.abs(v) * 100) / 100).replace('.', ',');
}

/** +18,5 */
export const points = (v: number) => sign(v) + decimal(v);

/** +2,1R */
export function rMultiple(r: number | null | undefined): string {
  if (r === null || r === undefined || !Number.isFinite(r)) return '—';
  return sign(r) + Math.abs(r).toFixed(1).replace('.', ',') + 'R';
}

/** Acepta "25480", "25461.5", "25.461,50" */
export function parseNumber(input: string): number {
  let s = input.trim();
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

/* ---------- fechas ---------- */

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** YYYY-MM-DD en hora local */
export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 10 nov */
export const shortDate = (key: string) => {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

/** Mar 10 nov */
export const dayLabel = (key: string) => {
  const d = parseKey(key);
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

/** martes 10 de noviembre */
export const longDate = (key: string) => {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

/** Martes, 10 de noviembre */
export function longToday(d = new Date()): string {
  return `${cap(WEEKDAYS[d.getDay()])}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** Noviembre 2026 */
export const monthLabel = (year: number, month: number) => `${cap(MONTHS[month])} ${year}`;
export const monthName = (month: number) => MONTHS[month];

export function relativeDay(key: string, today = new Date()): string {
  const a = parseKey(key).getTime();
  const b = parseKey(dateKey(today)).getTime();
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

export const isWeekday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;

/* ---------- tiempos de vídeo ---------- */

export const toSeconds = (hms: string) => hms.split(':').reduce((acc, x) => acc * 60 + Number(x), 0);

/** 00:42:15 */
export function formatHMS(total: number): string {
  const s = Math.max(0, Math.floor(total));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** 0:47 */
export function formatMS(total: number): string {
  const s = Math.max(0, Math.floor(total));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
