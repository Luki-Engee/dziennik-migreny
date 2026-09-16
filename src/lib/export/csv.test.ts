import { describe, expect, it } from 'vitest';
import { entriesToCsv } from './csv';
import type { Entry, OptionCategory, OptionItem } from '../../types';

function makeOptions(overrides: Partial<Record<OptionCategory, OptionItem[]>> = {}): Record<OptionCategory, OptionItem[]> {
  const empty: OptionItem[] = [];
  return {
    locations: [],
    painType: [],
    auraSymptoms: [],
    symptoms: [],
    triggers: [],
    weather: [],
    food: [],
    reliefs: [],
    medNames: [],
    ...overrides,
  } as Record<OptionCategory, OptionItem[]>;
}

function makeEntry(partial: Partial<Entry>): Entry {
  return {
    id: 'e1',
    date: '2026-09-16',
    intensity: 7,
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
    createdAt: '2026-09-16T08:00:00.000Z',
    updatedAt: '2026-09-16T08:00:00.000Z',
    ...partial,
  };
}

describe('entriesToCsv', () => {
  it('uses semicolon separators and a Polish header row', () => {
    const csv = entriesToCsv([makeEntry({})], makeOptions());
    const [header] = csv.split('\r\n');
    expect(header).toContain('Data;Godzina;Czas trwania;Siła bólu');
    expect(header.split(';').length).toBeGreaterThan(10);
  });

  it('resolves option ids to their current labels', () => {
    const options = makeOptions({
      locations: [{ id: 'czolo', label: 'Czoło', hidden: false, order: 0, usageCount: 0 }],
    });
    const csv = entriesToCsv([makeEntry({ locations: ['czolo'] })], options);
    expect(csv).toContain('Czoło');
  });

  it('quotes fields containing the separator, quotes, or newlines', () => {
    const csv = entriesToCsv([makeEntry({ notes: 'Ból; "silny"\ni narastał' })], makeOptions());
    expect(csv).toContain('"Ból; ""silny""\ni narastał"');
  });

  it('renders a row per entry, independent of insertion order', () => {
    const csv = entriesToCsv(
      [makeEntry({ id: 'e1', date: '2026-09-16' }), makeEntry({ id: 'e2', date: '2026-09-17' })],
      makeOptions(),
    );
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toContain('2026-09-16');
    expect(lines[2]).toContain('2026-09-17');
  });
});
