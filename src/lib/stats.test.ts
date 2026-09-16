import { describe, expect, it } from 'vitest';
import {
  avgDurationHours,
  avgIntensity,
  byTimeOfDay,
  byWeekday,
  daysWithMeds,
  daysWithPain,
  medEffectiveness,
  menstruationStats,
  pressureByDay,
  rankOptions,
} from './stats';
import type { Entry } from '../types';

function makeEntry(partial: Partial<Entry>): Entry {
  return {
    id: partial.id ?? Math.random().toString(36),
    date: '2026-09-10',
    intensity: 5,
    locations: [],
    painType: [],
    aura: false,
    auraSymptoms: [],
    symptoms: [],
    triggers: [],
    weather: [],
    food: [],
    meds: [],
    reliefs: [],
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
    ...partial,
  };
}

describe('daysWithPain', () => {
  it('counts unique dates, not entries', () => {
    const entries = [
      makeEntry({ date: '2026-09-01' }),
      makeEntry({ date: '2026-09-01' }),
      makeEntry({ date: '2026-09-02' }),
    ];
    expect(daysWithPain(entries)).toBe(2);
  });
});

describe('avgIntensity', () => {
  it('averages intensity across entries', () => {
    const entries = [makeEntry({ intensity: 2 }), makeEntry({ intensity: 8 })];
    expect(avgIntensity(entries)).toBe(5);
  });

  it('returns 0 for empty input', () => {
    expect(avgIntensity([])).toBe(0);
  });
});

describe('avgDurationHours', () => {
  it('maps duration buckets to hours and ignores "trwa"', () => {
    const entries = [makeEntry({ duration: '<1h' }), makeEntry({ duration: '>24h' }), makeEntry({ duration: 'trwa' })];
    expect(avgDurationHours(entries)).toBeCloseTo((0.5 + 30) / 2);
  });
});

describe('rankOptions', () => {
  it('ranks by frequency, most used first', () => {
    const options = [
      { id: 'stres', label: 'Stres', hidden: false, order: 0, usageCount: 0 },
      { id: 'snu', label: 'Za mało snu', hidden: false, order: 1, usageCount: 0 },
    ];
    const entries = [
      makeEntry({ triggers: ['stres'] }),
      makeEntry({ triggers: ['stres', 'snu'] }),
      makeEntry({ triggers: ['snu'] }),
    ];
    const rank = rankOptions(entries, 'triggers', options);
    expect(rank[0]).toMatchObject({ label: 'Stres', count: 2 });
    expect(rank[1]).toMatchObject({ label: 'Za mało snu', count: 2 });
  });

  it('falls back to the raw id when the option label is missing (e.g. deleted option)', () => {
    const entries = [makeEntry({ triggers: ['nieznany-id'] })];
    const rank = rankOptions(entries, 'triggers', []);
    expect(rank[0]).toMatchObject({ id: 'nieznany-id', label: 'nieznany-id', count: 1 });
  });
});

describe('byWeekday', () => {
  it('buckets entries into Mon..Sun with Monday first', () => {
    // 2026-09-14 is a Monday, 2026-09-20 is a Sunday
    const entries = [makeEntry({ date: '2026-09-14' }), makeEntry({ date: '2026-09-20' })];
    const result = byWeekday(entries);
    expect(result[0]).toMatchObject({ label: 'Pon', count: 1 });
    expect(result[6]).toMatchObject({ label: 'Nie', count: 1 });
  });
});

describe('byTimeOfDay', () => {
  it('buckets by start hour', () => {
    const entries = [makeEntry({ startTime: '07:30' }), makeEntry({ startTime: '23:00' }), makeEntry({ startTime: undefined })];
    const result = byTimeOfDay(entries);
    expect(result.find((b) => b.label.startsWith('Rano'))?.count).toBe(1);
    expect(result.find((b) => b.label.startsWith('Wieczór'))?.count).toBe(1);
  });
});

describe('daysWithMeds', () => {
  it('counts unique days where at least one medication was taken', () => {
    const entries = [
      makeEntry({ date: '2026-09-01', meds: [{ name: 'Ibuprofen' }] }),
      makeEntry({ date: '2026-09-01', meds: [{ name: 'Paracetamol' }] }),
      makeEntry({ date: '2026-09-02', meds: [] }),
    ];
    expect(daysWithMeds(entries)).toBe(1);
  });
});

describe('medEffectiveness', () => {
  it('tallies effect categories per medication name', () => {
    const entries = [
      makeEntry({ meds: [{ name: 'Ibuprofen', effect: 'pomógł' }] }),
      makeEntry({ meds: [{ name: 'Ibuprofen', effect: 'brak' }] }),
    ];
    const rows = medEffectiveness(entries);
    expect(rows[0]).toMatchObject({ name: 'Ibuprofen', pomogl: 1, brak: 1, total: 2 });
  });
});

describe('menstruationStats', () => {
  it('computes percentage on period and in the 3 days before', () => {
    const entries = [
      makeEntry({ date: '2026-09-10', menstruation: true }),
      makeEntry({ date: '2026-09-08', menstruation: false }),
      makeEntry({ date: '2026-09-20', menstruation: false }),
    ];
    const stats = menstruationStats(entries);
    expect(stats.onPeriodPct).toBeCloseTo(100 / 3);
    expect(stats.beforePeriodPct).toBeCloseTo(100 / 3);
  });

  it('returns zeros for an empty list', () => {
    expect(menstruationStats([])).toEqual({ onPeriodPct: 0, beforePeriodPct: 0, total: 0 });
  });
});

describe('pressureByDay', () => {
  const withWeather = (partial: Partial<Entry>, pressureHpa: number) =>
    makeEntry({
      ...partial,
      autoWeather: { tempC: 15, pressureHpa, pressureDelta24h: -2, humidity: 60, windKph: 10, fetchedAt: '2026-09-10T00:00:00.000Z' },
    });

  it('ignores entries without captured weather data', () => {
    const entries = [makeEntry({ date: '2026-09-10' })];
    expect(pressureByDay(entries)).toEqual([]);
  });

  it('averages pressure and takes the max intensity per day, sorted by date', () => {
    const entries = [
      withWeather({ date: '2026-09-11', intensity: 3 }, 1000),
      withWeather({ date: '2026-09-10', intensity: 6 }, 1010),
      withWeather({ date: '2026-09-10', intensity: 9 }, 1020),
    ];
    const result = pressureByDay(entries);
    expect(result).toEqual([
      { date: '2026-09-10', intensity: 9, pressureHpa: 1015 },
      { date: '2026-09-11', intensity: 3, pressureHpa: 1000 },
    ]);
  });
});
