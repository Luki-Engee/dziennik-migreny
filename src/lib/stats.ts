import { differenceInCalendarDays, isWithinInterval, subMonths, subYears } from 'date-fns';
import type { Duration, Entry, OptionCategory, OptionItem } from '../types';
import { fromISODate } from './dates';

export type StatsRange = 'month' | '3m' | 'year';

export function rangeInterval(range: StatsRange, reference: Date = new Date()): { start: Date; end: Date } {
  const end = reference;
  const start = range === 'month' ? subMonths(end, 1) : range === '3m' ? subMonths(end, 3) : subYears(end, 1);
  return { start, end };
}

export function filterByRange(entries: Entry[], range: StatsRange, reference: Date = new Date()): Entry[] {
  const { start, end } = rangeInterval(range, reference);
  return entries.filter((e) => {
    const d = fromISODate(e.date);
    return isWithinInterval(d, { start, end });
  });
}

export function daysWithPain(entries: Entry[]): number {
  return new Set(entries.map((e) => e.date)).size;
}

export function avgIntensity(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.intensity, 0) / entries.length;
}

const DURATION_HOURS: Record<Duration, number | null> = {
  '<1h': 0.5,
  '1-4h': 2.5,
  '4-12h': 8,
  '12-24h': 18,
  '>24h': 30,
  trwa: null,
};

export function avgDurationHours(entries: Entry[]): number {
  const values = entries.map((e) => (e.duration ? DURATION_HOURS[e.duration] : null)).filter((v): v is number => v !== null);
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export interface RankItem {
  id: string;
  label: string;
  count: number;
}

export function rankOptions(entries: Entry[], field: 'triggers' | 'weather' | 'food', options: OptionItem[]): RankItem[] {
  const counts = new Map<string, number>();
  entries.forEach((e) => {
    e[field].forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  });
  const byId = new Map(options.map((o) => [o.id, o.label]));
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: byId.get(id) ?? id, count }))
    .sort((a, b) => b.count - a.count);
}

const WEEKDAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

export function byWeekday(entries: Entry[]): { label: string; count: number }[] {
  const counts = new Array(7).fill(0);
  entries.forEach((e) => {
    const jsDay = fromISODate(e.date).getDay(); // 0=Sun..6=Sat
    const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon..6=Sun
    counts[idx]++;
  });
  return WEEKDAY_LABELS.map((label, i) => ({ label, count: counts[i] }));
}

const TIME_BUCKETS = [
  { label: 'Noc (0–6)', from: 0, to: 6 },
  { label: 'Rano (6–12)', from: 6, to: 12 },
  { label: 'Popołudnie (12–18)', from: 12, to: 18 },
  { label: 'Wieczór (18–24)', from: 18, to: 24 },
];

export function byTimeOfDay(entries: Entry[]): { label: string; count: number }[] {
  return TIME_BUCKETS.map(({ label, from, to }) => ({
    label,
    count: entries.filter((e) => {
      if (!e.startTime) return false;
      const h = Number(e.startTime.split(':')[0]);
      return h >= from && h < to;
    }).length,
  }));
}

export function daysWithMeds(entries: Entry[]): number {
  return new Set(entries.filter((e) => e.meds.length > 0).map((e) => e.date)).size;
}

export interface MedEffectivenessRow {
  name: string;
  brak: number;
  troche: number;
  pomogl: number;
  calkowicie: number;
  total: number;
}

export function medEffectiveness(entries: Entry[]): MedEffectivenessRow[] {
  const map = new Map<string, MedEffectivenessRow>();
  entries.forEach((e) => {
    e.meds.forEach((m) => {
      const row = map.get(m.name) ?? { name: m.name, brak: 0, troche: 0, pomogl: 0, calkowicie: 0, total: 0 };
      row.total++;
      if (m.effect === 'brak') row.brak++;
      else if (m.effect === 'trochę') row.troche++;
      else if (m.effect === 'pomógł') row.pomogl++;
      else if (m.effect === 'całkowicie') row.calkowicie++;
      map.set(m.name, row);
    });
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface MenstruationStats {
  onPeriodPct: number;
  beforePeriodPct: number;
  total: number;
}

export function menstruationStats(entries: Entry[]): MenstruationStats {
  const total = entries.length;
  if (total === 0) return { onPeriodPct: 0, beforePeriodPct: 0, total: 0 };
  const periodDates = entries.filter((e) => e.menstruation).map((e) => fromISODate(e.date));
  const onPeriod = entries.filter((e) => e.menstruation).length;
  const beforePeriod = entries.filter((e) => {
    if (e.menstruation) return false;
    const d = fromISODate(e.date);
    return periodDates.some((pd) => {
      const diff = differenceInCalendarDays(pd, d);
      return diff >= 1 && diff <= 3;
    });
  }).length;
  return {
    onPeriodPct: (onPeriod / total) * 100,
    beforePeriodPct: (beforePeriod / total) * 100,
    total,
  };
}

export const HIGH_MED_DAYS_THRESHOLD = 10;
