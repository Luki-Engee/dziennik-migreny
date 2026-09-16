import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, ensureSeeded } from './db';
import type { Entry } from '../types';

const DB_NAME = 'dziennik-migreny';

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
});

describe('ensureSeeded', () => {
  it('populates default options and settings on a fresh database', async () => {
    await ensureSeeded();
    expect(await db.options.count()).toBeGreaterThan(0);
    const settings = await db.settings.get('settings');
    expect(settings).toMatchObject({ id: 'settings', theme: 'system', pinEnabled: false });
  });

  it('is idempotent (safe to call again without throwing on existing keys)', async () => {
    await ensureSeeded();
    const countBefore = await db.options.count();
    await expect(ensureSeeded()).resolves.not.toThrow();
    expect(await db.options.count()).toBe(countBefore);
  });
});

describe('schema migration v1 -> v2', () => {
  it('preserves entries created under the old schema and adds the updatedAt index', async () => {
    // Simuluje starszą wersję bazy (bez indeksu updatedAt), tak jak u użytkownika, który
    // zainstalował aplikację przed dodaniem tego indeksu.
    const legacyDb = new Dexie(DB_NAME);
    legacyDb.version(1).stores({
      entries: 'id, date',
      options: '[category+item.id], category',
      settings: 'id',
    });
    await legacyDb.open();
    const legacyEntry: Entry = {
      id: 'legacy-1',
      date: '2026-01-05',
      intensity: 4,
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
      createdAt: '2026-01-05T09:00:00.000Z',
      updatedAt: '2026-01-05T09:00:00.000Z',
    };
    await legacyDb.table('entries').put(legacyEntry);
    legacyDb.close();

    // Otwarcie właściwej bazy (v1+v2) powinno zmigrować istniejące dane i dodać indeks.
    await db.open();
    const migrated = await db.entries.get('legacy-1');
    expect(migrated).toMatchObject({ id: 'legacy-1', intensity: 4 });

    const sortedByUpdatedAt = await db.entries.orderBy('updatedAt').toArray();
    expect(sortedByUpdatedAt.map((e) => e.id)).toContain('legacy-1');
  });
});
