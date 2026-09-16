import { pl } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

export const localePl = pl;

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  return parseISO(s);
}

export function formatLongPl(d: Date): string {
  return format(d, 'EEE, d MMMM yyyy', { locale: pl }).toLowerCase();
}

export function formatMonthPl(d: Date): string {
  const s = format(d, 'LLLL yyyy', { locale: pl });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function todayISO(): string {
  return toISODate(new Date());
}
