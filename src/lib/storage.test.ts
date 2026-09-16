import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { storage } from './storage';
import type { Entry } from '../types';

beforeEach(async () => {
  await Dexie.delete('dziennik-migreny');
  await storage.init();
});

function entry(id: string, date: string): Entry {
  return {
    id,
    date,
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
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe('storage.saveEntry', () => {
  it('assigns an id and timestamps for a new entry', async () => {
    const saved = await storage.saveEntry({
      date: '2026-09-16',
      intensity: 6,
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
    });
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBe(saved.updatedAt);
  });

  it('keeps createdAt and bumps updatedAt when editing an existing entry', async () => {
    const created = await storage.saveEntry({ date: '2026-09-16', intensity: 3, locations: [], painType: [], aura: false, auraSymptoms: [], symptoms: [], triggers: [], weather: [], food: [], meds: [], reliefs: [] });
    const edited = await storage.saveEntry({ ...created, intensity: 9 });
    expect(edited.id).toBe(created.id);
    expect(edited.createdAt).toBe(created.createdAt);
  });
});

describe('storage.importAll', () => {
  it('replace mode clears existing entries before importing', async () => {
    await storage.saveEntry({ date: '2026-01-01', intensity: 1, locations: [], painType: [], aura: false, auraSymptoms: [], symptoms: [], triggers: [], weather: [], food: [], meds: [], reliefs: [] });
    await storage.importAll({ entries: [entry('backup-1', '2026-02-02')] }, 'replace');
    const all = await storage.listEntries();
    expect(all.map((e) => e.id)).toEqual(['backup-1']);
  });

  it('merge mode keeps existing entries and adds imported ones', async () => {
    const existing = await storage.saveEntry({ date: '2026-01-01', intensity: 1, locations: [], painType: [], aura: false, auraSymptoms: [], symptoms: [], triggers: [], weather: [], food: [], meds: [], reliefs: [] });
    await storage.importAll({ entries: [entry('backup-1', '2026-02-02')] }, 'merge');
    const all = await storage.listEntries();
    const ids = all.map((e) => e.id).sort();
    expect(ids).toEqual([existing.id, 'backup-1'].sort());
  });
});

describe('storage.deleteOption', () => {
  it('soft-deletes (hides) an option instead of removing it, so past entries keep their label', async () => {
    const opt = await storage.addOption('triggers', 'Test trigger');
    await storage.deleteOption('triggers', opt.id);
    const all = await storage.listOptions('triggers');
    const found = all.find((o) => o.id === opt.id);
    expect(found).toBeDefined();
    expect(found?.hidden).toBe(true);
  });
});
